import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, GitPullRequest, MessageSquare, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

function StatCard({ icon: Icon, label, value, sub, color = 'text-ghost-accent' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-ghost-text-dim text-sm mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-ghost-text-dim text-xs mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 bg-ghost-border/40 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-ghost-text-dim" />
        </div>
      </div>
    </div>
  );
}

function DriftBadge({ score }) {
  const color = score >= 80 ? 'text-ghost-green' : score >= 60 ? 'text-ghost-yellow' : 'text-ghost-red';
  return <span className={`font-mono font-bold ${color}`}>{score ?? '—'}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  api.get('/dashboard')
    .then((r) => setData(r.data))
    .catch((err) => {
      console.error(err);
    })
    .finally(() => setLoading(false));
}, []);

  if (loading) return <div className="p-8 text-ghost-text-dim text-sm">Loading dashboard…</div>;

  const { repos = [], recentReviews = [], stats = {}, driftHistory = [] } = data || {};

  const chartData = driftHistory.map((d, i) => ({
    name: `#${i + 1}`,
    score: d.driftScore,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Hey, {user?.username} 👻</h1>
        <p className="text-ghost-text-dim text-sm mt-1">Here's your code consistency overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Activity} label="Avg Drift Score" value={Math.round(stats.avgDrift ?? 100)} sub="/ 100 — higher is better" />
        <StatCard icon={GitPullRequest} label="Total Reviews" value={stats.totalReviews ?? 0} color="text-ghost-text" />
        <StatCard icon={MessageSquare} label="Style Comments" value={stats.totalComments ?? 0} color="text-ghost-text" />
        <StatCard icon={TrendingUp} label="Repos Connected" value={repos.length} color="text-ghost-text" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Drift over time */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4 text-sm text-ghost-text-dim uppercase tracking-wider">Style Consistency Over Time</h2>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#8892b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#141720', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#8892b0' }}
                  itemStyle={{ color: '#7c5cfc' }}
                />
                <Line type="monotone" dataKey="score" stroke="#7c5cfc" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-ghost-text-dim text-sm">
              Complete a few reviews to see your trend.
            </div>
          )}
        </div>

        {/* Repos overview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-ghost-text-dim uppercase tracking-wider">Connected Repos</h2>
            <Link to="/repos" className="text-ghost-accent text-xs hover:underline">Manage →</Link>
          </div>
          {repos.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center gap-3">
              <p className="text-ghost-text-dim text-sm">No repos connected yet.</p>
              <Link to="/repos" className="btn-primary text-sm">Connect a repo</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {repos.slice(0, 5).map(repo => (
                <div key={repo._id} className="flex items-center justify-between py-2 border-b border-ghost-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-ghost-text">{repo.name}</p>
                    <p className="text-xs text-ghost-text-dim font-mono">{repo.scanStatus}</p>
                  </div>
                  <DriftBadge score={repo.driftScore} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent reviews */}
      <div className="card p-5">
        <h2 className="font-semibold text-sm text-ghost-text-dim uppercase tracking-wider mb-4">Recent Reviews</h2>
        {recentReviews.length === 0 ? (
          <p className="text-ghost-text-dim text-sm py-4 text-center">No reviews yet — open a PR in a connected repo!</p>
        ) : (
          <div className="space-y-2">
            {recentReviews.map(r => (
              <Link
                key={r._id}
                to={`/reviews/${r._id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-ghost-border/20 transition-colors group"
              >
                <div className="w-8 h-8 bg-ghost-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <GitPullRequest size={14} className="text-ghost-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.prTitle || `PR #${r.prNumber}`}</p>
                  <p className="text-xs text-ghost-text-dim">{r.repoId?.fullName}</p>
                </div>
                <div className="text-right shrink-0">
                  <DriftBadge score={r.driftScore} />
                  <p className="text-xs text-ghost-text-dim mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <ExternalLink size={13} className="text-ghost-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
