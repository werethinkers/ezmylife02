import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { generateComprehensiveAnalysis, streamChatMessage, extractPdfText } from './services/geminiService';
import {
  BrainCircuitIcon, ClipboardDocumentListIcon, GlobeAltIcon, PaperAirplaneIcon,
  SparklesIcon, XIcon, TableCellsIcon, BuildingOfficeIcon, UsersIcon,
  CurrencyDollarIcon, BookOpenIcon, PencilSquareIcon,
  LightBulbIcon, ScaleIcon,
} from './components/icons';
import { Key } from 'lucide-react';
import type { AnalysisResult, Competitor, ResourceItem, StructuredData } from './types';
import { CompetitorChart } from './components/CompetitorChart';
import { prompts } from './constants';
import { PromptSelector } from './components/PromptSelector';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { Resources } from './components/Resources';
import { TeamDisplay } from './components/TeamDisplay';
import { LegalAnalysis } from './components/LegalAnalysis';
import { ICNote } from './components/ICNote';
import { EditableContent, highlightText } from './components/EditableContent';
import { FinancialProjectionsTable } from './components/FinancialProjectionsTable';
import { MermaidDiagram } from './components/MermaidDiagram';
import { FileUploader } from './components/FileUploader';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BulkModeToggle } from '@/components/bulk/BulkModeToggle';
import { useCredits } from '@/hooks/useCredits';
import { BuyCreditsDialog } from '@/components/wallet/BuyCreditsDialog';
import { CreditCostBadge } from '@/components/tools/CreditCostBadge';

declare global {
  interface Window {
    mermaid: any;
    showdown: any;
    pdfjsLib: any;
  }
}

type AppStep = 'input' | 'analyzing' | 'results' | 'error';
type ResultTab = 'all' | 'executiveSummary' | 'report' | 'data' | 'resources' | 'legal' | 'chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SavedSession {
  id: string;
  company_name: string;
  company_website: string | null;
  created_at: string;
  status: string;
}

const updateNestedState = (prevState: any, path: (string | number)[], value: any) => {
  const newState = structuredClone(prevState);
  let current = newState;
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
    if (current === undefined || current === null) return prevState;
  }
  current[path[path.length - 1]] = value;
  return newState;
};

const getDomainFromUrl = (url: string): string => {
  if (!url) return '';
  try {
    let fullUrl = url.trim();
    if (!/^(https?)/.test(fullUrl)) fullUrl = `https://${fullUrl}`;
    return new URL(fullUrl).hostname;
  } catch {
    const domainMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/);
    return domainMatch ? domainMatch[1] : url;
  }
};

const normalizeUrl = (url: string): string => {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!/^(https?:|ftp:)/.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
};

const CompetitorCard = ({ competitor, path, onUpdate, keywords, highlightEnabled }: {
  competitor: Competitor; path: (string | number)[]; onUpdate: (path: (string | number)[], value: any) => void; keywords: string[]; highlightEnabled: boolean;
}) => {
  const domain = getDomainFromUrl(competitor.website);
  const renderField = (label: string, field: keyof Competitor, as: 'input' | 'textarea' = 'input') => (
    <div className="grid grid-cols-3 gap-2 items-start">
      <span className="font-semibold text-gray-600 col-span-1 pt-2">{label}:</span>
      <div className="col-span-2">
        <EditableContent
          value={competitor[field] as string}
          onUpdate={(val) => onUpdate([...path, field], field === 'key_investors' ? (val as string).split(',').map(s => s.trim()) : val)}
          keywords={keywords}
          highlightEnabled={highlightEnabled}
          as={as}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt={`${competitor.name} logo`} className="w-10 h-10 rounded-full object-contain border" />
        <div className="font-bold text-lg text-gray-800 flex-grow">
          <EditableContent value={competitor.name} onUpdate={(val) => onUpdate([...path, 'name'], val)} keywords={keywords} highlightEnabled={highlightEnabled} placeholder="Competitor Name" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4 border-y border-gray-200 py-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 mb-1">
            <CurrencyDollarIcon className="w-5 h-5 text-green-500" /><span>Funding</span>
          </div>
          <div className="text-lg font-semibold text-gray-800">
            <EditableContent value={competitor.funding} onUpdate={(val) => onUpdate([...path, 'funding'], val)} keywords={keywords} highlightEnabled={highlightEnabled} placeholder="e.g., $50M" />
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 mb-1">
            <ScaleIcon className="w-5 h-5 text-indigo-500" /><span>Valuation</span>
          </div>
          <div className="text-lg font-semibold text-gray-800">
            <EditableContent value={competitor.valuation} onUpdate={(val) => onUpdate([...path, 'valuation'], val)} keywords={keywords} highlightEnabled={highlightEnabled} placeholder="e.g., $500M" />
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {renderField("Website", "website")}
        {renderField("HQ", "hq")}
        {renderField("Founding Year", "founding_year")}
        {renderField("Key Investors", "key_investors")}
        {renderField("Core Product", "core_product", "textarea")}
        {renderField("Tech Advantage", "tech_advantage", "textarea")}
        {renderField("Our Advantage", "user_co_advantage", "textarea")}
      </div>
    </div>
  );
};

