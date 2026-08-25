import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { lazy, Suspense, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

// Create a client
const queryClient = new QueryClient()

import { AdminRoute } from '@/components/auth/AdminRoute'
import { SocialSignupGuard } from '@/components/auth/SocialSignupGuard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAnalytics } from "./hooks/useAnalytics";
import { recordAnalytics } from '@/lib/analytics';
import { useHorizontalWheelScroll } from '@/hooks/useHorizontalWheelScroll'

const HomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })))
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then(module => ({ default: module.ToolsPage })))
const ToolDetailPage = lazy(() => import('@/pages/ToolDetailPage').then(module => ({ default: module.ToolDetailPage })))
const SubmitPage = lazy(() => import('@/pages/SubmitPage').then(module => ({ default: module.SubmitPage })))
const ReportPage = lazy(() => import('@/pages/ReportPage').then(module => ({ default: module.ReportPage })))
const MyPage = lazy(() => import('@/pages/MyPage').then(module => ({ default: module.MyPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage').then(module => ({ default: module.LoginPage })))
const LegalPage = lazy(() => import('@/pages/LegalPage').then(module => ({ default: module.LegalPage })))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })))
const CompleteSignupPage = lazy(() => import('@/pages/CompleteSignupPage').then(module => ({ default: module.CompleteSignupPage })))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout').then(module => ({ default: module.AdminLayout })))
const AdminOverviewPage = lazy(() => import('@/pages/AdminOverviewPage').then(module => ({ default: module.AdminOverviewPage })))
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })))
const AdminToolEditPage = lazy(() => import('@/pages/AdminToolEditPage').then(module => ({ default: module.AdminToolEditPage })))
const AdminHomeContentPage = lazy(() => import('@/pages/AdminHomeContentPage').then(module => ({ default: module.AdminHomeContentPage })))
const AdminNewsPage = lazy(() => import('@/pages/AdminNewsPage').then(module => ({ default: module.AdminNewsPage })))
const AdminSecurityPage = lazy(() => import('@/pages/AdminSecurityPage').then(module => ({ default: module.AdminSecurityPage })))
const AdminToolUpdatesPage = lazy(() => import('@/pages/AdminToolUpdatesPage').then(module => ({ default: module.AdminToolUpdatesPage })))
const AdminSocialContentPage = lazy(() => import('@/pages/AdminSocialContentPage').then(module => ({ default: module.AdminSocialContentPage })))

function PageFallback() {
  return <div className="flex min-h-[55vh] items-center justify-center" role="status" aria-label="화면 불러오는 중"><Loader2 className="size-8 animate-spin text-brand-purple" /></div>
}

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
  useHorizontalWheelScroll()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <BrowserRouter>
            <AnalyticsTracker />
            <Layout>
              <SocialSignupGuard>
              <Suspense fallback={<PageFallback />}>
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
                  <Route path="tool-updates" element={<AdminToolUpdatesPage />} />
                  <Route path="social-content" element={<AdminSocialContentPage />} />
                </Route>
              </Routes>
              </Suspense>
              </SocialSignupGuard>
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
