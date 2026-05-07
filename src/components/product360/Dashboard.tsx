import React, { useEffect, useCallback, useState } from 'react';
import { AppState, GeneratedAssets, GenerationStatus, GenerationProgress } from './types';
import ResultsViewer from './ResultsViewer';
import { generateAngleImages, GenerationError } from './services/geminiService';

interface DashboardProps {
  productImage: File;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  generatedAssets: GeneratedAssets | null;
  setGeneratedAssets: React.Dispatch<React.SetStateAction<GeneratedAssets | null>>;
  generationStatus: GenerationStatus;
  setGenerationStatus: React.Dispatch<React.SetStateAction<GenerationStatus>>;
  onGenerationFinished?: (success: boolean) => void;
}

const ProgressIndicator: React.FC<{ status: GenerationProgress; title: string }> = ({ status, title }) => (
  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
    <div className="w-8 h-8 flex-shrink-0">
      {status === 'loading' && <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />}
      {status === 'success' && <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      {status === 'error' && <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      {status === 'idle' && <div className="w-8 h-8 rounded-full bg-muted" />}
    </div>
    <div><h3 className="font-semibold text-foreground">{title}</h3></div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { productImage, appState, setAppState, generatedAssets, setGeneratedAssets,
    generationStatus, setGenerationStatus, onGenerationFinished } = props;
  const [retrying, setRetrying] = useState(false);

  const runGeneration = useCallback(async (existingImages = generatedAssets?.images || []) => {
    const onProgress = (s: Partial<GenerationStatus>) => setGenerationStatus(prev => ({ ...prev, ...s }));
    try {
      const images = await generateAngleImages(productImage, onProgress, existingImages);
      if (images && images.length > 1) {
        setGeneratedAssets({ images });
        setAppState(AppState.DONE);
        onGenerationFinished?.(true);
      } else {
        throw new Error("Asset generation did not return any images.");
      }
    } catch (e) {
      console.error("Generation process failed", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown generation error occurred.";
      let hadAny = false;
      if (e instanceof GenerationError && e.completedImages.length > 0) {
        setGeneratedAssets({ images: e.completedImages });
        hadAny = e.completedImages.length > 1;
      }
      setGenerationStatus(prev => ({ ...prev, rotational: 'error', vertical: 'error', message: errorMessage }));
      setAppState(AppState.DONE);
      onGenerationFinished?.(hadAny);
    } finally {
      setRetrying(false);
    }
  }, [productImage, setAppState, setGeneratedAssets, setGenerationStatus, generatedAssets, onGenerationFinished]);

  useEffect(() => {
    if (appState === AppState.GENERATING && !generatedAssets && !retrying) {
      runGeneration([]);
    }
  }, [appState, generatedAssets, runGeneration, retrying]);

  const handleRetry = () => {
    setRetrying(true);
    setGenerationStatus({ rotational: 'loading', vertical: 'loading', message: 'Retrying from last checkpoint...' });
    setAppState(AppState.GENERATING);
    runGeneration(generatedAssets?.images || []);
  };

  if (appState === AppState.GENERATING) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-card border border-border rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Generating Your Assets...</h2>
        <div className="space-y-4">
          <ProgressIndicator status={generationStatus.rotational} title="Generating Rotational Sequence" />
          <ProgressIndicator status={generationStatus.vertical} title="Generating Vertical Angles" />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6 h-5">{generationStatus.message}</p>
      </div>
    );
  }

  const hasError = generationStatus.rotational === 'error' || generationStatus.vertical === 'error';
  const hasPartial = hasError && generatedAssets && generatedAssets.images.length > 0;

  return (
    <div>
      {generatedAssets && appState === AppState.DONE && !hasError ? (
        <ResultsViewer assets={generatedAssets} productImage={productImage} />
      ) : (
        appState === AppState.DONE && hasError && (
          <div className="space-y-6">
            {hasPartial && <ResultsViewer assets={generatedAssets!} productImage={productImage} />}
            <div className="max-w-md mx-auto p-8 bg-destructive/10 rounded-2xl text-center">
              <h3 className="text-xl font-bold text-destructive">Generation Partially Failed</h3>
              <p className="text-destructive mt-2">{generationStatus.message || "An unknown error occurred."}</p>
              {hasPartial && (
                <p className="text-sm text-muted-foreground mt-1">
                  {generatedAssets!.images.length} angle(s) were generated successfully.
                </p>
              )}
              <button onClick={handleRetry}
                className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Retry from where it stopped
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Dashboard;
