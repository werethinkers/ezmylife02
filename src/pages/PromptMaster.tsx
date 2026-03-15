import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  User, Cpu, Sparkles, Rocket, MapIcon, Mountain, Building, Bird, Shield, TreesIcon, Bot,
  Heart, Moon, Cloud, Zap, Clock3, CloudRain, Wind, Sun,
  MoveRight, ZoomIn, RefreshCw, Hand,
  Mic, Music2, Coffee, Music, CloudLightning,
  Gamepad2, Brush, Pen, PenTool,
  Search, Maximize, Eye,
  Sunrise, Focus,
  UserCheck, Palette,
  HelpCircle, Type, Image, Video, Clapperboard, BookOpen,
  PlusCircle, Activity, Camera, Link, Check, Terminal, X, Trash2,
  ChevronUp, ChevronDown, ShieldAlert, Wand2, Save, ArrowLeft, Loader2,
  Star, StarOff, List
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// ---- Types ----
type WritingSkill = 'none' | 'rewrite' | 'professional' | 'personal' | 'friendly' | 'informative' | 'creative';

interface PromptOption {
  id: string;
  label: string;
  value: string;
  category: string;
  iconName: string;
  positiveTokens?: string[];
  negativeTokens?: string[];
}

interface CustomTag {
  id: string;
  label: string;
  value: string;
  category: string;
}

interface SelectionState {
  [category: string]: string[];
}

interface Variation {
  title: string;
  prompt: string;
}

interface FavouritePrompt {
  id: string;
  prompt: string;
  shortcut: string;
  title: string;
  createdAt: string;
}

interface SessionData {
  context: string;
  negativeInput: string;
  selections: SelectionState;
  activeFormat: string;
  writingSkill: WritingSkill;
  branding: { logo: string; text: string };
  customTags: CustomTag[];
  suggestions: Variation[];
  favourites?: FavouritePrompt[];
}

// ---- Constants ----
const FORMATS = [
  { id: 'text', label: 'Text', icon: 'Type', color: 'bg-slate-700' },
  { id: 'image', label: 'Image', icon: 'Image', color: 'bg-blue-600' },
  { id: 'video', label: 'Video', icon: 'Video', color: 'bg-purple-600' },
  { id: 'hindi_film', label: 'Hindi Film', icon: 'Clapperboard', color: 'bg-orange-600' },
  { id: 'story', label: 'Story', icon: 'BookOpen', color: 'bg-emerald-600' },
];

const WRITING_SKILLS: { id: WritingSkill; label: string }[] = [
  { id: 'none', label: 'Default Style' },
  { id: 'rewrite', label: 'Rewrite & Polish' },
  { id: 'professional', label: 'Professional Tone' },
  { id: 'personal', label: 'Personal / Casual' },
  { id: 'friendly', label: 'Friendly & Warm' },
  { id: 'informative', label: 'Informative / Technical' },
  { id: 'creative', label: 'Creative / Artistic' },
];

const CATEGORIES = [
  { id: 'subject', label: 'Subject', icon: 'User', color: 'bg-blue-500', textColor: 'text-blue-500', formats: ['image', 'video', 'hindi_film', 'text'] },
  { id: 'vibe', label: 'Mood', icon: 'Heart', color: 'bg-rose-500', textColor: 'text-rose-500', formats: ['image', 'video', 'hindi_film', 'story', 'text'] },
  { id: 'motion', label: 'Motion', icon: 'Activity', color: 'bg-indigo-500', textColor: 'text-indigo-500', formats: ['video'] },
  { id: 'audio', label: 'Audio', icon: 'Music', color: 'bg-amber-500', textColor: 'text-amber-500', formats: ['video', 'hindi_film'] },
  { id: 'style', label: 'Style', icon: 'Palette', color: 'bg-purple-500', textColor: 'text-purple-500', formats: ['image', 'video', 'text'] },
  { id: 'camera', label: 'Camera', icon: 'Camera', color: 'bg-emerald-500', textColor: 'text-emerald-500', formats: ['image', 'video', 'hindi_film'] },
  { id: 'lighting', label: 'Light', icon: 'Zap', color: 'bg-orange-400', textColor: 'text-orange-400', formats: ['image', 'video', 'hindi_film'] },
  { id: 'reference', label: 'Ref', icon: 'Link', color: 'bg-cyan-500', textColor: 'text-cyan-500', formats: ['image', 'video'] },
  { id: 'custom', label: 'Extra', icon: 'PlusCircle', color: 'bg-slate-700', textColor: 'text-slate-700', formats: ['image', 'video', 'hindi_film', 'story', 'text'] },
];

