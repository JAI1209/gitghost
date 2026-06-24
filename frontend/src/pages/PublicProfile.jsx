import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Github, GitPullRequest, Activity, GitBranch } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const scoreColor = (s) =>
  s >= 80 ? 'text-ghost-green' : s >= 60 ? 'text-ghost-yellow' : 'text-ghost-red';

export default function PublicProfile() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/profile/${username}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div className="min-h-screen bg-ghost-bg flex items-center justify-center text-ghost-text-dim text-sm">
      Loading profile...
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-ghost-bg flex flex-col items-center justify-center gap-3">
      <p className="text-4xl">👻</p>
      <p className="text-ghost-text font-semibold">User not found</p>
      <p className="text-ghost-text-dim text-sm">@{username} doesn't exist on GitGhost</p>
    </div>
  );

  const { user, stats, repos, recentReviews } = data;

  return (
    <div className="min-h-screen bg-ghost-bg text-ghost-text">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          {user.avatar
            ? <img src={user.avatar} className="w-16 h-16 rounded-full border-2 border-ghost-border" alt={user.username} />
            : <div className="w-16 h-16 rounded-full bg-ghost-card border-2 border-ghost-border flex items-center justify-center text-2xl">👻</div>
          }
          <div>
            <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
            <div className="flex items-center gap-3 mt-1">
              
                href={`https://github.com/${user.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-ghost-text-dim text-sm hover:text-ghost-accent transition-colors"
              
                <Github size={13} /> @{user.username}
              
              <span className="text-ghost-border">·</span>
              <span className="text-xs text-ghost-text-dim capitalize bg-ghost-card border border-ghost-border px-2 py-0.5 rounded-full">
                {user.plan} plan
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Activity, label: 'Avg drift score', val: stats.avgDrift ?? '—', color: stats.avgDrift ? scoreColor(stats.avgDrift) : 'text-ghost-text' },
            { icon: GitPullRequest, label: 'Total reviews', val: stats.totalReviews, color: 'text-ghost-text' },
            { icon: GitBranch, label: 'Repos connected', val: stats.reposConnected, color: 'text-ghost-text' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold font-mono ${color}`}>{val}</p>
              <p className="text-xs text-ghost-text-dim mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Repos */}
        {repos.length > 0 && (
          <div className="card p-5 mb-6">
            <h2 className="text-xs font-mono text-ghost-text-dim uppercase tracking-wider mb-4">Repositories</h2>
            <div className="space-y-3">
              {repos.map((repo) => (
                <div key={repo._id} className="flex items-center justify-between py-2 border-b border-ghost-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{repo.name}</p>
                    <p className="text-xs text-ghost-text-dim font-mono">{repo.fullName}</p>
                  </div>
                  {repo.driftScore != null && (
                    <span className={`font-mono font-bold text-sm ${scoreColor(repo.driftScore)}`}>
                      {repo.driftScore}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Reviews */}
        {recentReviews.length > 0 && (
          <div className="card p-5 mb-10">
            <h2 className="text-xs font-mono text-ghost-text-dim uppercase tracking-wider mb-4">Recent Reviews</h2>
            <div className="space-y-2">
              {recentReviews.map((r) => (
                <div key={r._id} className="flex items-center justify-between py-2 border-b border-ghost-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.prTitle || `PR #${r.prNumber}`}</p>
                    <p className="text-xs text-ghost-text-dim">{r.repoId?.fullName}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {r.driftScore != null && (
                      <span className={`font-mono font-bold text-sm ${scoreColor(r.driftScore)}`}>
                        {r.driftScore}
                      </span>
                    )}
                    <p className="text-xs text-ghost-text-dim mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-ghost-text-dim text-xs mb-3">Powered by</p>
          <a href="https://gitghost-ten.vercel.app" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-ghost-accent font-semibold hover:underline">
            👻 GitGhost
          </a>
          <p className="text-ghost-text-dim text-xs mt-2">AI code reviewer that knows your style</p>
        </div>

      </div>
    </div>
  );
}