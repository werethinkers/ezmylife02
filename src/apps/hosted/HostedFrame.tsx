import { memo } from "react";

/*
 * The one place a developer's app runs: in previews, in the admin review, and live on /tool/<id>.
 *
 * The app's HTML is loaded with srcdoc into a sandboxed frame WITHOUT allow-same-origin, so the
 * browser gives it a unique, empty origin. It cannot read the ezyourlife.com sign-in, cookies or
 * storage, cannot call EzYourLife's APIs as the visitor, and cannot navigate the page around it.
 * Camera, microphone and location are not granted. Charging happens outside the frame
 * (HostedApp), never inside the developer's code.
 */
export const HOSTED_SANDBOX = "allow-scripts allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox";

export const HostedFrame = memo(function HostedFrame({
  html,
  title,
  device = "fill",
  className = "",
  reloadKey = 0,
}: {
  html: string;
  title: string;
  /** phone: a 390 px wide screen; desktop and fill: the full width available. */
  device?: "phone" | "desktop" | "fill";
  className?: string;
  /** Change it to restart the app from scratch. */
  reloadKey?: number;
}) {
  const frame = (
    <iframe
      key={reloadKey}
      title={title}
      srcDoc={html}
      sandbox={HOSTED_SANDBOX}
      allow=""
      referrerPolicy="no-referrer"
      loading="lazy"
      className="h-full w-full border-0 bg-white"
    />
  );

  if (device === "phone") {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="h-[740px] max-h-[80vh] w-full max-w-[390px] overflow-hidden rounded-[28px] border-2 border-ink bg-white shadow-block">
          {frame}
        </div>
      </div>
    );
  }
  return <div className={`h-full w-full overflow-hidden bg-white ${className}`}>{frame}</div>;
});
