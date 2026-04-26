/**
 * Utility to play raw PCM audio data returned by Gemini TTS.
 * Gemini TTS returns 16-bit Linear PCM, Mono, 24kHz.
 */
export async function playPCMAudio(base64Data: string): Promise<void> {
  if (!base64Data) return;

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  return new Promise<void>((resolve) => {
    source.onended = () => {
      audioContext.close();
      resolve();
    };
    source.start();
  });
}
