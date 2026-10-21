import { Navigate, useLocation } from "react-router-dom";

/** Mail Desk was renamed Mail Brain. Old links, and Google's return trip, keep working. */
export default function MailDeskRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/mail-brain${search}`} replace />;
}
