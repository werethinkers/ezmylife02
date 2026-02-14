import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Download, Rocket, RefreshCw, Copy, CheckCircle, Apple, SmartphoneNfc } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type ShortcutMap = Record<string, string>;

const MobileShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shortcuts, setShortcuts] = useState<ShortcutMap>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'export' | 'nativeapp'>('export');

  const fetchShortcuts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke('sync-shortcuts', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        method: 'GET',
      });

      if (res.data?.shortcuts) {
        setShortcuts(res.data.shortcuts);
      }
    } catch {
      toast.error('Failed to load shortcuts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchShortcuts();
  }, [fetchShortcuts]);

  const shortcutCount = Object.keys(shortcuts).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-bold">Shortcuts on Mobile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
            <Smartphone className="w-4 h-4" />
            Use Shortcuts Everywhere
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your Shortcuts, System-Wide
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Use the shortcuts you created in Speedy Notebook &amp; PromptMaster across your entire phone — in any app, any browser.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 rounded-xl bg-slate-800/60 border border-slate-700/40">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'export'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Export to Phone
            </div>
          </button>
          <button
            onClick={() => setActiveTab('nativeapp')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'nativeapp'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Rocket className="w-4 h-4" />
              Native App
            </div>
          </button>
        </div>

        {/* Shortcut count */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            {loading ? 'Loading shortcuts...' : `${shortcutCount} shortcuts loaded`}
          </p>
          <button
            onClick={fetchShortcuts}
            className="text-xs text-purple-400 flex items-center gap-1 hover:text-purple-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {activeTab === 'export' && (
          <ExportToPhone shortcuts={shortcuts} loading={loading} />
        )}

        {activeTab === 'nativeapp' && (
          <NativeAppSection />
        )}

        {/* Loaded Shortcuts Preview */}
        {shortcutCount > 0 && (
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Your Shortcuts ({shortcutCount})</h3>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {Object.entries(shortcuts).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-xs">
                  <code className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 font-mono shrink-0">
                    {key}
                  </code>
                  <span className="text-slate-400 truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Export to Phone ─── */
const ExportToPhone: React.FC<{
  shortcuts: ShortcutMap;
  loading: boolean;
}> = ({ shortcuts, loading }) => {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [copied, setCopied] = useState(false);
  const entries = Object.entries(shortcuts);

  const generateIOSInstructions = () => {
    if (entries.length === 0) return '';
    return entries
      .map(([key, value]) => `Shortcut: ${key}\nPhrase: ${value}`)
      .join('\n\n');
  };

  const generateAndroidInstructions = () => {
    if (entries.length === 0) return '';
    return entries
      .map(([key, value]) => `Shortcut: ${key}\nWord: ${value}`)
      .join('\n\n');
  };

  const handleCopyAll = async () => {
    const text = platform === 'ios' ? generateIOSInstructions() : generateAndroidInstructions();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('All shortcuts copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopySingle = async (key: string, value: string) => {
    const text = platform === 'ios'
      ? `Phrase: ${value}\nShortcut: ${key}`
      : `Word: ${value}\nShortcut: ${key}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied "${key}" shortcut`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-green-400">
          <Download className="w-4 h-4" /> How This Works
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your phone has a <strong className="text-slate-200">built-in text replacement</strong> feature. 
          Once you add your shortcuts there, they'll <strong className="text-slate-200">auto-expand everywhere</strong> — 
          in WhatsApp, Chrome, Notes, Gmail, any app. Just like the browser extension, but system-wide!
        </p>
      </div>

      {/* Platform Picker */}
      <div className="flex gap-2">
        <button
          onClick={() => setPlatform('ios')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
            platform === 'ios'
              ? 'bg-slate-700/60 border-purple-500/40 text-white'
              : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Apple className="w-4 h-4" />
            iPhone / iPad
          </div>
        </button>
        <button
          onClick={() => setPlatform('android')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
            platform === 'android'
              ? 'bg-slate-700/60 border-purple-500/40 text-white'
              : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SmartphoneNfc className="w-4 h-4" />
            Android
          </div>
        </button>
      </div>

      {/* Step-by-step guide */}
      {platform === 'ios' ? (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">iOS Setup (one-time)</h3>
          <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside leading-relaxed">
            <li>
              Open <strong className="text-slate-200">Settings → General → Keyboard → Text Replacement</strong>
            </li>
            <li>
              Tap the <strong className="text-slate-200">+ button</strong> in the top right
            </li>
            <li>
              In <strong className="text-slate-200">"Phrase"</strong>, paste the expanded text (e.g. "Thank you for your order!")
            </li>
            <li>
              In <strong className="text-slate-200">"Shortcut"</strong>, enter your shortcut key (e.g. "tyfo")
            </li>
            <li>
              Tap <strong className="text-slate-200">Save</strong>. Done! Now type "tyfo" anywhere and it auto-expands.
            </li>
          </ol>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Android Setup (one-time)</h3>
          <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside leading-relaxed">
            <li>
              Open <strong className="text-slate-200">Settings → System → Language & Input → Personal Dictionary</strong>
              <br />
              <span className="text-slate-500">(Path may vary by device: try Settings → search "Personal Dictionary")</span>
            </li>
            <li>
              Select your language (or <strong className="text-slate-200">"For all languages"</strong>)
            </li>
            <li>
              Tap the <strong className="text-slate-200">+ button</strong>
            </li>
            <li>
              In the <strong className="text-slate-200">top field</strong>, type the expanded text
            </li>
            <li>
              In <strong className="text-slate-200">"Shortcut"</strong>, type the shortcut key
            </li>
            <li>
              Press <strong className="text-slate-200">Back</strong> to save. Now the shortcut auto-expands when you type it!
            </li>
          </ol>
        </div>
      )}

      {/* Shortcuts to add — one by one */}
      {entries.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">
              Add These One by One
            </h3>
            <Button
              size="sm"
              onClick={handleCopyAll}
              className="h-7 gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied All!' : 'Copy All'}
            </Button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {entries.map(([key, value]) => (
              <ShortcutExportCard
                key={key}
                shortcutKey={key}
                phrase={value}
                platform={platform}
                onCopy={() => handleCopySingle(key, value)}
              />
            ))}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No shortcuts yet. Create some in Speedy Notebook or PromptMaster first!</p>
          </div>
        )
      )}
    </div>
  );
};

/* ─── Single Shortcut Export Card ─── */
const ShortcutExportCard: React.FC<{
  shortcutKey: string;
  phrase: string;
  platform: 'ios' | 'android';
  onCopy: () => void;
}> = ({ shortcutKey, phrase, platform, onCopy }) => {
  return (
    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              {platform === 'ios' ? 'Shortcut' : 'Shortcut'}
            </span>
            <code className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 font-mono text-xs font-bold">
              {shortcutKey}
            </code>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              {platform === 'ios' ? 'Phrase' : 'Word'}
            </span>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{phrase}</p>
          </div>
        </div>
        <button
          onClick={onCopy}
          className="shrink-0 p-2 rounded-lg hover:bg-slate-700/60 transition-colors text-slate-400 hover:text-purple-400"
          title="Copy this shortcut"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ─── Native App Section ─── */
const NativeAppSection: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* What it is */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/20 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-blue-400">
          <Rocket className="w-4 h-4" /> The Ultimate Solution
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          A <strong className="text-slate-200">native mobile app</strong> can run in the background and 
          <strong className="text-slate-200"> auto-expand shortcuts in any text field</strong> on your phone — 
          just like the browser extension does on desktop. No manual copying needed.
        </p>
      </div>

      {/* How it works */}
      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">How It Would Work</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 font-bold text-sm">1</div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Install the app</p>
              <p className="text-xs text-slate-500">Download from Play Store / App Store</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 font-bold text-sm">2</div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Log in &amp; sync</p>
              <p className="text-xs text-slate-500">Your shortcuts from Speedy Notebook &amp; PromptMaster sync automatically</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 font-bold text-sm">3</div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Enable the keyboard / accessibility service</p>
              <p className="text-xs text-slate-500">One-time setup to allow the app to detect and expand shortcuts</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 font-bold text-sm">4</div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Type anywhere — shortcuts auto-expand!</p>
              <p className="text-xs text-slate-500">Works in WhatsApp, Chrome, Gmail, Instagram — every app</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 space-y-3">
        <h3 className="text-sm font-semibold text-amber-400">🚧 Coming Soon</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          We're building a native Android &amp; iOS app that will bring the full extension experience to your phone. 
          This requires a custom keyboard (Android) or accessibility integration, and we're working on making it seamless.
        </p>
        <p className="text-xs text-slate-500">
          In the meantime, use the <strong className="text-slate-300">"Export to Phone"</strong> tab to add your shortcuts 
          to your phone's built-in text replacement — it works system-wide right now!
        </p>
      </div>

      {/* Platform specifics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-2">
          <div className="flex items-center gap-2">
            <SmartphoneNfc className="w-4 h-4 text-green-400" />
            <h4 className="text-xs font-semibold text-slate-300">Android</h4>
          </div>
          <p className="text-[11px] text-slate-500">
            Using an Accessibility Service to monitor and replace text in any app's input fields.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-2">
          <div className="flex items-center gap-2">
            <Apple className="w-4 h-4 text-slate-300" />
            <h4 className="text-xs font-semibold text-slate-300">iOS</h4>
          </div>
          <p className="text-[11px] text-slate-500">
            Using a custom keyboard extension that syncs with your account and expands shortcuts as you type.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileShortcuts;
