/**
 * Plays raw PCM audio (16-bit Linear PCM, Mono, 24kHz) returned by Gemini TTS.
 * Also exposes a helper that wraps the same PCM in a WAV blob so it can be
 * played by an HTMLAudioElement (which gives us pause/seek/timeupdate).
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

/**
 * Wraps a base64 PCM (16-bit, mono, 24kHz) string in a WAV header and returns
 * an object URL suitable for use with <audio src="...">.
 * Caller is responsible for calling URL.revokeObjectURL() when done.
 */
export function pcmBase64ToWavBlobUrl(
  base64Data: string,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16,
): string | null {
  if (!base64Data) return null;
  const binary = atob(base64Data);
  const pcmBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) pcmBytes[i] = binary.charCodeAt(i);

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);            // PCM chunk size
  view.setUint16(20, 1, true);             // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(pcmBytes);

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}
