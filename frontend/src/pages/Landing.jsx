import { Ghost, Zap, Code2, GitPullRequest, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: Code2, title: 'Learns Your Style', desc: 'AST-level analysis across your repos builds a personal coding fingerprint — naming, patterns, structure.' },
  { icon: GitPullRequest, title: 'Reviews Your PRs', desc: 'GitHub bot auto-reviews every PR against YOUR standards. Posted as inline comments, just like a human reviewer.' },
  { icon: Zap, title: 'Drift Alerts', desc: "Flags when you deviate from your own patterns, with references to how you've done it before." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ghost-bg text-ghost-text font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-ghost-border/50">
        <div className="flex items-center gap-2">
          <Ghost className="text-ghost-accent" size={20} />
          <span className="font-semibold tracking-tight">GitGhost</span>
        </div>
        <a href="/auth/github" className="btn-primary flex items-center gap-2 text-sm">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          Get Started Free
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-8 pt-28 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-ghost-accent/10 border border-ghost-accent/30 text-ghost-accent text-xs font-mono px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-ghost-accent rounded-full animate-pulse" />
          AI-powered • Style-aware • GitHub-native
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          The code reviewer that<br />
          <span className="text-ghost-accent">knows you.</span>
        </h1>
        <p className="text-ghost-text-dim text-lg mb-10 leading-relaxed">
          GitHub Copilot knows code. GitGhost knows <em>you</em>.<br />
          It learns your naming conventions, your patterns, your architecture — then reviews every PR like you would.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="/auth/github" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            Connect GitHub — it's free
          </a>
          <a href="#how" className="btn-ghost flex items-center gap-2 text-base px-6 py-3">
            See how it works <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="max-w-4xl mx-auto px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-9 h-9 bg-ghost-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="text-ghost-accent" size={18} />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-ghost-text-dim text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <div className="border-t border-ghost-border text-center py-12 px-8">
        <p className="text-ghost-text-dim text-sm font-mono">
          "The best way to stand out is to build something that makes people ask — <span className="text-ghost-accent">wait, how did you do that?</span>"
        </p>
        <p className="text-ghost-text-dim/50 text-xs mt-3">— Jai Surya Kumar, GitGhost</p>
      </div>
    </div>
  );
}
