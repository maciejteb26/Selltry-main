import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { ToastProvider } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth.store';
import { getMe } from '@/api/auth.api';
import LoginPage from '@/pages/Auth/Login';
import RegisterPage from '@/pages/Auth/Register';
import DashboardPage from '@/pages/Dashboard';
import ListingsPage from '@/pages/Listings';
import NewListingPage from '@/pages/Listings/New';
import PlatformsPage from '@/pages/Platforms';
import OrdersPage from '@/pages/Orders';
import MarginsPage from '@/pages/Settings/Margins';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [setUser, setLoading]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthLoader>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/listings/new" element={<NewListingPage />} />
                <Route path="/platforms" element={<ErrorBoundary><PlatformsPage /></ErrorBoundary>} />
                <Route path="/orders" element={<ErrorBoundary><OrdersPage /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><MarginsPage /></ErrorBoundary>} />
              </Route>
            </Route>
          </Routes>
        </AuthLoader>
      </BrowserRouter>
    </ToastProvider>
  );
}
