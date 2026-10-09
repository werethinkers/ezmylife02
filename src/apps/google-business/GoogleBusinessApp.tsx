import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("./pages/Home"));
const Setup = lazy(() => import("./pages/Setup"));
const Layout = lazy(() => import("./pages/Layout"));
const Overview = lazy(() => import("./pages/Overview"));
const Submissions = lazy(() => import("./pages/Submissions"));
const SubmissionDetail = lazy(() => import("./pages/SubmissionDetail"));
const Share = lazy(() => import("./pages/Share"));
const Whatsapp = lazy(() => import("./pages/Whatsapp"));
const Locations = lazy(() => import("./pages/Locations"));
const Keywords = lazy(() => import("./pages/Keywords"));
const Profile = lazy(() => import("./pages/Profile"));
const Replies = lazy(() => import("./pages/Replies"));

const Loading = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
  </div>
);

/** Google Business Kit — mounted at /google-business/* (owner side, signed in). */
export default function GoogleBusinessApp() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="setup" element={<Setup />} />
        <Route path="b/:id" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="submissions/:sid" element={<SubmissionDetail />} />
          <Route path="share" element={<Share />} />
          <Route path="whatsapp" element={<Whatsapp />} />
          <Route path="locations" element={<Locations />} />
          <Route path="keywords" element={<Keywords />} />
          <Route path="profile" element={<Profile />} />
          <Route path="replies" element={<Replies />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