const OPTIONS: PromptOption[] = [
  { id: 'portrait', label: 'Face', value: 'Close-up face portrait, hyper-realistic detail', category: 'subject', iconName: 'User' },
  { id: 'cyber', label: 'Cyborg', value: 'Cybernetic humanoid with glowing implants', category: 'subject', iconName: 'Cpu' },
  { id: 'mythic', label: 'Deity', value: 'Ancient mythological god in celestial realm', category: 'subject', iconName: 'Sparkles' },
  { id: 'sci_fi', label: 'Pilot', value: 'Spaceship pilot in advanced flight suit', category: 'subject', iconName: 'Rocket' },
  { id: 'urban', label: 'Street', value: 'Cinematic candid street photography of city life', category: 'subject', iconName: 'Map' },
  { id: 'landscape', label: 'Vista', value: 'Wide expansive mountain range under twilight', category: 'subject', iconName: 'Mountain' },
  { id: 'architecture', label: 'Modern', value: 'Futuristic parametric skyscraper design', category: 'subject', iconName: 'Building' },
  { id: 'creature', label: 'Beast', value: 'Terrifying eldritch horror monster', category: 'subject', iconName: 'Bird' },
  { id: 'knight', label: 'Knight', value: 'Medieval knight in ornate plate armor', category: 'subject', iconName: 'Shield' },
  { id: 'forest', label: 'Forest', value: 'Ancient enchanted overgrown forest', category: 'subject', iconName: 'Trees' },
  { id: 'robot', label: 'Bot', value: 'Industrial assembly robot arm', category: 'subject', iconName: 'Bot' },
  { id: 'epic', label: 'Epic', value: 'Grand cinematic scale, legendary feel', category: 'vibe', iconName: 'Globe' },
  { id: 'noir', label: 'Noir', value: 'Moody dark shadows, high contrast black and white', category: 'vibe', iconName: 'Moon' },
  { id: 'dreamy', label: 'Dreamy', value: 'Soft ethereal hazy dreamlike atmosphere', category: 'vibe', iconName: 'Cloud' },
  { id: 'dynamic', label: 'Action', value: 'High intensity, kinetic energy, fast-paced', category: 'vibe', iconName: 'Zap' },
  { id: 'nostalgic', label: '90s', value: 'Vintage nostalgic 90s analog aesthetic', category: 'vibe', iconName: 'History' },
  { id: 'somber', label: 'Somber', value: 'Quiet melancholic brooding mood', category: 'vibe', iconName: 'CloudRain' },
  { id: 'serene', label: 'Zen', value: 'Peaceful tranquil meditative atmosphere', category: 'vibe', iconName: 'Wind' },
  { id: 'neon_vibe', label: 'Neon', value: 'Vivid synthwave neon cyberpunk glow', category: 'vibe', iconName: 'Sun' },
  { id: 'panning', label: 'Pan', value: 'Cinematic horizontal camera pan', category: 'motion', iconName: 'MoveRight' },
  { id: 'zoom_in', label: 'Push', value: 'Slow dramatic push-in zoom', category: 'motion', iconName: 'ZoomIn' },
  { id: 'orbit', label: 'Orbit', value: 'Full 360-degree camera orbit', category: 'motion', iconName: 'RefreshCw' },
  { id: 'slow_mo', label: 'Slow', value: 'Ultra slow motion 120fps physics', category: 'motion', iconName: 'Clock' },
  { id: 'handheld', label: 'Shake', value: 'Documentary style handheld camera shake', category: 'motion', iconName: 'Hand' },
  { id: 'narrator', label: 'Voice', value: 'Deep professional male narrator voiceover', category: 'audio', iconName: 'Mic' },
  { id: 'synth', label: 'Synth', value: 'Pulsing electronic synthesizer soundtrack', category: 'audio', iconName: 'Music2' },
  { id: 'lofi', label: 'Lofi', value: 'Chill lofi hip hop beats, cozy vibe', category: 'audio', iconName: 'Coffee' },
  { id: 'orchestra', label: 'Score', value: 'Epic cinematic orchestral background score', category: 'audio', iconName: 'Music' },
  { id: 'thunder', label: 'Nature', value: 'Sound of heavy rain and distant thunder', category: 'audio', iconName: 'CloudLightning' },
  { id: 'anime', label: 'Anime', value: 'High fidelity modern anime art style', category: 'style', iconName: 'Gamepad2' },
  { id: 'oil', label: 'Oil', value: 'Classical thick impasto oil painting', category: 'style', iconName: 'Brush' },
  { id: 'vector', label: 'Flat', value: 'Clean minimalist vector illustration', category: 'style', iconName: 'Pen' },
  { id: 'sketch', label: 'Pencil', value: 'Raw graphite pencil drawing sketch', category: 'style', iconName: 'PenTool' },
  { id: 'glitch', label: 'Glitch', value: 'Digital glitch art artifacts aesthetic', category: 'style', iconName: 'Zap' },
  { id: 'macro', label: 'Macro', value: 'Microscopic extreme close up detail', category: 'camera', iconName: 'Search' },
  { id: 'wide', label: 'Wide', value: 'Ultra wide angle panoramic perspective', category: 'camera', iconName: 'Maximize' },
  { id: 'drone', label: 'Aerial', value: "Top down bird's eye view drone shot", category: 'camera', iconName: 'Wind' },
  { id: 'pov', label: 'POV', value: 'First person immersive perspective', category: 'camera', iconName: 'Eye' },
  { id: 'neon_light', label: 'Neon', value: 'Vivid blue and pink neon lighting', category: 'lighting', iconName: 'Zap' },
  { id: 'sunset', label: 'Sunset', value: 'Warm golden hour sunset backlighting', category: 'lighting', iconName: 'Sunrise' },
  { id: 'soft', label: 'Soft', value: 'Diffused cinematic studio lighting', category: 'lighting', iconName: 'Sun' },
  { id: 'dramatic', label: 'High Key', value: 'Strong high contrast dramatic shadows', category: 'lighting', iconName: 'Focus' },
  { id: 'cref', label: 'Person', value: '--cref', category: 'reference', iconName: 'UserCheck' },
  { id: 'sref', label: 'Style', value: '--sref', category: 'reference', iconName: 'Palette' },
];

