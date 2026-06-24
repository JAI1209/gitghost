import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const scoreClass = (s) => {
  if (s >= 75) return "text-green-400";
  if (s >= 50) return "text-yellow-400";
  return "text-red-400";
};

const statusStyles = {
  complete: "bg-green-900/40 text-green-400",
  error: "bg-red-900/40 text-red-400",
  pending: "bg-yellow-900/40 text-yellow-400",
  processing: "bg-blue-900/40 text-blue-400",
};

export default function ReviewsDashboard() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [repoFilter, setRepoFilter] = useState("all");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const repos = ["all", ...new Set(reviews.map((r) => r.repoId?.fullName).filter(Boolean))];

  const fetchReviews = async (repoId, pg) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: LIMIT, page: pg });
    if (repoId !== "all") params.set("repoId", repoId);
    const res = await fetch(`${API}/api/reviews?${params}`, { credentials: "include" });
    const data = await res.json();
    setReviews(data.reviews || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(repoFilter, page); }, [repoFilter, page]);

  const complete = reviews.filter((r) => r.status === "complete");
  const avgScore = complete.length
    ? Math.round(complete.reduce((a, r) => a + (r.driftScore || 0), 0) / complete.length)
    : null;
  const totalFiles = reviews.reduce((a, r) => a + (r.filesReviewed || 0), 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">PR reviews</h1>
      <p className="text-gray-400 text-sm mb-6">Every PR GitGhost has reviewed, sorted by date</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total reviews", val: total },
          { label: "Avg drift score", val: avgScore ?? "—" },
          { label: "Files reviewed", val: totalFiles },
          { label: "Completed", val: complete.length },
        ].map(({ label, val }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-semibold">{val}</p>
          </div>
        ))}
      </div>

      {/* Repo filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {repos.map((repo) => (
          <button
            key={repo}
            onClick={() => { setRepoFilter(repo); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs border transition ${
              repoFilter === repo
                ? "bg-purple-600 border-purple-500 text-white"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {repo === "all" ? "All repos" : repo}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-gray-500 text-center py-16">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="text-gray-500 text-center py-16">
          No reviews yet. Open a PR to get started 👻
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Link
              key={r._id}
              to={`/reviews/${r._id}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      #{r.prNumber} {r.prTitle}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[r.status] || ""}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.repoId?.fullName} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {r.filesReviewed ? ` · ${r.filesReviewed} files` : ""}
                    {r.linesChanged ? ` · ${r.linesChanged} lines` : ""}
                  </p>
                </div>
                {r.driftScore != null && (
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-semibold ${scoreClass(r.driftScore)}`}>{r.driftScore}</p>
                    <p className="text-xs text-gray-600">drift score</p>
                  </div>
                )}
              </div>
              {r.summary && (
                <p className="text-gray-400 text-xs mt-3 pt-3 border-t border-gray-800 leading-relaxed">
                  {r.summary}
                </p>
              )}
              {r.prUrl && (
                <span className="text-purple-400 text-xs mt-2 inline-block">
                  View PR on GitHub →
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-1.5 rounded-lg border border-gray-700 text-sm disabled:opacity-30 hover:border-gray-500 transition">
            ← Prev
          </button>
          <span className="text-gray-500 text-sm py-1.5">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * LIMIT >= total}
            className="px-4 py-1.5 rounded-lg border border-gray-700 text-sm disabled:opacity-30 hover:border-gray-500 transition">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}