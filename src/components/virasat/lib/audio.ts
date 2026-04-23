/**
 * Plays raw PCM audio (16-bit Linear PCM, Mono, 24kHz) returned by Gemini TTS.
 */
let currentSource: AudioBufferSourceNode | null = null;
let currentContext: AudioContext | null = null;

export function stopPlayback() {
  try {
    currentSource?.stop();
  } catch {}
  try {
    currentContext?.close();
  } catch {}
  currentSource = null;
  currentContext = null;
}

export async function playPCMAudio(base64Data: string): Promise<void> {
  if (!base64Data) return;
  stopPlayback();

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 24000,
  });
  currentContext = audioContext;

  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const pcm = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, pcm.length, 24000);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768.0;

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  currentSource = source;

  return new Promise<void>((resolve) => {
    source.onended = () => {
      try { audioContext.close(); } catch {}
      if (currentSource === source) {
        currentSource = null;
        currentContext = null;
      }
      resolve();
    };
    source.start();
  });
}
