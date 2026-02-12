import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const CHROME_FILES = [
  'manifest.json', 'popup.html', 'popup.js', 'background.js', 'content.js',
  'README.md', 'icons/icon128.png'
];

const FIREFOX_FILES = [
  'manifest.json', 'popup.html', 'popup.js', 'background.js', 'content.js',
  'icons/icon128.png'
];

export const downloadExtension = async (
  browser: string,
  setDownloading: (v: boolean) => void
) => {
  setDownloading(true);

  try {
    const isFirefox = browser === 'firefox';
    const folder = isFirefox ? 'firefox' : 'chrome';
    const files = isFirefox ? FIREFOX_FILES : CHROME_FILES;
    const zip = new JSZip();
    const extFolder = zip.folder(`ezmylife-extension-${folder}`)!;

    const results = await Promise.all(
      files.map(async (file) => {
        const res = await fetch(`/extensions/${folder}/${file}`);
        if (!res.ok) throw new Error(`Failed to fetch ${file}`);
        const blob = await res.blob();
        return { file, blob };
      })
    );

    for (const { file, blob } of results) {
      extFolder.file(file, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `ezmylife-extension-${folder}.zip`);
  } catch (err) {
    console.error('Download error:', err);
    throw err;
  } finally {
    setDownloading(false);
  }
};
