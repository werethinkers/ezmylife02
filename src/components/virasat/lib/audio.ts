/**
 * Utility to play raw PCM audio data returned by Gemini TTS.
 * Gemini TTS returns 16-bit Linear PCM, Mono, 24kHz.
 */

export interface AudioController {
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => void;
  ended: Promise<void>;
}

export function createPCMController(base64Data: string): AudioController | null {
  if (!base64Data) return null;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioCtx({ sampleRate: 24000 });

  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

  const pcmData = new Int16Array(bytes.buffer);
  const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < pcmData.length; i++) channelData[i] = pcmData[i] / 32768.0;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);

  let stopped = false;
  const ended = new Promise<void>((resolve) => {
    source.onended = () => {
      if (!stopped) {
        audioContext.close().catch(() => { /* ignore */ });
      }
      resolve();
    };
  });

  source.start();

  return {
    pause: async () => {
      try { await audioContext.suspend(); } catch { /* ignore */ }
    },
    resume: async () => {
      try { await audioContext.resume(); } catch { /* ignore */ }
    },
    stop: () => {
      stopped = true;
      try { source.stop(); } catch { /* ignore */ }
      audioContext.close().catch(() => { /* ignore */ });
    },
    ended,
  };
}

/** Backward-compatible fire-and-forget playback. */
export async function playPCMAudio(base64Data: string): Promise<void> {
  const ctrl = createPCMController(base64Data);
  if (!ctrl) return;
  await ctrl.ended;
}