const NewsSnippetCard = ({ article }: { article: ResourceItem }) => (
  <div className="border-t border-gray-200 pt-3 mt-3 first:mt-0 first:border-t-0 first:pt-0">
    <a href={normalizeUrl(article.url)} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline text-sm break-words">{article.title}</a>
    <p className="text-xs text-gray-500 mt-1">{article.summary}</p>
  </div>
);

export default function StartupAnalyserApp(): React.ReactNode {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<AppStep>('input');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [pitchDeckText, setPitchDeckText] = useState<string | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);

  const [activeTab, setActiveTab] = useState<ResultTab>('all');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  // Sidebar state
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const allKeywords = useMemo(() => {
    if (!analysisResult?.structuredData?.keywords) return [];
    const { business = [], technical = [] } = analysisResult.structuredData.keywords;
    return [...new Set([...business, ...technical])].filter(k => k && k.length > 1).sort((a, b) => b.length - a.length);
  }, [analysisResult?.structuredData?.keywords]);

  // Load saved sessions and user API key on mount
  useEffect(() => {
    if (user) {
      loadSavedSessions();
      // Load user's Gemini API key from profile
      supabase.from('profiles').select('gemini_api_key').eq('id', user.id).maybeSingle()
        .then(({ data }) => { if (data?.gemini_api_key) setUserApiKey(data.gemini_api_key); });
    }
  }, [user]);

  const loadSavedSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('startup_analyses')
        .select('id, company_name, company_website, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setSavedSessions(data);
    } catch { /* ignore */ }
    setLoadingSessions(false);
  };

  const saveAnalysis = async (result: AnalysisResult) => {
    if (!user) return;
    try {
      const payload = {
        user_id: user.id,
        company_name: companyName.trim(),
        company_website: companyWebsite.trim() || null,
        analysis_data: result.structuredData as any,
        markdown_report: result.markdownReport,
        status: 'completed',
      };

      if (currentSessionId) {
        await supabase.from('startup_analyses').update(payload).eq('id', currentSessionId);
      } else {
        const { data } = await supabase.from('startup_analyses').insert(payload).select('id').single();
        if (data) setCurrentSessionId(data.id);
      }
      loadSavedSessions();
    } catch {
      console.error('Failed to save analysis');
    }
  };

  const loadSession = async (session: SavedSession) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('startup_analyses')
        .select('*')
        .eq('id', session.id)
        .single();
      if (error || !data) throw new Error('Failed to load session');

      setCompanyName(data.company_name);
      setCompanyWebsite(data.company_website || '');
      setCurrentSessionId(data.id);
      setAnalysisResult({
        markdownReport: data.markdown_report || '',
        structuredData: data.analysis_data as unknown as StructuredData,
        sources: [],
        pitchDeckSummary: null,
      });
      setChatHistory([]);
      setStep('results');
      setActiveTab('all');
      setSidebarOpen(false);
      toast({ title: "Session loaded", description: `Resumed analysis for ${data.company_name}` });
    } catch {
      toast({ title: "Error", description: "Failed to load session", variant: "destructive" });
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await supabase.from('startup_analyses').delete().eq('id', sessionId);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      handleStartOver();
    }
    loadSavedSessions();
    toast({ title: "Deleted", description: "Analysis removed" });
  };

  useEffect(() => {
    if (analysisResult && window.mermaid) {
      setTimeout(async () => {
        const unprocessed = document.querySelectorAll('.mermaid:not([data-processed="true"])');
        if (unprocessed.length === 0) return;
        for (const el of Array.from(unprocessed)) {
          const element = el as HTMLElement;
          let definition = (element.textContent || '').trim();
          if (!definition) { element.setAttribute('data-processed', 'true'); continue; }
          try {
            definition = definition.replace(/;/g, '\n');
            element.textContent = definition;
            await window.mermaid.run({ nodes: [element] });
          } catch (e: any) {
            element.innerHTML = `<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-left"><p class="font-bold">Diagram Rendering Failed</p><details class="text-xs mt-2"><summary>Show Code</summary><pre class="mt-2 font-mono bg-red-100 p-2 rounded whitespace-pre-wrap">${definition}</pre></details></div>`;
            element.setAttribute('data-processed', 'true');
          }
        }
      }, 100);
    }
  }, [activeTab, analysisResult]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [chatHistory]);

  // Handle PDF file selection
  const handlePdfSelect = async (file: File | null) => {
    setPitchDeckFile(file);
    if (!file) {
      setPitchDeckText(null);
      return;
    }
    setIsExtractingPdf(true);
    try {
      const text = await extractPdfText(file);
      setPitchDeckText(text);
      toast({ title: "PDF processed", description: `Extracted text from ${file.name} (${Math.round(text.length / 1000)}k chars)` });
    } catch (err) {
      toast({ title: "PDF extraction failed", description: "Could not read the PDF. Try a different file.", variant: "destructive" });
      setPitchDeckFile(null);
      setPitchDeckText(null);
    }
    setIsExtractingPdf(false);
  };

  const handleDataChange = useCallback((path: (string | number)[], value: any) => {
    setAnalysisResult(prev => {
      if (!prev) return null;
      return updateNestedState(prev, path, value);
    });
  }, []);

  const handleRawJsonChange = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      handleDataChange(['structuredData'], parsed);
      setRawJsonError(null);
    } catch (e: any) {
      setRawJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  const handleStartAnalysis = useCallback(async () => {
    if (!companyName || !companyWebsite) {
      setError('Please provide a company name and website.');
      return;
    }
    setStep('analyzing');
    setError(null);
    setProgressMessage('10');
    setCurrentSessionId(null);

    try {
      const result = await generateComprehensiveAnalysis(companyName, companyWebsite, setProgressMessage, pitchDeckText, userApiKey);
      setAnalysisResult(result);
      setChatHistory([]);
      setStep('results');
      setActiveTab('all');
      // Auto-save
      if (user) {
        const payload = {
          user_id: user.id,
          company_name: companyName.trim(),
          company_website: companyWebsite.trim() || null,
          analysis_data: result.structuredData as any,
          markdown_report: result.markdownReport,
          status: 'completed',
        };
        const { data } = await supabase.from('startup_analyses').insert(payload).select('id').single();
        if (data) setCurrentSessionId(data.id);
        loadSavedSessions();
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage.replace(/^Error:\s*/, ''));
      setStep('error');
    } finally {
      setProgressMessage('');
    }
  }, [companyName, companyWebsite, pitchDeckText, user, userApiKey]);

  const handleStartOver = () => {
    setStep('input');
    setAnalysisResult(null);
    setError(null);
    setProgressMessage('');
    setActiveTab('all');
    setChatHistory([]);
    setChatInput('');
    setCompanyName('');
    setCompanyWebsite('');
    setCurrentSessionId(null);
    setPitchDeckFile(null);
    setPitchDeckText(null);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !analysisResult || isChatting) return;
    setIsChatting(true);
    const text = chatInput;
    const userMessage: ChatMessage = { role: 'user', content: text };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');

    let fullResponse = "";
    setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const messagesForApi = [...chatHistory, userMessage].map(m => ({ role: m.role, content: m.content }));
      await streamChatMessage(
        analysisResult.markdownReport,
        messagesForApi,
        (chunk) => {
          fullResponse += chunk;
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { role: 'assistant', content: fullResponse };
            return newHistory;
          });
        },
        () => setIsChatting(false),
        userApiKey
      );
    } catch {
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { role: 'assistant', content: "Sorry, I encountered an error. Please try again." };
        return newHistory;
      });
      setIsChatting(false);
    }
  };

  const setChatInputAndSend = (text: string) => {
    setActiveTab('chat');
    setChatInput(text);
    setTimeout(() => {
      document.getElementById('send-chat-button')?.click();
    }, 100);
  };

  const renderTabButton = (tab: ResultTab, icon: React.ReactNode, text: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors text-sm ${
        activeTab === tab ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );

  // --- SIDEBAR ---
  const Sidebar = () => (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Past Analyses</h2>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded hover:bg-gray-100">
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)] p-3 space-y-2">
          {loadingSessions ? (
            <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
          ) : savedSessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No saved analyses yet.</p>
          ) : (
            savedSessions.map(s => (
              <div
                key={s.id}
                onClick={() => loadSession(s)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                  currentSessionId === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{s.company_name}</p>
                    {s.company_website && <p className="text-xs text-gray-500 truncate">{s.company_website}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-opacity"
                    title="Delete"
                  >
                    <XIcon className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  // --- INPUT SCREEN ---
  if (step === 'input') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <BrainCircuitIcon className="w-16 h-16 text-blue-600 mb-4" />
              <h1 className="text-4xl font-bold text-gray-800">AI Startup Analyzer</h1>
              <p className="mt-2 text-lg text-gray-500">Generate a comprehensive VC-style investment analysis.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., Stripe" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="company-website" className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
                <input type="text" id="company-website" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="e.g., stripe.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pitch Deck (Optional)</label>
                <FileUploader onFileSelect={handlePdfSelect} acceptedFileTypes=".pdf" />
                {isExtractingPdf && <p className="text-sm text-blue-600 mt-1 animate-pulse">Extracting text from PDF...</p>}
                {pitchDeckText && !isExtractingPdf && <p className="text-sm text-green-600 mt-1">✓ PDF text extracted ({Math.round(pitchDeckText.length / 1000)}k chars)</p>}
              </div>
              {!userApiKey && user && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <Key className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Add your own <a href="/profile" className="font-semibold underline hover:text-amber-900">Gemini API key in Profile</a> to use your personal quota and avoid shared rate limits.
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="ml-1 underline hover:text-amber-900">Get one free →</a>
                  </span>
                </div>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-center pt-1">
                <BulkModeToggle toolId="startup-analyser" />
              </div>
              <div className="flex gap-3">
                {user && savedSessions.length > 0 && (
                  <button onClick={() => setSidebarOpen(true)} className="px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-5 h-5" />
                    <span>History ({savedSessions.length})</span>
                  </button>
                )}
                <button onClick={handleStartAnalysis} disabled={!companyName || !companyWebsite || isExtractingPdf} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:transform-none disabled:cursor-not-allowed">
                  <SparklesIcon className="w-5 h-5" /><span>Start Analysis</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ERROR SCREEN ---
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Analysis Failed</h2>
            <p className="text-gray-600 mb-6">{error || 'An unexpected error occurred.'}</p>
            <button onClick={handleStartOver} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">Start Over</button>
          </div>
        </div>
      </div>
    );
  }

  // --- ANALYZING SCREEN ---
  if (step === 'analyzing') {
    const progress = parseInt(progressMessage, 10) || 0;
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 text-center">
            <BrainCircuitIcon className="w-16 h-16 text-blue-600 mb-4 mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing {companyName}...</h2>
            <p className="text-gray-500 mb-6">Please wait while the AI generates your comprehensive report.</p>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-4 text-lg font-semibold text-blue-600">{progress}%</p>
          </div>
        </div>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (!analysisResult?.structuredData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No analysis data available</h2>
            <p className="text-gray-600 mb-6">Please run the analysis again.</p>
            <button onClick={handleStartOver} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">Start Over</button>
          </div>
        </div>
      </div>
    );
  }

  const { structuredData } = analysisResult;
  const sources = analysisResult.sources || [];

  const AllInOneView = () => (
    <div id="all-content-wrapper" className="space-y-12">
      <section className="page-break-after">
        <ExecutiveSummary data={structuredData.executiveSummaryData} companyName={structuredData.name} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} mermaidCode={structuredData.pictorial_technology_definition?.[0]?.value} />
      </section>
      <section>
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Data & Charts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.indian_competitor_chart_data} title="Funding Comparison (Indian)" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.global_competitor_chart_data} title="Funding Comparison (Global)" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.market_size_chart_data} title="Market Size Projection" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.market_subcategory_share_chart_data} title="Market Share by Subcategory" /></div>
          <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.market_subcategory_growth_chart_data} title="Subcategory Growth" /></div>
        </div>
        <div className="mt-12"><MermaidDiagram code={structuredData.pictorial_technology_definition?.[0]?.value} title="Pictorial Technology Definition" /></div>
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center mb-6">Indian Competitor Deep Dive</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {structuredData.indian_competitors.map((c, i) => <CompetitorCard key={`ind-${i}`} competitor={c} path={['structuredData', 'indian_competitors', i]} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />)}
          </div>
        </div>
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center mb-6">Global Competitor Deep Dive</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {structuredData.global_competitors.map((c, i) => <CompetitorCard key={`glo-${i}`} competitor={c} path={['structuredData', 'global_competitors', i]} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />)}
          </div>
        </div>
        <div className="mt-12">
          <FinancialProjectionsTable projections={structuredData.financial_projections} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />
        </div>
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center mb-6">Founding Team</h3>
          <TeamDisplay founders={structuredData.executiveSummaryData.team?.founders} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />
        </div>
      </section>
      <section>
        <Resources news={structuredData.news_articles} videos={structuredData.youtube_videos} papers={structuredData.research_papers} sources={sources} keywords={allKeywords} highlightEnabled={highlightEnabled} />
      </section>
      <section>
        <LegalAnalysis founderIssues={structuredData.executiveSummaryData.legal_analysis?.founder_legal_issues} companyIssues={structuredData.executiveSummaryData.legal_analysis?.company_legal_issues} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />
      </section>
      <div>
        <ICNote data={structuredData} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />
      </div>
    </div>
  );

  const renderContent = () => {
    const commonProps = { data: structuredData, onUpdate: handleDataChange, keywords: allKeywords, highlightEnabled };
    switch (activeTab) {
      case 'all': return <AllInOneView />;
      case 'executiveSummary': return <ExecutiveSummary data={structuredData.executiveSummaryData} companyName={structuredData.name} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} mermaidCode={structuredData.pictorial_technology_definition?.[0]?.value} />;
      case 'report': return <ICNote {...commonProps} />;
      case 'data':
        return (
          <div className="space-y-12">
            <h2 className="text-3xl font-bold text-center text-gray-800">Data & Charts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.indian_competitor_chart_data} title="Indian Competitors Funding" /></div>
              <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.global_competitor_chart_data} title="Global Competitors Funding" /></div>
              <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.market_size_chart_data} title="Market Size Projection" /></div>
              <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.market_subcategory_share_chart_data} title="Market Share" /></div>
              <div className="bg-white p-4 rounded-lg shadow-sm border"><CompetitorChart data={structuredData.market_subcategory_growth_chart_data} title="Subcategory Growth" /></div>
            </div>
            <MermaidDiagram code={structuredData.pictorial_technology_definition?.[0]?.value} title="Technology Architecture" />
            <FinancialProjectionsTable projections={structuredData.financial_projections} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />
            <div>
              <h3 className="text-2xl font-bold text-center mb-6">Indian Competitors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {structuredData.indian_competitors.map((c, i) => <CompetitorCard key={`ind-${i}`} competitor={c} path={['structuredData', 'indian_competitors', i]} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />)}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-center mb-6">Global Competitors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {structuredData.global_competitors.map((c, i) => <CompetitorCard key={`glo-${i}`} competitor={c} path={['structuredData', 'global_competitors', i]} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />)}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-center mb-6">Founding Team</h3>
              <TeamDisplay founders={structuredData.executiveSummaryData.team?.founders} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-center mb-6">Raw JSON Data</h3>
              <textarea className="w-full h-96 font-mono text-xs p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={JSON.stringify(structuredData, null, 2)} onChange={(e) => handleRawJsonChange(e.target.value)} />
              {rawJsonError && <p className="text-red-500 text-sm mt-2">{rawJsonError}</p>}
            </div>
          </div>
        );
      case 'resources':
        return <Resources news={structuredData.news_articles} videos={structuredData.youtube_videos} papers={structuredData.research_papers} sources={sources} keywords={allKeywords} highlightEnabled={highlightEnabled} />;
      case 'legal':
        return <LegalAnalysis founderIssues={structuredData.executiveSummaryData.legal_analysis?.founder_legal_issues} companyIssues={structuredData.executiveSummaryData.legal_analysis?.company_legal_issues} onUpdate={handleDataChange} keywords={allKeywords} highlightEnabled={highlightEnabled} />;
      case 'chat':
        return (
          <div className="flex flex-col h-[80vh] bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Chat with Analyst</h2>
              <PromptSelector prompts={prompts} onSelect={setChatInputAndSend} disabled={isChatting} />
            </div>
            <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <BrainCircuitIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />}
                  <div className={`p-4 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-200 text-gray-800 rounded-bl-sm'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isChatting && chatHistory[chatHistory.length - 1]?.role !== 'assistant' && (
                <div className="flex items-end gap-3 justify-start">
                  <BrainCircuitIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  <div className="p-4 rounded-lg bg-gray-200 rounded-bl-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-4">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask a follow-up question..." className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500" disabled={isChatting} />
                <button id="send-chat-button" onClick={handleSendMessage} disabled={!chatInput.trim() || isChatting} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Sidebar />
      <header className="bg-white shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            {user && savedSessions.length > 0 && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="View past analyses">
                <ClipboardDocumentListIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <BrainCircuitIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800 truncate">
              AI Analysis: <span className="font-normal">{structuredData.name}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">Highlighting</span>
              <label className="inline-flex relative items-center cursor-pointer">
                <input type="checkbox" checked={highlightEnabled} onChange={() => setHighlightEnabled(!highlightEnabled)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
            <button onClick={handleStartOver} className="text-sm font-semibold text-blue-600 hover:text-blue-800">New Analysis</button>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {renderTabButton('all', <ClipboardDocumentListIcon className="w-5 h-5" />, 'All-in-One')}
            {renderTabButton('executiveSummary', <SparklesIcon className="w-5 h-5" />, 'Executive Summary')}
            {renderTabButton('report', <BookOpenIcon className="w-5 h-5" />, 'IC Note')}
            {renderTabButton('data', <TableCellsIcon className="w-5 h-5" />, 'Data & Charts')}
            {renderTabButton('resources', <BuildingOfficeIcon className="w-5 h-5" />, 'Resources')}
            {renderTabButton('legal', <ScaleIcon className="w-5 h-5" />, 'Legal')}
            {renderTabButton('chat', <PencilSquareIcon className="w-5 h-5" />, 'Chat')}
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
