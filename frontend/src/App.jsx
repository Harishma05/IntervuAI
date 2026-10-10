import "./App.css";
import "./professional.css";
import InterviewSession from "./pages/InterviewSession";
import Results from "./pages/Results";

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import InterviewSetup from "./pages/InterviewSetup";
import ResumeReview from "./pages/ResumeReview";
import AuthPage from "./pages/AuthPage";
import History from "./pages/History";
import { AuthProvider, useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="auth-loading" role="status">Loading your account…</main>;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function AuthRoutes() {
  return <BrowserRouter>
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
      <Route path="/session" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/resume-review" element={<ProtectedRoute><ResumeReview /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>;
}

function App() {
  return (
    <AuthProvider><AuthRoutes /></AuthProvider>
  );
}

export default App;