const BASE_POSITIVE_TOKENS = ['ultra-detailed', 'masterpiece', '8k'];
const BASE_NEGATIVE_TOKENS = ['lowres', 'blur', 'ugly'];

// ---- Generate shortcut from prompt ----
const generateShortcut = (prompt: string, existingShortcuts: string[]): string => {
  // Extract meaningful words (skip common words)
  const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'but', 'not', 'no', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
  const words = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

  const candidates: string[] = [];

  // Strategy 1: First letters of first 4 words
  if (words.length >= 2) {
    candidates.push(words.slice(0, 4).map(w => w[0]).join('').toUpperCase());
  }
  // Strategy 2: First 2-4 letters of first word
  if (words.length >= 1) {
    candidates.push(words[0].slice(0, 4).toUpperCase());
    candidates.push(words[0].slice(0, 3).toUpperCase());
    candidates.push(words[0].slice(0, 2).toUpperCase());
  }
  // Strategy 3: First 2 letters of first two words
  if (words.length >= 2) {
    candidates.push((words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase());
  }

  const existingSet = new Set(existingShortcuts.map(s => s.toUpperCase()));
  for (const c of candidates) {
    if (c.length >= 2 && c.length <= 4 && !existingSet.has(c)) return c;
  }

  // Fallback: random 4 chars from prompt initials + number
  let fallback = (words.length > 0 ? words[0].slice(0, 2) : 'PM').toUpperCase();
  let counter = 1;
  while (existingSet.has(fallback + counter)) counter++;
  return (fallback + counter).slice(0, 4);
};

// ---- Icon resolver ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
  User, Cpu, Sparkles, Rocket, Map: MapIcon, Mountain, Building, Bird, Shield, Trees: TreesIcon, Bot,
  Heart, Moon, Cloud, Zap, CloudRain, Wind, Sun,
  MoveRight, ZoomIn, RefreshCw, Clock: Clock3, Hand,
  Mic, Music2, Coffee, Music, CloudLightning,
  Gamepad2, Brush, Pen, PenTool,
  Search, Maximize, Eye,
  Sunrise, Focus,
  UserCheck, Palette,
  Type, Image, Video, Clapperboard, BookOpen,
  PlusCircle, Activity, Camera, Link, Check, Globe: Sparkles,
  Box: PlusCircle, History: Clock3,
};

const Icon = ({ name, className, size = 18, strokeWidth }: { name: string; className?: string; size?: number; strokeWidth?: number }) => {
  const LucideIcon = iconMap[name] || HelpCircle;
  return <LucideIcon className={className} size={size} strokeWidth={strokeWidth} />;
};

// ---- Prompt building ----
const buildPrompt = (context: string, selections: SelectionState, customTags: CustomTag[], branding: { logo: string; text: string }, writingSkill: WritingSkill) => {
  const primaryParts = context.trim() ? [context.trim()] : [];
  const positiveSet = new Set<string>();
  const negativeSet = new Set<string>();
  const outputType = selections['format']?.[0] || 'text';

  if (['image', 'video', 'hindi_film'].includes(outputType)) {
    BASE_POSITIVE_TOKENS.forEach(t => positiveSet.add(t));
    BASE_NEGATIVE_TOKENS.forEach(t => negativeSet.add(t));
  }

  ['subject', 'vibe', 'motion', 'audio', 'style', 'camera', 'lighting'].forEach(catId => {
    (selections[catId] || []).forEach(id => {
      const opt = OPTIONS.find(o => o.id === id);
      if (opt) {
        primaryParts.push(opt.value);
        if (['image', 'video', 'hindi_film'].includes(outputType)) {
          opt.positiveTokens?.forEach(t => positiveSet.add(t));
          opt.negativeTokens?.forEach(t => negativeSet.add(t));
        }
      }
    });
  });

  (selections['custom'] || []).forEach(id => {
    const custom = customTags.find(t => t.id === id);
    if (custom) primaryParts.push(custom.value);
  });

  if (branding.logo) primaryParts.push(`logo: "${branding.logo}"`);
  if (branding.text) primaryParts.push(`text: "${branding.text}"`);

  return {
    primary: primaryParts.filter(Boolean).join(', '),
    positive: Array.from(positiveSet).join(', '),
    negative: Array.from(negativeSet).join(', '),
    outputType,
    writingSkill
  };
};

