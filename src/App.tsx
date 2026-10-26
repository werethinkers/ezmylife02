import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ToolAccessGuard } from "@/components/ToolAccessGuard";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useRefCapture } from "@/hooks/useRefCapture";
import { QuickLookProvider } from "@/components/store/QuickLook";
import { MobileDock } from "@/components/MobileDock";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { featureRoutes } from "./featureRoutes";
const SmartAssistantChatbot = lazy(() =>
  import("@/components/SmartAssistantChatbot").then((m) => ({
    default: m.SmartAssistantChatbot ?? (m as any).default,
  }))
);

const CreditPromptHost = lazy(() => import("@/components/wallet/CreditPromptHost"));
const DedicatedBulk = lazy(() => import("@/apps/bulk/DedicatedBulk"));

// Delay the loading screen so cached/instant chunks don't flash a spinner.
const DelayedFallback = () => null;

// Build cache buster v2

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Tools = lazy(() => import("./pages/Tools"));
const ToolViewer = lazy(() => import("./pages/ToolViewer"));
const ToolPreview = lazy(() => import("./pages/ToolPreview"));
const About = lazy(() => import("./pages/About"));

const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Profile = lazy(() => import("./pages/Profile"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Credits = lazy(() => import("./pages/Credits"));
const CreditsSuccess = lazy(() => import("./pages/CreditsSuccess"));
const CreditsHistory = lazy(() => import("./pages/CreditsHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminRedirect = lazy(() => import("./pages/AdminRedirect"));
const AdminUserDetail = lazy(() => import("./pages/AdminUserDetail"));
const SpeedyNotebook = lazy(() => import("./pages/SpeedyNotebook"));
const PromptMaster = lazy(() => import("./pages/PromptMaster"));
const GetExtension = lazy(() => import("./pages/GetExtension"));
const MobileShortcuts = lazy(() => import("./pages/MobileShortcuts"));
const StartupAnalyser = lazy(() => import("./pages/StartupAnalyser"));
const MeetNudge = lazy(() => import("./pages/MeetNudge"));
const GoogleBusinessApp = lazy(() => import("./apps/google-business/GoogleBusinessApp"));
const GoogleBusinessReview = lazy(() => import("./apps/google-business/pages/Review"));
const MeetNudgeGuestForm = lazy(() => import("./pages/MeetNudgeGuestForm"));
const Virasat = lazy(() => import("./pages/Virasat"));
const BulkJobs = lazy(() => import("./pages/BulkJobs"));
const BulkJobDetail = lazy(() => import("./pages/BulkJobDetail"));
const ProductVision360 = lazy(() => import("./pages/ProductVision360"));
const UseCaseLanding = lazy(() => import("./pages/UseCaseLanding"));
const IndustryLanding = lazy(() => import("./pages/IndustryLanding"));
const Explore = lazy(() => import("./pages/Explore"));
const PromoPage = lazy(() => import("./pages/PromoPage"));
const Kit = lazy(() => import("./pages/Kit"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const CreateGallery = lazy(() => import("./pages/instant/CreateGallery"));
const Builder = lazy(() => import("./pages/instant/Builder"));
const PublishedPage = lazy(() => import("./pages/instant/PublishedPage"));
const PublishDone = lazy(() => import("./pages/instant/PublishDone"));
const ProductPromo = lazy(() => import("./pages/instant/ProductPromo"));
const MyPages = lazy(() => import("./pages/instant/MyPages"));
const PageLeads = lazy(() => import("./pages/instant/PageLeads"));




const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.06,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const AnimatedRoutes = () => {
  const location = useLocation();
  usePageTracking();
  useRefCapture();
  const routes = (
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/ai-apps" element={<Tools />} />
            <Route path="/tools" element={<Navigate to="/ai-apps" replace />} />
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
            {/* Workspace is built into every app now (next-app suggestions + remembered entries). */}
            <Route path="/workspace" element={<Navigate to="/ai-apps" replace />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/credits" element={<Credits />} />
            <Route
              path="/credits/history"
              element={
                <ProtectedRoute>
                  <CreditsHistory />
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
            <Route path="/contact" element={<Navigate to="/about#contact" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/coming-soon" element={<Navigate to="/ai-apps" replace />} />
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
              path="/admin/bulk-qa"
              element={
                <ProtectedRoute>
                  <AdminRedirect />
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
                <ProtectedRoute>
                  <GetExtension />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mobile-shortcuts"
              element={
                <ProtectedRoute>
                  <MobileShortcuts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/startup-analyser"
              element={
                <ProtectedRoute>
                  <StartupAnalyser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meet-nudge"
              element={
                <ProtectedRoute>
                  <MeetNudge />
                </ProtectedRoute>
              }
            />
            <Route path="/e/:eventSlug" element={<MeetNudgeGuestForm />} />
            <Route
              path="/google-business/*"
              element={
                <ProtectedRoute>
                  <GoogleBusinessApp />
                </ProtectedRoute>
              }
            />
            {/* Public customer review page for Google Business Kit (no sign-in) */}
            <Route path="/rv" element={<GoogleBusinessReview />} />
            <Route path="/meetnudge/:hostSlug/:eventSlug" element={<MeetNudgeGuestForm />} />
            <Route
              path="/virasat"
              element={
                <ProtectedRoute>
                  <Virasat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk/jobs"
              element={
                <ProtectedRoute>
                  <BulkJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk/jobs/:id"
              element={
                <ProtectedRoute>
                  <BulkJobDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/promo/:slug" element={<PromoPage />} />
            <Route path="/kit" element={<Kit />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/create" element={<CreateGallery />} />
            <Route path="/websites" element={<CreateGallery kind="websites" />} />
            <Route path="/cards" element={<CreateGallery kind="cards" />} />
            <Route path="/create/done/:pageId" element={<ProtectedRoute><PublishDone /></ProtectedRoute>} />
            <Route path="/create/:productId" element={<Builder />} />
            <Route path="/make/:productId" element={<ProductPromo />} />
            <Route path="/p/:slug" element={<PublishedPage />} />
            <Route path="/my-pages" element={<ProtectedRoute><MyPages /></ProtectedRoute>} />
            <Route path="/my-pages/:pageId" element={<ProtectedRoute><PageLeads /></ProtectedRoute>} />
            <Route path="/admin/instant" element={<ProtectedRoute><AdminRedirect /></ProtectedRoute>} />
            {featureRoutes.map(({ path, page: Page, signedIn }) => (
              <Route key={path} path={path} element={signedIn ? <ProtectedRoute><Page /></ProtectedRoute> : <Page />} />
            ))}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route
              path="/tools/productvision-360"
              element={
                <ProtectedRoute>
                  <ProductVision360 />
                </ProtectedRoute>
              }
            />
            <Route path="/ai-tool-for/:query" element={<UseCaseLanding />} />
            <Route path="/ai-for/:industry" element={<IndustryLanding />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
  );
  // Published pages, product pages and the builder own the whole screen and use fixed action bars, which a
  // transformed ancestor would break, so they render without the page-transition wrapper.
  if (/^\/(p|create|make)\//.test(location.pathname)) {
    return <Suspense fallback={<DelayedFallback />}>{routes}</Suspense>;
  }

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
          {routes}
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
          <QuickLookProvider>
            <AnimatedRoutes />
            <MobileDock />
            <WhatsAppFab />
            <Suspense fallback={null}>
              <SmartAssistantChatbot />
              <CreditPromptHost />
              <DedicatedBulk />
            </Suspense>
          </QuickLookProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
