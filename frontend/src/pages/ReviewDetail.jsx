import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const SEVERITY_STYLES = {
  error:   { icon: AlertCircle, bg: 'bg-ghost-red/10', border: 'border-ghost-red/30', text: 'text-ghost-red', label: 'ERROR' },
  warning: { icon: AlertTriangle, bg: 'bg-ghost-yellow/10', border: 'border-ghost-yellow/30', text: 'text-ghost-yellow', label: 'WARN' },
  info:    { icon: Info, bg: 'bg-ghost-accent/10', border: 'border-ghost-accent/30', text: 'text-ghost-accent', label: 'INFO' },
};

function Comment({ c }) {
  const s = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.info;
  const Icon = s.icon;
  return (
    <div className={`rounded-lg border ${s.bg} ${s.border} p-4`}>
      <div className="flex items-start gap-3">
        <Icon size={15} className={`${s.text} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`badge ${s.bg} ${s.text} font-mono`}>{s.label}</span>
            <span className="text-xs text-ghost-text-dim font-mono">{c.file}{c.line ? `:${c.line}` : ''}</span>
            {c.type && <span className="badge bg-ghost-border text-ghost-text-dim">{c.type}</span>}
          </div>
          <p className="text-sm text-ghost-text">{c.message}</p>
          {c.suggestion && (
            <p className="text-sm text-ghost-text-dim mt-2">
              <span className="text-ghost-green">💡 </span>{c.suggestion}
            </p>
          )}
          {c.pastExample && (
            <p className="text-xs text-ghost-text-dim/70 mt-2 italic border-l-2 border-ghost-muted pl-2">{c.pastExample}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewDetail() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/reviews/${id}`).then(r => setReview(r.data.review)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-ghost-text-dim text-sm">Loading review…</div>;
  if (!review) return <div className="p-8 text-ghost-red text-sm">Review not found.</div>;

  const score = review.driftScore;
  const scoreColor = score >= 80 ? 'text-ghost-green' : score >= 60 ? 'text-ghost-yellow' : 'text-ghost-red';
  const errors = review.comments?.filter(c => c.severity === 'error') || [];
  const warnings = review.comments?.filter(c => c.severity === 'warning') || [];
  const infos = review.comments?.filter(c => c.severity === 'info') || [];

  const typeCounts = ['naming', 'style', 'pattern', 'structure', 'suggestion']
    .map(t => ({ type: t, count: review.comments?.filter(c => c.type === t).length || 0 }))
    .filter(t => t.count > 0);
  const maxCount = Math.max(...typeCounts.map(c => c.count), 1);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/reviews" className="flex items-center gap-2 text-ghost-text-dim hover:text-ghost-text text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Reviews
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-ghost-text-dim mb-1">{review.repoId?.fullName}</p>
            <h1 className="text-xl font-bold mb-1">{review.prTitle || `PR #${review.prNumber}`}</h1>
            <p className="text-xs text-ghost-text-dim">
              {review.filesReviewed} files · {review.linesChanged} lines · {new Date(review.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-4xl font-bold font-mono ${scoreColor}`}>{score}</p>
            <p className="text-xs text-ghost-text-dim">/ 100</p>
            <p className="text-xs text-ghost-text-dim mt-0.5">drift score</p>
          </div>
        </div>
        {review.prUrl && (
          <a href={review.prUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-ghost-accent text-xs mt-3 hover:underline">
            View on GitHub <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Summary */}
      {review.summary && (
        <div className="card p-5 mb-6 border-l-4 border-ghost-accent">
          <p className="text-xs text-ghost-text-dim font-mono uppercase mb-2">Review Summary</p>
          <p className="text-sm text-ghost-text leading-relaxed">{review.summary}</p>
        </div>
      )}

      {/* Type Breakdown */}
      {typeCounts.length > 0 && (
        <div className="card p-5 mb-6">
          <p className="text-xs text-ghost-text-dim font-mono uppercase mb-4">Comment breakdown</p>
          <div className="space-y-2.5">
            {typeCounts.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs text-ghost-text-dim w-20 capitalize">{type}</span>
                <div className="flex-1 bg-ghost-border/30 rounded-full h-1.5">
                  <div
                    className="bg-ghost-accent h-1.5 rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-ghost-text-dim w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Errors', count: errors.length, color: 'text-ghost-red' },
          { label: 'Warnings', count: warnings.length, color: 'text-ghost-yellow' },
          { label: 'Info', count: infos.length, color: 'text-ghost-accent' },
        ].map(({ label, count, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-2xl font-bold font-mono ${color}`}>{count}</p>
            <p className="text-xs text-ghost-text-dim mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Comments */}
      {review.comments?.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle size={32} className="text-ghost-green mx-auto mb-3" />
          <p className="text-ghost-text font-medium">Perfect consistency!</p>
          <p className="text-ghost-text-dim text-sm mt-1">No style drift detected in this PR.</p>
        </div>
      ) : (
        <div>
          <h2 className="font-semibold text-sm text-ghost-text-dim uppercase tracking-wider mb-3">
            Style Comments ({review.comments?.length})
          </h2>
          <div className="space-y-3">
            {review.comments?.map((c, i) => <Comment key={i} c={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}