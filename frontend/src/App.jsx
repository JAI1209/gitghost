import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Repos from './pages/Repos';
import ReviewDetail from './pages/ReviewDetail';
import Login from './pages/Login';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="flex items-center justify-center h-screen text-ghost-text-dim">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/repos" element={<ProtectedRoute><Layout><Repos /></Layout></ProtectedRoute>} />
        <Route path="/reviews/:id" element={<ProtectedRoute><Layout><ReviewDetail /></Layout></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
