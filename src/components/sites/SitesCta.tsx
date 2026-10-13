import { useState } from "react";
import { SITES_CONTACT } from "@/data/siteWatch";

/** "Need one customised for your venture?" with WhatsApp and email. Details come from SITES_CONTACT. */
export function SitesCta() {
  const [shown, setShown] = useState<null | "wa" | "em">(null);
  const [copied, setCopied] = useState(false);
  const wa = shown === "wa";
  const label = wa ? "WhatsApp" : "Email";
  const val = wa ? SITES_CONTACT.whatsapp || "[WhatsApp number]" : SITES_CONTACT.email || "[team email]";
  const href = wa ? (SITES_CONTACT.whatsapp ? `https://wa.me/${SITES_CONTACT.whatsapp.replace(/\D/g, "")}` : "") : SITES_CONTACT.email ? `mailto:${SITES_CONTACT.email}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* the text is selectable */ }
  };
  return (
    <div className="sw">
      <section className="sec">
        <div className="cta">
          <div>
            <h2>Need one customised for your venture?</h2>
            <p style={{ margin: "8px 0 0" }}>Please contact the team. Tell us about your sites and we will tailor Site Watch with your own branding, roles and detections.</p>
          </div>
          <div className="ctarow">
            <button className="btn wa" type="button" onClick={() => setShown("wa")}>Chat on WhatsApp</button>
            <button className="btn ink" type="button" onClick={() => setShown("em")}>Email the team</button>
          </div>
          {shown && (
            <div className="contact">
              <div><span className="m">{label}</span><br /><code>{val}</code></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn sm" type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
                {href && <a className="btn sm pink" target="_blank" rel="noopener noreferrer" href={href}>Open</a>}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
