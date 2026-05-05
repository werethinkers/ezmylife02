import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PremiumRoute } from "@/components/PremiumRoute";
import { ToolAccessGuard } from "@/components/ToolAccessGuard";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { usePageTracking } from "@/hooks/usePageTracking";

// Delay the loading screen so cached/instant chunks don't flash a spinner.
const DelayedFallback = ({ delayMs = 180 }: { delayMs?: number }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return show ? <LoadingScreen /> : null;
};

// Build cache buster v2

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Tools = lazy(() => import("./pages/Tools"));
const ToolViewer = lazy(() => import("./pages/ToolViewer"));
const ToolPreview = lazy(() => import("./pages/ToolPreview"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Profile = lazy(() => import("./pages/Profile"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Credits = lazy(() => import("./pages/Credits"));
const CreditsSuccess = lazy(() => import("./pages/CreditsSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUserDetail = lazy(() => import("./pages/AdminUserDetail"));
const SpeedyNotebook = lazy(() => import("./pages/SpeedyNotebook"));
const PromptMaster = lazy(() => import("./pages/PromptMaster"));
const GetExtension = lazy(() => import("./pages/GetExtension"));
const MobileShortcuts = lazy(() => import("./pages/MobileShortcuts"));
const StartupAnalyser = lazy(() => import("./pages/StartupAnalyser"));
const MeetNudge = lazy(() => import("./pages/MeetNudge"));
const MeetNudgeGuestForm = lazy(() => import("./pages/MeetNudgeGuestForm"));
const Virasat = lazy(() => import("./pages/Virasat"));
const BulkJobs = lazy(() => import("./pages/BulkJobs"));
const BulkJobDetail = lazy(() => import("./pages/BulkJobDetail"));


const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.14,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const AnimatedRoutes = () => {
  const location = useLocation();
  usePageTracking();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="will-change-transform"
      >
        <Suspense fallback={<DelayedFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/tools" element={<Tools />} />
            <Route
              path="/tool/:toolId"
              element={
                <ToolAccessGuard>
                  <ToolViewer />
                </ToolAccessGuard>
              }
            />
            <Route
              path="/tool-preview/:toolId"
              element={<ToolPreview />}
            />
            <Route path="/about" element={<About />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route
              path="/credits"
              element={
                <ProtectedRoute>
                  <Credits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/credits/success"
              element={
                <ProtectedRoute>
                  <CreditsSuccess />
                </ProtectedRoute>
              }
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route
              path="/coming-soon"
              element={
                <ProtectedRoute>
                  <ComingSoon />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notebook"
              element={
                <ProtectedRoute>
                  <SpeedyNotebook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/promptmaster"
              element={
                <ProtectedRoute>
                  <PromptMaster />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/user/:userId"
              element={
                <ProtectedRoute>
                  <AdminUserDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/get-extension"
              element={
                <PremiumRoute>
                  <GetExtension />
                </PremiumRoute>
              }
            />
            <Route
              path="/mobile-shortcuts"
              element={
                <PremiumRoute>
                  <MobileShortcuts />
                </PremiumRoute>
              }
            />
            <Route
              path="/startup-analyser"
              element={
                <PremiumRoute>
                  <StartupAnalyser />
                </PremiumRoute>
              }
            />
            <Route
              path="/meet-nudge"
              element={
                <PremiumRoute>
                  <MeetNudge />
                </PremiumRoute>
              }
            />
            <Route path="/e/:eventSlug" element={<MeetNudgeGuestForm />} />
            <Route path="/meetnudge/:hostSlug/:eventSlug" element={<MeetNudgeGuestForm />} />
            <Route
              path="/virasat"
              element={
                <PremiumRoute>
                  <Virasat />
                </PremiumRoute>
              }
            />
            <Route
              path="/bulk/jobs"
              element={
                <PremiumRoute>
                  <BulkJobs />
                </PremiumRoute>
              }
            />
            <Route
              path="/bulk/jobs/:id"
              element={
                <PremiumRoute>
                  <BulkJobDetail />
                </PremiumRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
