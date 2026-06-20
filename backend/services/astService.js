/**
 * Style Fingerprinter
 * Parses JS/TS files using @babel/parser and extracts statistical patterns
 * to build a developer's "coding fingerprint".
 */

let parse, traverse;
try {
  parse = require('@babel/parser').parse;
  traverse = require('@babel/traverse').default;
} catch {
  console.warn('⚠️  @babel/parser not installed — AST analysis will be skipped');
}

/**
 * Detect naming convention from a list of identifiers
 */
function detectNamingConvention(names) {
  if (!names.length) return 'unknown';
  const scores = { camelCase: 0, PascalCase: 0, snake_case: 0, SCREAMING_SNAKE: 0, 'kebab-case': 0 };
  for (const name of names) {
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) scores.PascalCase++;
    else if (/^[a-z][a-zA-Z0-9]*$/.test(name) && name.includes('_') === false) scores.camelCase++;
    else if (/^[a-z][a-z0-9_]*$/.test(name)) scores.snake_case++;
    else if (/^[A-Z][A-Z0-9_]*$/.test(name)) scores.SCREAMING_SNAKE++;
    else if (/^[a-z][a-z0-9-]*$/.test(name)) scores['kebab-case']++;
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Analyse a single JS/TS file and return raw metrics
 */
function analyseFile(code, filename) {
  const result = {
    functionNames: [],
    variableNames: [],
    functionLengths: [],
    nestingDepths: [],
    arrowFunctions: 0,
    regularFunctions: 0,
    asyncFunctions: 0,
    hasSemicolons: null,
    quoteStyle: null,
    commentLines: 0,
    totalLines: code.split('\n').length,
  };

  if (!parse) return result;

  // Count comments in raw source
  const commentMatches = code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || [];
  result.commentLines = commentMatches.length;

  // Detect quote style from raw source
  const singleQuotes = (code.match(/'/g) || []).length;
  const doubleQuotes = (code.match(/"/g) || []).length;
  const backticks = (code.match(/`/g) || []).length;
  if (singleQuotes > doubleQuotes && singleQuotes > backticks) result.quoteStyle = 'single';
  else if (doubleQuotes > singleQuotes) result.quoteStyle = 'double';
  else result.quoteStyle = 'template';

  // Detect semicolons
  const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
  const withSemi = lines.filter(l => l.trimEnd().endsWith(';')).length;
  result.hasSemicolons = withSemi / lines.length > 0.5 ? 'always' : 'never';

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
      errorRecovery: true,
    });

    let currentDepth = 0;
    let maxDepth = 0;

    traverse(ast, {
      // Track nesting depth
      BlockStatement: {
        enter() { currentDepth++; maxDepth = Math.max(maxDepth, currentDepth); },
        exit() { currentDepth--; },
      },

      // Arrow functions
      ArrowFunctionExpression(path) {
        result.arrowFunctions++;
        const start = path.node.loc?.start?.line || 0;
        const end = path.node.loc?.end?.line || 0;
        result.functionLengths.push(end - start);
        if (path.node.async) result.asyncFunctions++;
        const parent = path.parent;
        if (parent.type === 'VariableDeclarator' && parent.id?.name) {
          result.functionNames.push(parent.id.name);
        }
      },

      // Regular functions
      FunctionDeclaration(path) {
        result.regularFunctions++;
        const start = path.node.loc?.start?.line || 0;
        const end = path.node.loc?.end?.line || 0;
        result.functionLengths.push(end - start);
        if (path.node.async) result.asyncFunctions++;
        if (path.node.id?.name) result.functionNames.push(path.node.id.name);
      },

      // Variable declarations
      VariableDeclarator(path) {
        if (path.node.id?.name) result.variableNames.push(path.node.id.name);
      },
    });

    result.nestingDepths.push(maxDepth);
  } catch (err) {
    // Silently skip unparseable files
  }

  return result;
}

/**
 * Aggregate metrics from multiple files into a style profile
 */
function buildStyleProfile(fileResults) {
  const all = {
    functionNames: [],
    variableNames: [],
    functionLengths: [],
    nestingDepths: [],
    arrowFunctions: 0,
    regularFunctions: 0,
    asyncFunctions: 0,
    commentLines: 0,
    totalLines: 0,
    semiVotes: { always: 0, never: 0 },
    quoteVotes: { single: 0, double: 0, template: 0 },
  };

  for (const r of fileResults) {
    all.functionNames.push(...r.functionNames);
    all.variableNames.push(...r.variableNames);
    all.functionLengths.push(...r.functionLengths);
    all.nestingDepths.push(...r.nestingDepths);
    all.arrowFunctions += r.arrowFunctions;
    all.regularFunctions += r.regularFunctions;
    all.asyncFunctions += r.asyncFunctions;
    all.commentLines += r.commentLines;
    all.totalLines += r.totalLines;
    if (r.hasSemicolons) all.semiVotes[r.hasSemicolons]++;
    if (r.quoteStyle) all.quoteVotes[r.quoteStyle]++;
  }

  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const patterns = [];
  const totalFns = all.arrowFunctions + all.regularFunctions;
  if (totalFns > 0) {
    const arrowRatio = all.arrowFunctions / totalFns;
    patterns.push(arrowRatio > 0.7 ? 'strongly prefers arrow functions' : arrowRatio < 0.3 ? 'prefers traditional function declarations' : 'mixes arrow and regular functions');
    const asyncRatio = all.asyncFunctions / totalFns;
    if (asyncRatio > 0.4) patterns.push('heavy use of async/await');
  }
  const commentDensity = all.totalLines > 0 ? Math.round((all.commentLines / all.totalLines) * 100) : 0;
  if (commentDensity > 20) patterns.push('well-commented codebase');
  else if (commentDensity < 5) patterns.push('minimal comments');

  return {
    namingConventions: {
      functions: detectNamingConvention(all.functionNames),
      variables: detectNamingConvention(all.variableNames),
    },
    avgFunctionLength: avg(all.functionLengths),
    avgNestingDepth: avg(all.nestingDepths),
    commentDensity,
    semicolonUsage: all.semiVotes.always >= all.semiVotes.never ? 'always' : 'never',
    quoteStyle: Object.entries(all.quoteVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'single',
    patterns,
    filesAnalysed: fileResults.length,
    totalLines: all.totalLines,
  };
}

module.exports = { analyseFile, buildStyleProfile };