const formatOutput = (prompt: ReturnType<typeof buildPrompt>) => {
  let finalPrimary = prompt.primary;
  if (prompt.writingSkill !== 'none') {
    const prefixes: Record<WritingSkill, string> = { none: '', rewrite: '[REWRITE]', professional: '[PROFESSIONAL]', personal: '[PERSONAL]', friendly: '[FRIENDLY]', informative: '[INFORMATIVE]', creative: '[CREATIVE]' };
    finalPrimary = `${prefixes[prompt.writingSkill]} ${finalPrimary}`;
  }
  if (prompt.outputType === 'hindi_film') finalPrimary = `[HINDI FILM SCRIPT] ${finalPrimary}. Act as a Bollywood scriptwriter.`;
  else if (prompt.outputType === 'video') finalPrimary = `[VIDEO PROMPT] ${finalPrimary}. Cinematic movement.`;
  else if (prompt.outputType === 'story') finalPrimary = `[NARRATIVE STORY] ${finalPrimary}. Literary style.`;
  else if (prompt.outputType === 'text') return finalPrimary;
  return `${finalPrimary}${prompt.positive ? ', ' + prompt.positive : ''}`;
};

// ---- Favourite Item Component ----
const FavouriteItem: React.FC<{ fav: FavouritePrompt; onUse: (fav: FavouritePrompt) => void; onRemove: (id: string) => void; onEdit?: (id: string, newPrompt: string, newShortcut: string) => void }> = ({ fav, onUse, onRemove, onEdit }) => {
  const [keyCopied, setKeyCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState(fav.prompt);
  const [editShortcut, setEditShortcut] = useState(fav.shortcut);

  const handleCopyKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('/' + fav.shortcut);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 1500);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editPrompt.trim() || !editShortcut.trim()) return;
    onEdit?.(fav.id, editPrompt.trim(), editShortcut.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditPrompt(fav.prompt);
    setEditShortcut(fav.shortcut);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-slate-50 border-2 border-sky-400 rounded-2xl p-3" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Shortcut</label>
            <input
              type="text"
              value={editShortcut}
              onChange={(e) => setEditShortcut(e.target.value)}
              className="w-full mt-1 px-2 py-1 text-[10px] border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Prompt</label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              rows={4}
              className="w-full mt-1 px-2 py-1 text-[10px] border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-y"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancelEdit} className="px-2 py-1 text-[8px] font-bold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">Cancel</button>
            <button onClick={handleSaveEdit} className="px-2 py-1 text-[8px] font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors">Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-slate-50 border border-slate-200 rounded-2xl p-3 hover:border-amber-300 transition-all group cursor-pointer"
      onClick={() => onUse(fav)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
            /{fav.shortcut}
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[7px] font-bold uppercase tracking-wider" title="Synced to browser extension">
            <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Synced
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyKey}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-100 rounded-lg transition-all"
            title={keyCopied ? 'Copied!' : 'Copy shortcut key'}
          >
            {keyCopied ? (
              <Check size={10} className="text-green-500" />
            ) : (
              <Link size={10} className="text-blue-500" />
            )}
          </button>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-sky-100 rounded-lg transition-all"
              title="Edit favourite"
            >
              <Pen size={10} className="text-sky-500" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(fav.id); }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-100 rounded-lg transition-all"
            title="Remove favourite"
          >
            <Trash2 size={10} className="text-rose-500" />
          </button>
        </div>
      </div>
      <p className="text-[9px] font-bold text-slate-700 leading-relaxed line-clamp-3">{fav.prompt}</p>
      <p className="text-[7px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
        {new Date(fav.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
};

// ---- Main Component ----
const PromptMaster: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFormat, setActiveFormat] = useState(FORMATS[0].id);
  const [context, setContext] = useState('');
  const [negativeInput, setNegativeInput] = useState('');
  const [selections, setSelections] = useState<SelectionState>({ format: [FORMATS[0].id] });
  const [writingSkill, setWritingSkill] = useState<WritingSkill>('none');
  const [branding, setBranding] = useState({ logo: '', text: '' });
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [suggestions, setSuggestions] = useState<Variation[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isMagicWriting, setIsMagicWriting] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isLibraryVisible, setIsLibraryVisible] = useState(true);
  const [isSkillsMenuOpen, setIsSkillsMenuOpen] = useState(false);
  const [editableFinalPrompt, setEditableFinalPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [favourites, setFavourites] = useState<FavouritePrompt[]>([]);
  const [showFavourites, setShowFavourites] = useState(false);

  const skillsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load session on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('promptmaster_sessions')
        .select('session_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.session_data) {
        const s = data.session_data as unknown as SessionData;
        if (s.context) setContext(s.context);
        if (s.negativeInput) setNegativeInput(s.negativeInput);
        if (s.selections) setSelections(s.selections);
        if (s.activeFormat) {
          setActiveFormat(s.activeFormat);
          const newVisible = CATEGORIES.filter(c => c.formats.includes(s.activeFormat));
          if (newVisible.length > 0) setActiveCategory(newVisible[0].id);
        }
        if (s.writingSkill) setWritingSkill(s.writingSkill);
        if (s.branding) setBranding(s.branding);
        if (s.customTags) setCustomTags(s.customTags);
        if (s.suggestions) setSuggestions(s.suggestions);
        if (s.favourites) setFavourites(s.favourites);
      }
      setIsLoaded(true);
    };
    load();
  }, [user]);

  // Click outside skills menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skillsRef.current && !skillsRef.current.contains(event.target as Node)) {
        setIsSkillsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleCategories = useMemo(() => CATEGORIES.filter(c => c.formats.includes(activeFormat)), [activeFormat]);

  const promptData = useMemo(() => buildPrompt(context, selections, customTags, branding, writingSkill), [context, selections, customTags, branding, writingSkill]);

  const promptParts = useMemo(() => {
    const parts: { id: string; label: string; value: string; color: string; catId: string; icon?: string }[] = [];
    const fmt = FORMATS.find(f => f.id === activeFormat);
    if (fmt) parts.push({ id: 'format', label: 'Format', value: fmt.label, color: fmt.color, catId: 'format', icon: fmt.icon });
    visibleCategories.forEach(cat => {
      (selections[cat.id] || []).forEach(id => {
        let opt: PromptOption | CustomTag | undefined = OPTIONS.find(o => o.id === id);
        if (!opt && cat.id === 'custom') opt = customTags.find(t => t.id === id);
        if (opt) {
          parts.push({ id: opt.id, label: cat.label, value: opt.label, color: cat.color, catId: cat.id, icon: 'iconName' in opt ? opt.iconName : undefined });
        }
      });
    });
    return parts;
  }, [selections, customTags, activeFormat, visibleCategories]);

  const baseFormattedPrompt = useMemo(() => formatOutput(promptData), [promptData]);

  const finalStringComputed = useMemo(() => {
    if (activeFormat === 'text') return baseFormattedPrompt;
    const negPart = promptData.negative ? ` --no ${promptData.negative}` : '';
    const extraNeg = negativeInput ? `, ${negativeInput}` : '';
    return `${baseFormattedPrompt}${negPart}${extraNeg}`;
  }, [baseFormattedPrompt, promptData.negative, negativeInput, activeFormat]);

  useEffect(() => {
    if (showPromptPreview) setEditableFinalPrompt(finalStringComputed);
  }, [showPromptPreview, finalStringComputed]);

  const toggleSelection = useCallback((category: string, optionId: string) => {
    setSelections(prev => {
      const current = prev[category] || [];
      const updated = current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId];
      return { ...prev, [category]: updated };
    });
  }, []);

  const handleFormatChange = (id: string) => {
    setActiveFormat(id);
    setSelections(prev => ({ ...prev, format: [id] }));
    const newVisible = CATEGORIES.filter(c => c.formats.includes(id));
    if (!newVisible.some(c => c.id === activeCategory)) {
      setActiveCategory(newVisible[0]?.id || 'custom');
    }
  };

  const handleCopy = () => {
    const stringToCopy = showPromptPreview ? editableFinalPrompt : finalStringComputed;
    navigator.clipboard.writeText(stringToCopy);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const handleBrainstorm = async () => {
    if (!context.trim() && Object.keys(selections).length <= 1) return;
    setIsSuggesting(true);
    try {
      const flatSelections = Object.values(selections).flat();
      const { data, error } = await supabase.functions.invoke('promptmaster-ai', {
        body: { action: 'brainstorm', context: context || 'Modern professional communication', selections: flatSelections, format: activeFormat },
      });
      if (error) throw error;
      const text = data?.text || '[]';
      try {
        const parsed = JSON.parse(text);
        setSuggestions(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Brainstorm failed:', err);
      toast.error('Failed to generate variations');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleMagicWrite = async () => {
    if (!context.trim()) return;
    setIsMagicWriting(true);
    try {
      const { data, error } = await supabase.functions.invoke('promptmaster-ai', {
        body: { action: 'magic_write', keywords: context, format: activeFormat },
      });
      if (error) throw error;
      const text = data?.text || '[]';
      try {
        const parsed = JSON.parse(text);
        setSuggestions(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Magic Write failed:', err);
      toast.error('Magic Write failed');
    } finally {
      setIsMagicWriting(false);
    }
  };

  const handleAddCustomTag = () => {
    if (!newCustomTag.trim()) return;
    const tag: CustomTag = { id: `custom-${Date.now()}`, label: newCustomTag, value: newCustomTag, category: 'custom' };
    setCustomTags(prev => [...prev, tag]);
    toggleSelection('custom', tag.id);
    setNewCustomTag('');
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save');
      return;
    }
    setIsSaving(true);
    const sessionData: SessionData = {
      context, negativeInput, selections, activeFormat, writingSkill, branding, customTags, suggestions, favourites,
    };
    try {
      const { error } = await supabase.from('promptmaster_sessions').upsert([{
        user_id: user.id,
        session_data: JSON.parse(JSON.stringify(sessionData)),
      }], { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Session saved!');
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFavourite = async () => {
    const promptText = showPromptPreview ? editableFinalPrompt : finalStringComputed;
    if (!promptText.trim()) {
      toast.error('Build a prompt first before favouriting');
      return;
    }
    if (!user) {
      toast.error('Please sign in to save favourites');
      return;
    }

    // Check for duplicate
    if (favourites.some(f => f.prompt === promptText)) {
      toast.info('This prompt is already in your favourites');
      return;
    }

    const existingShortcuts = favourites.map(f => f.shortcut);
    const shortcut = generateShortcut(promptText, existingShortcuts);
    const title = promptText.slice(0, 40) + (promptText.length > 40 ? '...' : '');

    const newFav: FavouritePrompt = {
      id: `fav-${Date.now()}`,
      prompt: promptText,
      shortcut,
      title,
      createdAt: new Date().toISOString(),
    };

    const updatedFavs = [...favourites, newFav];
    setFavourites(updatedFavs);

    // Auto-save to DB
    const sessionData: SessionData = {
      context, negativeInput, selections, activeFormat, writingSkill, branding, customTags, suggestions, favourites: updatedFavs,
    };
    try {
      await supabase.from('promptmaster_sessions').upsert([{
        user_id: user.id,
        session_data: JSON.parse(JSON.stringify(sessionData)),
      }], { onConflict: 'user_id' });
      toast.success(`Added to favourites! Shortcut: /${shortcut}`);
    } catch {
      toast.error('Failed to save favourite');
    }
  };

  const handleRemoveFavourite = async (favId: string) => {
    if (!user) return;
    const updatedFavs = favourites.filter(f => f.id !== favId);
    setFavourites(updatedFavs);

    const sessionData: SessionData = {
      context, negativeInput, selections, activeFormat, writingSkill, branding, customTags, suggestions, favourites: updatedFavs,
    };
    try {
      await supabase.from('promptmaster_sessions').upsert([{
        user_id: user.id,
        session_data: JSON.parse(JSON.stringify(sessionData)),
      }], { onConflict: 'user_id' });
      toast.success('Removed from favourites');
    } catch {
      toast.error('Failed to remove favourite');
    }
  };

  const handleUseFavourite = (fav: FavouritePrompt) => {
    setContext(fav.prompt);
    setShowFavourites(false);
    toast.success(`Loaded favourite: /${fav.shortcut}`);
  };

  const handleEditFavourite = async (favId: string, newPrompt: string, newShortcut: string) => {
    if (!user) return;
    const updatedFavs = favourites.map(f => 
      f.id === favId ? { ...f, prompt: newPrompt, shortcut: newShortcut, title: newPrompt.slice(0, 40) + (newPrompt.length > 40 ? '...' : '') } : f
    );
    setFavourites(updatedFavs);

    const sessionData: SessionData = {
      context, negativeInput, selections, activeFormat, writingSkill, branding, customTags, suggestions, favourites: updatedFavs,
    };
    try {
      await supabase.from('promptmaster_sessions').upsert([{
        user_id: user.id,
        session_data: JSON.parse(JSON.stringify(sessionData)),
      }], { onConflict: 'user_id' });
      toast.success('Favourite updated');
    } catch {
      toast.error('Failed to update favourite');
    }
  };

  const clearContext = () => {
    setContext('');
    setSuggestions([]);
  };

  const cycleFormat = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = FORMATS.findIndex(f => f.id === activeFormat);
    handleFormatChange(FORMATS[(currentIndex + 1) % FORMATS.length].id);
  };

  const currentCategoryObj = useMemo(() => CATEGORIES.find(c => c.id === activeCategory), [activeCategory]);
  const activeOptions = useMemo(() => activeCategory === 'custom' ? customTags : OPTIONS.filter(o => o.category === activeCategory), [activeCategory, customTags]);

  const isFavourited = useMemo(() => {
    const currentPrompt = showPromptPreview ? editableFinalPrompt : finalStringComputed;
    return favourites.some(f => f.prompt === currentPrompt);
  }, [favourites, showPromptPreview, editableFinalPrompt, finalStringComputed]);

  if (!isLoaded && user) {
    return (
      <div className="fixed inset-0 bg-[#F2F4F7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F2F4F7] text-slate-900 flex flex-col font-sans select-none overflow-hidden h-screen">
      {/* HEADER */}
      <div className="h-14 px-4 md:px-6 flex items-center justify-between bg-white border-b border-slate-200 z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="w-8 h-8 bg-slate-950 rounded-[12px] flex items-center justify-center text-white font-black italic shadow-xl">P</div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-[12px] uppercase tracking-tighter text-slate-900 leading-none">PromptMaster Elite</h1>
            <p className="text-[7px] font-black text-slate-400 tracking-[0.4em] mt-1">V16.5 TEXT ENGINE</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto max-w-[40%] sm:max-w-none" style={{ scrollbarWidth: 'none' }}>
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => handleFormatChange(f.id)}
              className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-xl text-[9px] md:text-[10px] font-black transition-all shrink-0 ${activeFormat === f.id ? `${f.color} text-white shadow-md` : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Icon name={f.icon} size={11} />
              <span className="hidden sm:inline uppercase">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={() => setShowFavourites(!showFavourites)} className={`p-2 rounded-xl transition-all relative ${showFavourites ? 'bg-amber-100 text-amber-600' : 'hover:bg-amber-50 text-slate-500'}`} title="Favourite Prompts">
            <Star size={16} strokeWidth={2.5} />
            {favourites.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">{favourites.length}</span>
            )}
          </button>
          <button onClick={handleBrainstorm} disabled={isSuggesting} className="p-2 hover:bg-amber-100 rounded-xl text-black transition-all" title="Brainstorm Variations">
            <Sparkles size={16} strokeWidth={2.5} className={isSuggesting ? "animate-pulse" : ""} />
          </button>
          <button onClick={handleSave} disabled={isSaving} className="p-2 hover:bg-emerald-100 rounded-xl text-emerald-600 transition-all" title="Save Session">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
          </button>
          <button onClick={handleCopy} className="px-3 py-2 md:px-5 md:py-2.5 bg-slate-950 text-white rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2">
            <Zap size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">Build & Copy</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDE RAIL */}
        <div className="w-14 md:w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 md:gap-8 z-40 overflow-y-auto shadow-[2px_0_10px_rgba(0,0,0,0.02)] shrink-0" style={{ scrollbarWidth: 'none' }}>
          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center gap-1.5 group transition-all shrink-0 ${activeCategory === cat.id ? 'opacity-100 scale-110' : 'opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-[14px] md:rounded-[16px] flex items-center justify-center transition-all ${activeCategory === cat.id ? `${cat.color} text-white shadow-xl` : 'bg-slate-100 text-black hover:bg-slate-200'}`}>
                <Icon name={cat.icon} size={18} strokeWidth={2.5} />
              </div>
              <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest text-center max-w-full truncate ${activeCategory === cat.id ? cat.textColor : 'text-black'}`}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB] relative overflow-hidden">
          {/* LIBRARY */}
          <div className="bg-white border-b border-slate-200 shrink-0 z-40 shadow-sm overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsLibraryVisible(!isLibraryVisible)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-black">
                  {isLibraryVisible ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                </button>
                <span className="text-[8px] font-black text-black uppercase tracking-[0.3em]">{activeCategory} Library</span>
              </div>
              {activeCategory === 'custom' && isLibraryVisible && (
                <div className="flex items-center gap-2">
                  <input type="text" className="bg-white border border-slate-200 py-1 px-3 text-[8px] font-black rounded-lg w-32 focus:outline-none uppercase text-black" placeholder="Add custom..." value={newCustomTag} onChange={(e) => setNewCustomTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()} />
                </div>
              )}
            </div>
            {isLibraryVisible && (
              <div className="flex items-center gap-4 px-4 h-16 md:h-20 overflow-x-auto snap-x" style={{ scrollbarWidth: 'none' }}>
                {activeOptions.map(opt => {
                  const isSelected = selections[activeCategory]?.includes(opt.id);
                  return (
                    <button key={opt.id} onClick={() => toggleSelection(activeCategory, opt.id)} className={`flex flex-col items-center gap-1 group transition-all shrink-0 pb-1 snap-center ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-[12px] md:rounded-[14px] flex items-center justify-center transition-all relative ${isSelected ? `${currentCategoryObj?.color} text-white shadow-xl scale-110` : 'bg-slate-100 text-black hover:bg-slate-200'}`}>
                        <Icon name={'iconName' in opt ? (opt as PromptOption).iconName : 'Box'} size={16} strokeWidth={2.5} />
                        {isSelected && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-slate-900"><Check className="text-slate-950" size={6} strokeWidth={5} /></div>}
                      </div>
                      <span className="text-[7px] font-black uppercase tracking-widest text-center max-w-[56px] truncate text-black">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ASSEMBLY BAR */}
          <div className="p-3 md:p-6 border-b border-slate-200 bg-white/50 backdrop-blur-xl shrink-0">
            <div className="max-w-6xl mx-auto space-y-3 md:space-y-4">
              <div className="bg-white border border-slate-200 rounded-[22px] md:rounded-[28px] p-2 pr-4 shadow-sm flex items-center gap-2 md:gap-3 relative overflow-hidden">
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 flex-1 pl-1 md:pl-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {promptParts.length > 0 ? (
                    promptParts.map((p, i) => (
                      <span
                        key={i}
                        onClick={(e) => { e.stopPropagation(); if (p.catId === 'format') cycleFormat(e); else setActiveCategory(p.catId); }}
                        className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-bold shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${p.color} text-white uppercase tracking-tight border border-white/10 shrink-0 cursor-pointer`}
                      >
                        {p.icon && <Icon name={p.icon} size={9} />}
                        {p.value}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] px-2 italic">Assemble modular components...</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:gap-3">
                <div className="relative group flex flex-col">
                  <Search size={12} className="absolute left-4 top-5 text-black group-focus-within:text-indigo-600 z-10" />
                  <textarea
                    className="w-full bg-white border border-slate-200 py-3.5 px-10 text-[10px] md:text-xs font-bold text-black placeholder-slate-400 focus:outline-none focus:border-indigo-400 rounded-xl md:rounded-2xl shadow-sm uppercase resize-none leading-relaxed"
                    placeholder={activeFormat === 'text' ? "Type your message or draft here..." : "Context / Keywords (e.g. Cyber City)..."}
                    rows={8}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                  <div className="absolute right-4 bottom-3 flex items-center gap-2 z-20">
                    <button onClick={clearContext} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all shadow-md border bg-slate-50 text-slate-400 border-slate-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 active:scale-90" title="Clear All Context">
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={handleAddFavourite}
                      className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all shadow-md border active:scale-90 ${isFavourited ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-50 text-amber-500 border-slate-200 hover:bg-amber-50'}`}
                      title={isFavourited ? 'Already favourited' : 'Add to Favourites'}
                    >
                      {isFavourited ? <Star size={14} strokeWidth={2.5} /> : <StarOff size={14} strokeWidth={2.5} />}
                    </button>
                    <button onClick={() => setShowPromptPreview(true)} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all shadow-md border bg-slate-50 text-black border-slate-200 hover:bg-slate-100 active:scale-90" title="View Final Engineered Text">
                      <Eye size={14} strokeWidth={2.5} />
                    </button>
                    <div className="relative" ref={skillsRef}>
                      <button onClick={() => setIsSkillsMenuOpen(!isSkillsMenuOpen)} className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all shadow-md border ${writingSkill !== 'none' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 text-black border-slate-200 hover:bg-slate-100'} active:scale-90`} title={`Writing Style: ${WRITING_SKILLS.find(s => s.id === writingSkill)?.label}`}>
                        <PenTool size={14} strokeWidth={2.5} />
                      </button>
                      {isSkillsMenuOpen && (
                        <div className="absolute right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-[100] w-48">
                          {WRITING_SKILLS.map(skill => (
                            <button key={skill.id} onClick={() => { setWritingSkill(skill.id); setIsSkillsMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${writingSkill === skill.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                              {skill.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={handleMagicWrite} disabled={isMagicWriting || !context.trim()} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-slate-950 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-30" title="Magic AI Refinement">
                      <Wand2 size={14} strokeWidth={2.5} className={isMagicWriting ? 'animate-pulse' : ''} />
                    </button>
                  </div>
                </div>

                {activeFormat !== 'text' && (
                  <div className="relative group">
                    <ShieldAlert size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-black group-focus-within:text-rose-600" />
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 py-2.5 px-10 text-[9px] md:text-[10px] font-bold text-rose-600 placeholder-rose-200 focus:outline-none focus:border-rose-400 rounded-xl md:rounded-2xl shadow-sm uppercase"
                      placeholder="Negative (e.g. Blurry, Distorted)..."
                      value={negativeInput}
                      onChange={(e) => setNegativeInput(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SUGGESTIONS */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20" style={{ scrollbarWidth: 'none' }}>
            <div className="max-w-6xl mx-auto space-y-10">
              {suggestions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-4 border-black pl-4">
                    <h4 className="text-[10px] font-black text-black uppercase tracking-widest">
                      {activeFormat === 'text' ? 'Message Variations & Refinements' : 'AI Variations & Insights'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {suggestions.map((s, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-sm hover:border-black transition-all group cursor-pointer" onClick={() => { setContext(s.prompt); setShowPromptPreview(true); }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[9px] font-black text-black uppercase tracking-widest">{s.title}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed line-clamp-3">"{s.prompt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAVOURITES PANEL */}
        {showFavourites && (
          <div className="w-72 md:w-80 bg-white border-l border-slate-200 flex flex-col z-40 shadow-[-4px_0_20px_rgba(0,0,0,0.05)] shrink-0">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Favourites</span>
                <span className="text-[8px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">{favourites.length}</span>
              </div>
              <button onClick={() => setShowFavourites(false)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'thin' }}>
              {favourites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <StarOff size={32} className="text-slate-300 mb-3" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No favourites yet</p>
                  <p className="text-[8px] text-slate-400 mt-1">Build a prompt and tap the ★ button</p>
                </div>
              ) : (
                favourites.map(fav => (
                  <FavouriteItem key={fav.id} fav={fav} onUse={handleUseFavourite} onRemove={handleRemoveFavourite} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* PROMPT PREVIEW MODAL */}
      {showPromptPreview && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPromptPreview(false); }}
        >
          <div ref={modalRef} className="bg-white w-full max-w-2xl rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 md:px-8 md:py-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white"><Terminal size={18} /></div>
                <h3 className="text-sm md:text-base font-black text-slate-900 uppercase">Engineered Terminal</h3>
              </div>
              <button onClick={() => setShowPromptPreview(false)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 active:scale-90 transition-all"><X size={18} /></button>
            </div>
            <div className="p-6 md:p-8">
              <div className="bg-slate-50 rounded-[20px] p-6 border border-slate-200 shadow-inner relative">
                <textarea
                  className="w-full h-48 md:h-64 bg-transparent text-xs md:text-sm font-medium text-slate-700 leading-relaxed font-mono focus:outline-none resize-none"
                  value={editableFinalPrompt}
                  onChange={(e) => setEditableFinalPrompt(e.target.value)}
                />
                <div className="absolute top-2 right-2 text-[8px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">Editable String</div>
              </div>
            </div>
            <div className="px-6 py-4 md:px-8 md:py-6 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
              <button onClick={() => setShowPromptPreview(false)} className="px-6 py-3 md:px-8 md:py-4 bg-slate-200 text-slate-700 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-slate-300 active:scale-95 transition-all">
                Done
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleAddFavourite}
                  className={`px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 active:scale-95 transition-all ${isFavourited ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'}`}
                >
                  <Star size={14} /> {isFavourited ? 'Favourited' : 'Favourite'}
                </button>
                <button onClick={handleCopy} className="px-6 py-3 md:px-8 md:py-4 bg-slate-950 text-white rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                  <Zap size={14} /> Copy Final String
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COPY TOAST */}
      {showCopyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] bg-slate-950 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="text-white" size={12} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Prompt Copied</span>
        </div>
      )}
    </div>
  );
};

export default PromptMaster;
