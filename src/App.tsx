import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PremiumRoute } from "@/components/PremiumRoute";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, type ReactNode } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

// Force module refresh

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
const NotFound = lazy(() => import("./pages/NotFound"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));

const queryClient = new QueryClient();

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <Suspense fallback={<LoadingScreen />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route
              path="/tools"
              element={
                <PremiumRoute>
                  <Tools />
                </PremiumRoute>
              }
            />
            <Route
              path="/tool/:toolId"
              element={
                <PremiumRoute>
                  <ToolViewer />
                </PremiumRoute>
              }
            />
            <Route
              path="/tool-preview/:toolId"
              element={
                <PremiumRoute>
                  <ToolPreview />
                </PremiumRoute>
              }
            />
            <Route path="/about" element={<About />} />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <Subscription />
                </ProtectedRoute>
              }
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
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
