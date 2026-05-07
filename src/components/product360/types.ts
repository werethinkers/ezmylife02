export type Theme = 'light' | 'dark';

export enum AppState {
  API_KEY_REQUIRED = 'API_KEY_REQUIRED',
  START = 'START',
  GENERATING = 'GENERATING',
  DONE = 'DONE',
  BULK_UPLOAD = 'BULK_UPLOAD',
}

export type GenerationProgress = 'idle' | 'loading' | 'success' | 'error';

export interface GeneratedImage {
  id: string;
  angle: string;
  url: string;
}

export interface GeneratedAssets {
  images: GeneratedImage[];
}

export interface GenerationStatus {
  rotational: GenerationProgress;
  vertical: GenerationProgress;
  message: string;
}

export type BackgroundType = 'preset' | 'solid' | 'custom';

export interface BackgroundConfig {
  type: BackgroundType;
  value: string;
  label?: string;
}

export interface PlacementConfig {
  scale: number;
  posX: number;
  posY: number;
}

export interface BulkImage {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl?: string;
  compositedUrl?: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  generatedAngles: GeneratedImage[];
  errorMessage?: string;
  logoOverride?: LogoPosition;
}

export type BulkMode = 'full' | 'logo-only';

export interface LogoPosition {
  x: number;
  y: number;
  scale: number;
}

export interface LogoConfig extends LogoPosition {
  url: string;
}
