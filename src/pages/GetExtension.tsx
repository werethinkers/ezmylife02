import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Chrome, Globe, Shield, Zap, CheckCircle, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { downloadExtension } from '@/components/extension/ExtensionDownloader';
import InstallationGuide from '@/components/extension/InstallationGuide';
import { SEOHead } from '@/components/SEOHead';
import SEOFooter from '@/components/SEOFooter';

type BrowserInfo = {
  name: string;
  icon: React.ReactNode;
  supported: boolean;
  manualSteps: string[];
  extensionFolder: string;
  color: string;
};

const detectBrowser = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('opr') || ua.includes('opera')) return 'opera';
  if (ua.includes('edg')) return 'edge';
  if (ua.includes('brave')) return 'brave';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('chrome')) return 'chrome';
  return 'unknown';
};

const BROWSERS: Record<string, BrowserInfo> = {
  chrome: {
    name: 'Google Chrome',
    icon: <Chrome className="w-6 h-6" />,
    supported: true,
    manualSteps: [
      'Open chrome://extensions/ in your browser',
      'Enable "Developer mode" (top-right toggle)',
      'Click "Load unpacked"',
      'Select the extracted extension folder',
    ],
    extensionFolder: 'chrome',
    color: 'from-blue-500 to-green-500',
  },
  brave: {
    name: 'Brave',
    icon: <Shield className="w-6 h-6" />,
    supported: true,
    manualSteps: [
      'Open brave://extensions/ in your browser',
      'Enable "Developer mode" (top-right toggle)',
      'Click "Load unpacked"',
      'Select the extracted extension folder',
    ],
    extensionFolder: 'chrome',
    color: 'from-orange-500 to-red-500',
  },
  edge: {
    name: 'Microsoft Edge',
    icon: <Globe className="w-6 h-6" />,
    supported: true,
    manualSteps: [
      'Open edge://extensions/ in your browser',
      'Enable "Developer mode" (bottom-left toggle)',
      'Click "Load unpacked"',
      'Select the extracted extension folder',
    ],
    extensionFolder: 'chrome',
    color: 'from-blue-600 to-cyan-500',
  },
  opera: {
    name: 'Opera',
    icon: <Globe className="w-6 h-6" />,
    supported: true,
    manualSteps: [
      'Open opera://extensions/ in your browser',
      'Enable "Developer mode" (top-right toggle)',
      'Click "Load unpacked"',
      'Select the extracted extension folder',
    ],
    extensionFolder: 'chrome',
    color: 'from-red-500 to-pink-500',
  },
  firefox: {
    name: 'Mozilla Firefox',
    icon: <Globe className="w-6 h-6" />,
    supported: true,
    manualSteps: [
      'Open about:debugging#/runtime/this-firefox in your browser',
      'Click "Load Temporary Add-on..."',
      'Navigate to the extracted folder and select manifest.json',
      'Note: Temporary add-ons are removed on restart',
    ],
    extensionFolder: 'firefox',
    color: 'from-orange-500 to-yellow-500',
  },
  safari: {
    name: 'Safari',
    icon: <Globe className="w-6 h-6" />,
    supported: false,
    manualSteps: [
      'Safari requires extensions to be built with Xcode',
      'Use "safari-web-extension-converter" tool on macOS',
      'Convert the chrome-extension folder to a Safari project',
      'Build and install via Xcode',
    ],
    extensionFolder: 'chrome',
    color: 'from-blue-400 to-indigo-500',
  },
  unknown: {
    name: 'Your Browser',
    icon: <Globe className="w-6 h-6" />,
    supported: true,
    manualSteps: [
      'Download the extension files below',
      'Open your browser\'s extension management page',
      'Enable Developer mode',
      'Load the unpacked extension',
    ],
    extensionFolder: 'chrome',
    color: 'from-slate-500 to-slate-700',
  },
};

