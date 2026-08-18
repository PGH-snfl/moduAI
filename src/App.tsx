import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'

// Create a client
const queryClient = new QueryClient()

import { ToolDetailPage } from '@/pages/ToolDetailPage'
import { ToolsPage } from '@/pages/ToolsPage'
import { SubmitPage } from '@/pages/SubmitPage'
import { ReportPage } from '@/pages/ReportPage'
import { MyPage } from '@/pages/MyPage'
import { LoginPage } from '@/pages/LoginPage'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { LegalPage } from '@/pages/LegalPage'
import { AdminToolEditPage } from '@/pages/AdminToolEditPage'
import { AdminHomeContentPage } from '@/pages/AdminHomeContentPage'
import { AdminOverviewPage } from '@/pages/AdminOverviewPage'
import { AdminNewsPage } from '@/pages/AdminNewsPage'
import { AdminSecurityPage } from '@/pages/AdminSecurityPage'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { CompleteSignupPage } from '@/pages/CompleteSignupPage'
import { SocialSignupGuard } from '@/components/auth/SocialSignupGuard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAnalytics } from "./hooks/useAnalytics";
import { useEffect } from "react";
import { recordAnalytics } from '@/lib/analytics';

const AnalyticsTracker = () => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path);
    if (!location.pathname.startsWith('/admin')) recordAnalytics('page_view', path);
  }, [location, trackPageView]);

  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <BrowserRouter>
            <AnalyticsTracker />
            <Layout>
              <SocialSignupGuard>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/tool/:id" element={<ToolDetailPage />} />
                <Route
                  path="/submit"
                  element={
                    <ProtectedRoute loginMessage="AI 도구를 제보하려면 로그인이 필요합니다.">
                      <SubmitPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/complete-signup" element={<CompleteSignupPage />} />
                <Route path="/terms" element={<LegalPage />} />
                <Route path="/privacy" element={<LegalPage />} />
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminOverviewPage />} />
                  <Route path="tools" element={<AdminDashboardPage />} />
                  <Route path="tools/:id/edit" element={<AdminToolEditPage />} />
                  <Route path="content" element={<AdminHomeContentPage />} />
                  <Route path="news" element={<AdminNewsPage />} />
                  <Route path="security" element={<AdminSecurityPage />} />
                </Route>
              </Routes>
              </SocialSignupGuard>
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
