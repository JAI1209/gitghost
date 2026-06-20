import { useEffect, useState } from 'react';
import { GitBranch, Plus, Trash2, RefreshCw, Lock, Globe, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../utils/api';

const STATUS_ICON = {
  complete: <CheckCircle size={14} className="text-ghost-green" />,
  scanning: <Loader2 size={14} className="text-ghost-accent animate-spin" />,
  pending: <Clock size={14} className="text-ghost-yellow" />,
  error: <AlertCircle size={14} className="text-ghost-red" />,
};

export default function Repos() {
  const [connected, setConnected] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [connecting, setConnecting] = useState(null);

  const fetchConnected = () => api.get('/repos').then(r => setConnected(r.data.repos));

  useEffect(() => { fetchConnected(); }, []);

  const openPicker = async () => {
    setShowPicker(true);
    setLoadingAvail(true);
    try {
      const r = await api.get('/repos/available');
      setAvailable(r.data.repos);
    } finally {
      setLoadingAvail(false);
    }
  };

  const connect = async (repo) => {
    setConnecting(repo.id);
    try {
      await api.post('/repos', {
        githubRepoId: repo.id,
        fullName: repo.fullName,
        name: repo.name,
        description: repo.description,
        private: repo.private,
        language: repo.language,
        defaultBranch: repo.defaultBranch,
      });
      setShowPicker(false);
      fetchConnected();
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = async (id) => {
    if (!confirm('Disconnect this repo?')) return;
    await api.delete(`/repos/${id}`);
    fetchConnected();
  };

  const rescan = async (id) => {
    await api.post(`/repos/${id}/scan`);
    fetchConnected();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Repositories</h1>
          <p className="text-ghost-text-dim text-sm mt-1">Connect repos for GitGhost to learn and review.</p>
        </div>
        <button onClick={openPicker} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Add Repository
        </button>
      </div>

      {/* Connected repos */}
      {connected.length === 0 ? (
        <div className="card p-12 text-center">
          <GitBranch size={36} className="text-ghost-muted mx-auto mb-4" />
          <p className="text-ghost-text-dim mb-4">No repos connected. Add one to get started.</p>
          <button onClick={openPicker} className="btn-primary text-sm">Connect your first repo</button>
        </div>
      ) : (
        <div className="space-y-3">
          {connected.map(repo => (
            <div key={repo._id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-ghost-accent/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <GitBranch size={16} className="text-ghost-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-ghost-text">{repo.fullName}</h3>
                    {repo.private
                      ? <span className="badge bg-ghost-border text-ghost-text-dim flex items-center gap-1"><Lock size={9} />private</span>
                      : <span className="badge bg-ghost-border text-ghost-text-dim flex items-center gap-1"><Globe size={9} />public</span>}
                    {repo.language && <span className="badge bg-ghost-accent/10 text-ghost-accent">{repo.language}</span>}
                  </div>

                  {/* Scan status */}
                  <div className="flex items-center gap-2 mt-2">
                    {STATUS_ICON[repo.scanStatus]}
                    <span className="text-xs text-ghost-text-dim capitalize">{repo.scanStatus}</span>
                    {repo.driftScore !== undefined && repo.scanStatus === 'complete' && (
                      <span className="text-xs text-ghost-text-dim ml-2">Drift score: <span className="text-ghost-green font-mono font-bold">{repo.driftScore}</span></span>
                    )}
                  </div>

                  {/* Style summary */}
                  {repo.styleProfile?.summary && (
                    <p className="text-xs text-ghost-text-dim mt-2 leading-relaxed border-l-2 border-ghost-accent/30 pl-3 italic">
                      {repo.styleProfile.summary}
                    </p>
                  )}

                  {/* Style chips */}
                  {repo.styleProfile?.patterns?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {repo.styleProfile.patterns.slice(0, 4).map(p => (
                        <span key={p} className="badge bg-ghost-border/60 text-ghost-text-dim">{p}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => rescan(repo._id)} className="p-2 text-ghost-text-dim hover:text-ghost-accent transition-colors" title="Re-scan">
                    <RefreshCw size={14} />
                  </button>
                  <button onClick={() => disconnect(repo._id)} className="p-2 text-ghost-text-dim hover:text-ghost-red transition-colors" title="Disconnect">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Repo picker modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowPicker(false)}>
          <div className="card w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-ghost-border">
              <h2 className="font-semibold">Add a Repository</h2>
              <button onClick={() => setShowPicker(false)} className="text-ghost-text-dim hover:text-ghost-text">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              {loadingAvail ? (
                <div className="py-12 text-center text-ghost-text-dim text-sm flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading your repos…
                </div>
              ) : available.length === 0 ? (
                <p className="py-8 text-center text-ghost-text-dim text-sm">All repos are already connected.</p>
              ) : (
                available.map(repo => (
                  <div key={repo.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-ghost-border/20">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{repo.fullName}</p>
                      <p className="text-xs text-ghost-text-dim">{repo.language || 'Unknown'} {repo.private ? '· private' : ''}</p>
                    </div>
                    <button
                      onClick={() => connect(repo)}
                      disabled={connecting === repo.id}
                      className="btn-primary text-xs px-3 py-1.5 ml-4 shrink-0 flex items-center gap-1"
                    >
                      {connecting === repo.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      Connect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