const GetExtension: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const detectedBrowser = useMemo(() => detectBrowser(), []);
  const currentBrowser = BROWSERS[detectedBrowser] || BROWSERS.unknown;
  const [downloading, setDownloading] = useState(false);

  const otherBrowsers = Object.entries(BROWSERS).filter(
    ([key]) => key !== detectedBrowser && key !== 'unknown'
  );

  const handleDownload = async (browserKey: string) => {
    const browser = BROWSERS[browserKey] || BROWSERS.unknown;
    try {
      await downloadExtension(
        browserKey === 'firefox' ? 'firefox' : 'chrome',
        setDownloading
      );
      toast.success(`Extension downloaded! Extract the ZIP and follow the install steps.`);
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="EZYOURLIFE Browser Extension - Use AI Shortcuts Everywhere"
        description="Download the EZYOURLIFE browser extension for Chrome, Firefox, Brave and Edge. Auto-expand your AI shortcuts on ChatGPT, Gemini, Grok and any website."
        path="/get-extension"
        keywords="ezyourlife extension, ai browser extension, chatgpt shortcuts, ai apps extension, chrome extension ai"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "EZYOURLIFE Browser Extension",
            description: "Download the EZYOURLIFE browser extension for Chrome, Firefox, Brave and Edge.",
            url: "https://ezyourlife.com/get-extension",
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://ezyourlife.com" },
              { "@type": "ListItem", position: 2, name: "Get Extension", item: "https://ezyourlife.com/get-extension" },
            ],
          },
        ]}
      />
      <div className="border-b border-ink bg-card backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-card rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h1 className="text-lg font-bold">Get Extension</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            <Zap className="w-4 h-4" />
            Premium Feature
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Use Your Shortcuts Everywhere
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Auto-expand your Speedy Notebook & PromptMaster shortcuts on ChatGPT, Gemini, Grok, and any other website.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: 'Instant Expansion', desc: 'Type a shortcut key, it expands automatically' },
            { icon: <Globe className="w-5 h-5 text-blue-400" />, title: 'Works Everywhere', desc: 'ChatGPT, Gemini, Grok, Gmail, and more' },
            { icon: <Shield className="w-5 h-5 text-green-400" />, title: 'Synced & Secure', desc: 'Your shortcuts sync privately from your account' },
          ].map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-card border-2 border-ink space-y-2">
              {f.icon}
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Detected Browser - Primary */}
        <div className={`p-6 rounded-2xl bg-sun border-2 border-ink relative overflow-hidden`}>
          <div className="absolute inset-0 bg-card" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                {currentBrowser.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Detected browser</p>
                <h3 className="text-xl font-bold">{currentBrowser.name}</h3>
              </div>
              {currentBrowser.supported && (
                <span className="ml-auto px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Supported
                </span>
              )}
            </div>

            <InstallationGuide
              browserKey={detectedBrowser}
              browser={currentBrowser}
              isPrimary
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                className="bg-pink hover:bg-pink text-ink gap-2"
                disabled={downloading}
                onClick={() => handleDownload(detectedBrowser)}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? 'Downloading...' : `Download for ${currentBrowser.name}`}
              </Button>
            </div>
          </div>
        </div>

        {/* Other Browsers */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-ink/80">Other Browsers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherBrowsers.map(([key, browser]) => (
              <OtherBrowserCard
                key={key}
                browserKey={key}
                browser={browser}
                onDownload={handleDownload}
                downloading={downloading}
              />
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="p-6 rounded-2xl bg-card border-2 border-ink space-y-4">
          <h3 className="text-lg font-semibold">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Install', desc: 'Load the extension in your browser' },
              { step: '2', title: 'Login', desc: 'Enter your EzMyLife credentials' },
              { step: '3', title: 'Sync', desc: 'Shortcuts auto-sync from your account' },
              { step: '4', title: 'Type', desc: 'Type any shortcut on any website!' },
            ].map((s) => (
              <div key={s.step} className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto font-bold text-lg">
                  {s.step}
                </div>
                <h4 className="font-semibold text-sm">{s.title}</h4>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Video tutorial placeholder */}
        <div className="p-6 rounded-2xl bg-card border-2 border-ink space-y-4">
          <h3 className="text-lg font-semibold">📺 Video Tutorial</h3>
          <div className="aspect-video rounded-xl bg-card border-2 border-ink flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-3xl">
                ▶
              </div>
              <p className="text-sm text-muted-foreground">Video tutorial coming soon</p>
              <p className="text-xs text-muted-foreground">Follow the step-by-step guide above to get started</p>
            </div>
          </div>
        </div>

        {/* Mobile Section */}
        <div className="p-6 rounded-2xl bg-sand border-2 border-ink space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sun">
              <Smartphone className="w-6 h-6 text-ink" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">On Mobile?</h3>
              <p className="text-sm text-muted-foreground">Extensions don't work on mobile browsers</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Use our Clipboard Expander or Bookmarklet to expand shortcuts on your phone — no extension needed.
          </p>
          <Link to="/mobile-shortcuts">
            <Button className="bg-pink hover:bg-pink text-ink gap-2">
              <Smartphone className="w-4 h-4" />
              Open Mobile Shortcuts
            </Button>
          </Link>
        </div>
        <SEOFooter />
      </div>
    </div>
  );
};

const OtherBrowserCard: React.FC<{
  browserKey: string;
  browser: BrowserInfo;
  onDownload: (key: string) => void;
  downloading: boolean;
}> = ({ browserKey, browser, onDownload, downloading }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl bg-card border-2 border-ink overflow-hidden">
      <button
        className="p-4 flex items-center gap-3 w-full hover:bg-card transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-2 rounded-lg bg-sand">{browser.icon}</div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="font-medium text-sm">{browser.name}</h4>
          <p className="text-xs text-muted-foreground">
            {browser.supported ? 'Click to see install steps' : 'Requires extra setup'}
          </p>
        </div>
        {browser.supported ? (
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
        ) : (
          <span className="text-xs text-yellow-500">Limited</span>
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-ink pt-3">
          <InstallationGuide browserKey={browserKey} browser={browser} />
          {browser.supported && (
            <Button
              size="sm"
              className="bg-pink hover:bg-pink text-ink gap-2"
              disabled={downloading}
              onClick={(e) => { e.stopPropagation(); onDownload(browserKey); }}
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default GetExtension;
