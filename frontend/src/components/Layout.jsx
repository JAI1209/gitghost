import { Link, useLocation } from 'react-router-dom';
import { Ghost, LayoutDashboard, GitBranch, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/repos', label: 'Repositories', icon: GitBranch },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-ghost-border bg-ghost-card">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-ghost-border">
          <Ghost className="text-ghost-accent" size={22} />
          <span className="font-semibold text-ghost-text tracking-tight">GitGhost</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                loc.pathname === to
                  ? 'bg-ghost-accent/15 text-ghost-accent'
                  : 'text-ghost-text-dim hover:text-ghost-text hover:bg-ghost-border/40'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        {user && (
          <div className="border-t border-ghost-border p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              {user.avatar
                ? <img src={user.avatar} className="w-7 h-7 rounded-full" alt={user.username} />
                : <User size={18} className="text-ghost-text-dim" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ghost-text truncate">{user.username}</p>
                <p className="text-xs text-ghost-text-dim capitalize">{user.plan} plan</p>
              </div>
              <button onClick={logout} className="text-ghost-text-dim hover:text-ghost-red transition-colors" title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-ghost-bg">
        {children}
      </main>
    </div>
  );
}
