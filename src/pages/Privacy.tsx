import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import { seoFor } from "@/lib/seo/pages";

/*
 * Privacy policy. Also the privacy policy address for the iOS app's App Store listing
 * (https://ezyourlife.com/privacy, see docs/ios-app.md). Keep it in step with what the site collects.
 */
const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Who we are",
    body: "EZYOURLIFE (ezyourlife.com and the EZYOURLIFE iPhone app) is an online collection of apps for work, study and business. This policy explains what we collect, why, and the choices you have.",
  },
  {
    title: "What we collect",
    body: "Your account details: email address, name, and anything you add to your profile, such as phone number, company, job title, location and website. What you put into apps: text, files and photos you upload, and the results an app makes for you. Your websites and cards, and the details you put on them. Your credit balance, purchases and how many credits each app used. Basic usage and device information, such as pages visited, browser or app version and approximate location from your IP address.",
  },
  {
    title: "How we use it",
    body: "To run the apps you ask for and save your work, to keep your account and credits correct, to send messages you asked for (such as receipts and finished results by email or WhatsApp), to prevent misuse, and to improve the service. We don't sell your personal data and we don't use it for advertising profiles.",
  },
  {
    title: "AI apps",
    body: "When you use an app that runs on AI, what you enter is sent to our AI provider (Google Gemini, through our hosting provider's AI service) only to produce your result. It is not used by us to train AI models. Apps that run in your browser without AI keep your files on your device.",
  },
  {
    title: "Who we share it with",
    body: "Only the services that help us run EZYOURLIFE: our hosting and database provider (Supabase, through Lovable Cloud), our AI provider (Google), Razorpay for payments on the website (we never see your full card details), Google Analytics to understand how the site is used, and email and WhatsApp services for messages you asked for. We may also share data when the law requires it.",
  },
  {
    title: "Google accounts",
    body: "If you sign in with Google, or connect Google Photos or Gmail inside an app, we only use the access you approve, only for that app's feature, and never to show ads. Google Photos gives us only the photos you pick. Gmail access in Mail Brain only reads mail to make your summaries, tasks and drafts; nothing is sent for you. Our use of information received from Google APIs follows the Google API Services User Data Policy, including the Limited Use requirements.",
  },
  {
    title: "The EZYOURLIFE keyboard and voice",
    body: "The EZYOURLIFE keyboard on iPhone keeps no record of what you type and sends us only two things: the words you type after /, to find your shortcuts and apps, and the details of an app you choose to run. Everything else you type stays on your iPhone. \"Ask EZYOURLIFE\" with Siri sends us the request Siri hears from you, to pick and run the app. Apple handles the speech itself. Full Access lets the keyboard reach the internet and your shortcuts saved by the app; you can turn the keyboard off in Settings at any time.",
  },
  {
    title: "Cookies and storage",
    body: "We use your browser's storage to keep you signed in and remember your settings, and analytics cookies to count visits. You can clear them in your browser at any time.",
  },
  {
    title: "How long we keep it",
    body: "We keep your data while your account is open. Published websites and cards stay online for the period you paid for. Payment records are kept as long as tax law requires.",
  },
  {
    title: "Your choices",
    body: (
      <>
        You can see and change your profile on your{" "}
        <Link to="/profile" className="underline">profile page</Link>. You can delete your account there with "Delete my account"; your account and its data are deleted within 30 days. You can also ask us for a copy of your data, or ask any question about privacy, at support@ezyourlife.com.
      </>
    ),
  },
  {
    title: "Children",
    body: "EZYOURLIFE is not meant for children under 13, and we don't knowingly collect their data. If you think a child has given us data, write to us and we will delete it.",
  },
  {
    title: "Changes and contact",
    body: (
      <>
        We may update this policy and will change the date below when we do. Questions: support@ezyourlife.com or{" "}
        <Link to="/about#contact" className="underline">talk to us</Link>.
      </>
    ),
  },
];

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead {...seoFor("/privacy", "")} />
    <Navbar />
    <main className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-display text-3xl font-semibold md:text-4xl lg:text-5xl">Privacy policy</h1>
          <p className="text-muted-foreground">Last updated on Nov 14, 2026</p>
        </div>
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-3 rounded-2xl border-2 border-ink bg-card p-6">
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              <p className="text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
    <SEOFooter />
  </div>
);

export default Privacy;
