import { GeneratedImage, GenerationStatus } from '../types';
import { ROTATIONAL_SEQUENCE, VERTICAL_ANGLES } from '../constants';
import { removeWhiteBackground } from '../utils/backgroundRemover';
import { supabase } from '@/integrations/supabase/client';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const createPrompt = (targetAngle: string) => {
  if (targetAngle === 'Front (Clean)') {
    return `Reproduce this exact product photograph on a PURE WHITE background (#FFFFFF) in UHD quality. Do not change the angle, perspective, or any detail of the product. Preserve the exact color scheme and all fine details. Just place it perfectly isolated on a pure white background with no shadows. Enhance the sharpness and clarity to produce a crisp, high-definition result.`;
  }

  if (targetAngle === 'Intelligent Detail Close-Up') {
    return `Generate a single, ultra-realistic, UHD-quality close-up shot of the product's most important feature (like a logo or texture). The product MUST be perfectly isolated on a PURE WHITE background (#FFFFFF). Preserve exact colors and fine details.`;
  }

  return `The provided image shows the product from the Front angle. Generate a single, ultra-realistic, UHD-quality, catalog-grade e-commerce product photograph from a "${targetAngle}" perspective by rotating the product. The product MUST be perfectly isolated on a PURE WHITE background (#FFFFFF). Ensure there are no shadows on the background, just the product itself. You MUST perfectly preserve every detail, color, and texture of the product from the provided input image.

CRITICAL RULES:
- If the product is a box or container with items inside, keep ALL items inside the box — do NOT separate or remove them.
- If the product has wings, flaps, lids, handles, or any protruding parts, preserve their EXACT shape and position at this angle. Do not flatten, fold, or distort them.
- Do NOT alter, crop, or distort any logos, text, or branding on the product.
- Maintain the exact proportions and aspect ratio of the product.`;
};

const callEdgeFunction = async (
  imageBase64: string,
  mimeType: string,
  prompt: string,
  angle: string,
  retries: number = 2
): Promise<GeneratedImage | null> => {
  let lastError: any = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-angle', {
        body: { imageBase64, mimeType, prompt, angle },
      });

      if (error) throw new Error(error.message || 'Edge function invocation failed');
      if (data?.error) throw new Error(data.error);

      if (data?.base64) {
        const imageUrl = `data:${data.mimeType || 'image/png'};base64,${data.base64}`;
        const transparentUrl = await removeWhiteBackground(imageUrl);
        return { id: `${angle}-${Date.now()}-${i}`, angle, url: transparentUrl };
      }
      console.warn(`Attempt ${i + 1}: No image returned for angle: ${angle}`);
    } catch (error) {
      console.error(`Attempt ${i + 1}: Failed for angle ${angle}:`, error);
      lastError = error;
      if (i < retries) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (lastError) throw lastError;
  return null;
};

export class GenerationError extends Error {
  completedImages: GeneratedImage[];
  failedAngle: string;
  constructor(message: string, completedImages: GeneratedImage[], failedAngle: string) {
    super(message);
    this.name = 'GenerationError';
    this.completedImages = completedImages;
    this.failedAngle = failedAngle;
  }
}

export const generateAngleImages = async (
  image: File,
  onProgress: (status: Partial<GenerationStatus>) => void,
  existingImages: GeneratedImage[] = [],
  anglesToGenerate?: string[]
): Promise<GeneratedImage[]> => {
  const { base64: imageBase64, mimeType } = await fileToBase64(image);

  const allGeneratedImages: GeneratedImage[] = [...existingImages];
  const completedAngles = new Set(existingImages.map(img => img.angle));

  const wantsFront = !anglesToGenerate || anglesToGenerate.includes('Front') || anglesToGenerate.includes('Original');

  if (wantsFront && (!completedAngles.has('Original') || !completedAngles.has('Front'))) {
    onProgress({ message: 'Cleaning original image background...' });
    try {
      const cleanPrompt = createPrompt('Front (Clean)');
      const cleanResult = await callEdgeFunction(imageBase64, mimeType, cleanPrompt, 'Front (Clean)');
      if (cleanResult) {
        if (!completedAngles.has('Original')) {
          allGeneratedImages.push({ id: 'original-0', angle: 'Original', url: cleanResult.url });
          completedAngles.add('Original');
        }
        if (!completedAngles.has('Front')) {
          allGeneratedImages.push({ id: `front-${Date.now()}`, angle: 'Front', url: cleanResult.url });
          completedAngles.add('Front');
        }
      }
    } catch (error) {
      console.error('Failed to clean original background, using raw fallback:', error);
      const originalImageUrl = URL.createObjectURL(image);
      const transparentOriginalUrl = await removeWhiteBackground(originalImageUrl);
      if (!completedAngles.has('Original')) {
        allGeneratedImages.push({ id: 'original-0', angle: 'Original', url: transparentOriginalUrl });
        completedAngles.add('Original');
      }
      if (!completedAngles.has('Front')) {
        allGeneratedImages.push({ id: `front-${Date.now()}`, angle: 'Front', url: transparentOriginalUrl });
        completedAngles.add('Front');
      }
    }
  }

  const allAngles = anglesToGenerate
    ? anglesToGenerate.filter(a => a !== 'Front' && a !== 'Original')
    : [...ROTATIONAL_SEQUENCE, ...VERTICAL_ANGLES];
  const remainingAngles = allAngles.filter(a => !completedAngles.has(a));

  if (remainingAngles.length === 0) {
    onProgress({ rotational: 'success', vertical: 'success', message: 'All assets generated!' });
    return allGeneratedImages;
  }

  onProgress({ rotational: 'loading', vertical: 'loading', message: 'Generating product angles...' });

  for (let i = 0; i < remainingAngles.length; i++) {
    const angle = remainingAngles[i];
    const totalIdx = allAngles.indexOf(angle);
    onProgress({ message: `Generating ${angle} view (${totalIdx + 1}/${allAngles.length})...` });

    const prompt = createPrompt(angle);

    try {
      const result = await callEdgeFunction(imageBase64, mimeType, prompt, angle);
      if (result) {
        allGeneratedImages.push(result);
        completedAngles.add(angle);
      } else {
        console.warn(`Skipping angle ${angle} as it failed after retries.`);
      }
      if (i < remainingAngles.length - 1) await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error generating angle ${angle}:`, error);
      throw new GenerationError(
        `Failed generating ${angle}: ${error instanceof Error ? error.message : String(error)}`,
        allGeneratedImages,
        angle
      );
    }

    const rotationalDone = ROTATIONAL_SEQUENCE.every(a => completedAngles.has(a));
    const verticalDone = VERTICAL_ANGLES.every(a => completedAngles.has(a));
    onProgress({
      rotational: rotationalDone ? 'success' : 'loading',
      vertical: rotationalDone ? (verticalDone ? 'success' : 'loading') : 'loading',
    });
  }

  onProgress({ rotational: 'success', vertical: 'success', message: 'All assets generated!' });
  return allGeneratedImages;
};
