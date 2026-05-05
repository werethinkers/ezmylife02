import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Legacy /subscription route → redirect to /credits. */
const SubscriptionRedirect = () => {
  const nav = useNavigate();
  useEffect(() => { nav("/credits", { replace: true }); }, [nav]);
  return null;
};
export default SubscriptionRedirect;
