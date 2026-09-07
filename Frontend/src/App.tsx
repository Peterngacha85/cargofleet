import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import NotificationCenter from '@/components/shared/NotificationCenter';
import DialogHost from '@/components/shared/DialogHost';
import LoginPage from '@/pages/LoginPage';
import SuperAdminLoginPage from '@/pages/SuperAdminLoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import TrackPage from '@/pages/TrackPage';
import RatePage from '@/pages/RatePage';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<SuperAdminLoginPage />} />
            <Route path="/register/:role" element={<RegisterPage />} />
            <Route path="/track/:token" element={<TrackPage />} />
            <Route path="/rate/:token" element={<RatePage />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <NotificationCenter />
        <DialogHost />
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}
