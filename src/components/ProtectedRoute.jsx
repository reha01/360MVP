import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding:24}}>Cargando…</div>;
  return user ? children : <Navigate to="/login" replace />;
}
