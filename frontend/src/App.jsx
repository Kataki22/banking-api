import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import AccountDetail from "./pages/AccountDetail";
import TransferPage from "./pages/TransferPage";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <BrowserRouter>
      {user && <Navbar />}
      <Routes>
        <Route path="/login"    element={user ? <Navigate to="/" replace /> : <ErrorBoundary><LoginPage /></ErrorBoundary>} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <ErrorBoundary><RegisterPage /></ErrorBoundary>} />
        <Route path="/" element={
          <ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>
        } />
        <Route path="/comptes/:id" element={
          <ProtectedRoute><ErrorBoundary><AccountDetail /></ErrorBoundary></ProtectedRoute>
        } />
        <Route path="/virement" element={
          <ProtectedRoute><ErrorBoundary><TransferPage /></ErrorBoundary></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
