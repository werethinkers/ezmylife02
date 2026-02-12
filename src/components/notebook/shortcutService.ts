import type { ShortcutMap, ShortcutItemData } from './types';

const SPREADSHEET_ID = '1voBoTHWfbEB4vC2O5_GYOG_5eknEXJ6piRYNT_FwA18';
const GVIZ_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;

const SHORTCUT_SHEETS: { name: string; gid: string }[] = [
    { name: 'General', gid: '0' },
    { name: 'Name', gid: '139912235' },
    { name: 'Phone', gid: '1672343825' },
    { name: 'WhatsApp', gid: '1220455531' },
    { name: 'Email', gid: '149669041' },
    { name: 'LinkedIn', gid: '597652792' },
    { name: 'Prompts', gid: '1823901438' },
    { name: 'Paribhasha', gid: '2049817763' },
    { name: 'Shabdkosh', gid: '318182583' },
    { name: 'Swadhyay', gid: '1529181169' },
];
const DICTIONARY_SHEET_GID = '1055725749';

const parseCsv = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  const text = csvText.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  currentRow.push(currentField);
  rows.push(currentRow);
  return rows;
};

const parseCsvToMap = (csvText: string, lowercaseKeys = false): ShortcutMap => {
  const dataMap: ShortcutMap = new Map<string, string>();
  const rows = parseCsv(csvText);
  const dataRows = rows.slice(1);
  for (const row of dataRows) {
    if (row.length === 1 && row[0].trim() === '') continue;
    if (row.length >= 2) {
      const key = row[0].trim();
      const value = row[1].trim();
      if (key) {
        dataMap.set(lowercaseKeys ? key.toLowerCase() : key, value);
      }
    }
  }
  return dataMap;
};

const parseCsvToShortcutItems = (csvText: string): ShortcutItemData[] => {
  const items: ShortcutItemData[] = [];
  const rows = parseCsv(csvText);
  if (rows.length < 2) return items;
  
  const header = rows[0].map(h => h.toLowerCase().trim());
  const dataRows = rows.slice(1);
  const keyIndex = 0;
  const valueIndex = 1;
  const categoryIndex = header.indexOf('category') !== -1 ? header.indexOf('category') : 4;

  for (const row of dataRows) {
    if (row.every(field => field.trim() === '')) continue;
    const key = (row[keyIndex] || '').trim();
    if (key) {
        const value = (row[valueIndex] || '').trim();
        const category = categoryIndex < row.length ? (row[categoryIndex] || '').trim() : '';
        items.push({ key, value, category });
    }
  }
  return items;
};

export const fetchShortcuts = async (): Promise<Map<string, ShortcutItemData[]>> => {
  const allShortcuts = new Map<string, ShortcutItemData[]>();
  try {
    const fetchPromises = SHORTCUT_SHEETS.map(async (sheet) => {
      const response = await fetch(`${GVIZ_CSV_URL}&gid=${sheet.gid}`, { cache: 'no-store' });
      if (!response.ok) return;
      const csvText = await response.text();
      const shortcuts = parseCsvToShortcutItems(csvText);
      if (shortcuts.length > 0) {
        allShortcuts.set(sheet.name, shortcuts);
      }
    });
    await Promise.all(fetchPromises);
    if (allShortcuts.size === 0) {
        throw new Error("No shortcut data could be loaded from any sheet.");
    }
    return allShortcuts;
  } catch (error) {
    console.error("Failed to fetch or parse shortcuts:", error);
    throw new Error("Could not load shortcuts.");
  }
};

export const fetchDictionary = async (): Promise<ShortcutMap> => {
    try {
      const response = await fetch(`${GVIZ_CSV_URL}&gid=${DICTIONARY_SHEET_GID}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      const csvText = await response.text();
      return parseCsvToMap(csvText, true);
    } catch (error) {
      console.error("Failed to fetch or parse dictionary:", error);
      throw new Error("Could not load dictionary.");
    }
};
