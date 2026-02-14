import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Copy, CheckCircle, Clipboard, BookmarkPlus, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type ShortcutMap = Record<string, string>;

const MobileShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shortcuts, setShortcuts] = useState<ShortcutMap>({});
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [expandedText, setExpandedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'expander' | 'bookmarklet'>('expander');

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

  const expandText = useCallback((text: string): string => {
    if (!text) return '';
    let result = text;
    const keys = Object.keys(shortcuts);
    for (const key of keys) {
      const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, shortcuts[key]);
    }
    return result;
  }, [shortcuts]);

  useEffect(() => {
    setExpandedText(expandText(inputText));
  }, [inputText, expandText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(expandedText);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      toast.success('Pasted from clipboard');
    } catch {
      toast.error('Clipboard access denied. Paste manually.');
    }
  };

  const buildBookmarklet = () => {
    const s = JSON.stringify(shortcuts);
    return `javascript:void((function(){var s=${s};var el=document.activeElement;if(!el){alert('Click on a text field first!');return;}if(el.tagName==='INPUT'||el.tagName==='TEXTAREA'){var v=el.value;Object.keys(s).forEach(function(k){v=v.split(k).join(s[k])});el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}else if(el.isContentEditable){var h=el.textContent;Object.keys(s).forEach(function(k){h=h.split(k).join(s[k])});el.textContent=h;el.dispatchEvent(new Event('input',{bubbles:true}))}})())`;
  };
  const bookmarkletCode = buildBookmarklet();

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
            <h1 className="text-lg font-bold">Mobile Shortcuts</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
            <Smartphone className="w-4 h-4" />
            Mobile Solution
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Shortcuts on Mobile
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Extensions don't work on mobile browsers. Use these alternatives to expand your shortcuts anywhere.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 rounded-xl bg-slate-800/60 border border-slate-700/40">
          <button
            onClick={() => setActiveTab('expander')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'expander'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clipboard className="w-4 h-4" />
              Clipboard Expander
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bookmarklet')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'bookmarklet'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookmarkPlus className="w-4 h-4" />
              Bookmarklet
            </div>
          </button>
        </div>

        {/* Shortcut count */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            {loading ? 'Loading shortcuts...' : `${Object.keys(shortcuts).length} shortcuts loaded`}
          </p>
          <button
            onClick={fetchShortcuts}
            className="text-xs text-purple-400 flex items-center gap-1 hover:text-purple-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {activeTab === 'expander' && (
          <ClipboardExpander
            inputText={inputText}
            setInputText={setInputText}
            expandedText={expandedText}
            copied={copied}
            onCopy={handleCopy}
            onPaste={handlePaste}
            shortcuts={shortcuts}
            loading={loading}
          />
        )}

        {activeTab === 'bookmarklet' && (
          <BookmarkletSection bookmarkletCode={bookmarkletCode} shortcuts={shortcuts} />
        )}

        {/* Loaded Shortcuts Preview */}
        {Object.keys(shortcuts).length > 0 && (
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Your Shortcuts</h3>
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

/* ─── Clipboard Expander ─── */
const ClipboardExpander: React.FC<{
  inputText: string;
  setInputText: (v: string) => void;
  expandedText: string;
  copied: boolean;
  onCopy: () => void;
  onPaste: () => void;
  shortcuts: ShortcutMap;
  loading: boolean;
}> = ({ inputText, setInputText, expandedText, copied, onCopy, onPaste, shortcuts, loading }) => (
  <div className="space-y-4">
    {/* How it works */}
    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400" /> How it works
      </h3>
      <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
        <li>Type or paste text with your shortcut keys below</li>
        <li>Shortcuts expand automatically in real-time</li>
        <li>Copy the expanded text and paste it anywhere</li>
      </ol>
    </div>

    {/* Input */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">Type or paste your text</label>
        <Button size="sm" variant="ghost" onClick={onPaste} className="text-xs text-purple-400 h-7 gap-1">
          <Clipboard className="w-3 h-3" /> Paste
        </Button>
      </div>
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={loading ? 'Loading shortcuts...' : 'Type your shortcut keys here...'}
        className="min-h-[120px] bg-slate-900/60 border-slate-700/50 text-slate-100 placeholder:text-slate-600 resize-none"
        disabled={loading}
      />
    </div>

    {/* Output */}
    {expandedText && expandedText !== inputText && (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-green-400">✨ Expanded text</label>
          <Button
            size="sm"
            onClick={onCopy}
            className="h-7 gap-1 bg-green-600 hover:bg-green-700 text-white text-xs"
          >
            {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-sm text-slate-200 whitespace-pre-wrap break-words min-h-[80px]">
          {expandedText}
        </div>
      </div>
    )}

    {expandedText && expandedText === inputText && inputText.length > 0 && (
      <p className="text-xs text-slate-500 text-center">No shortcuts detected in the text</p>
    )}
  </div>
);

/* ─── Bookmarklet ─── */
const BookmarkletSection: React.FC<{
  bookmarkletCode: string;
  shortcuts: ShortcutMap;
}> = ({ bookmarkletCode, shortcuts }) => {
  const [bookmarkCopied, setBookmarkCopied] = useState(false);
  const shortcutCount = Object.keys(shortcuts).length;

  const handleCopyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setBookmarkCopied(true);
      toast.success('Bookmarklet code copied!');
      setTimeout(() => setBookmarkCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookmarkPlus className="w-4 h-4 text-blue-400" /> What is a Bookmarklet?
        </h3>
        <p className="text-xs text-slate-400">
          A bookmarklet is a special bookmark that runs a script on the current page.
          Tap it while on any website to expand all shortcuts in the focused text field.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 space-y-4">
        <h3 className="text-sm font-semibold">Setup Instructions</h3>
        <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside">
          <li>
            <strong className="text-slate-300">Copy the bookmarklet code</strong> using the button below
          </li>
          <li>
            <strong className="text-slate-300">Add a new bookmark</strong> in your mobile browser
            <ul className="ml-5 mt-1 space-y-1 list-disc">
              <li><strong>Chrome (Android):</strong> Bookmark any page → Edit → Replace URL with the copied code</li>
              <li><strong>Safari (iOS):</strong> Bookmark any page → Edit Bookmarks → Replace URL with the copied code</li>
            </ul>
          </li>
          <li>
            <strong className="text-slate-300">Name it</strong> something like "Expand Shortcuts"
          </li>
          <li>
            <strong className="text-slate-300">Use it:</strong> Click on a text field on any website → Open bookmarks → Tap your bookmarklet
          </li>
        </ol>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          Bookmarklet Code ({shortcutCount} shortcuts embedded)
        </label>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/40 text-xs text-slate-500 font-mono break-all max-h-24 overflow-y-auto">
          {bookmarkletCode.substring(0, 200)}...
        </div>
        <Button
          onClick={handleCopyBookmarklet}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
          disabled={shortcutCount === 0}
        >
          {bookmarkCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {bookmarkCopied ? 'Copied!' : 'Copy Bookmarklet Code'}
        </Button>
        {shortcutCount === 0 && (
          <p className="text-xs text-yellow-500 text-center">Add shortcuts in Speedy Notebook first</p>
        )}
      </div>

      <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
        <p className="text-xs text-yellow-400">
          ⚠️ The bookmarklet has your current shortcuts baked in. If you add new shortcuts, come back here and update the bookmarklet.
        </p>
      </div>
    </div>
  );
};

export default MobileShortcuts;
