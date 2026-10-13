// Demo data for the Site Watch demo (Studios > Sites). Everything here is sample data; nothing is saved or sent.
// Photos are free-licence stock from Pexels (https://www.pexels.com/license/), shown as sample photos.

/** Where the "Need one customised for your venture?" buttons go. Fill these in; empty shows a placeholder. */
export const SITES_CONTACT = { whatsapp: "+91 9098083486", email: "ceo@ezyourlife.com" };

export type Sev = "High" | "Medium" | "Low";
export type AlertState = "open" | "tasked" | "dismissed" | "false";
export type DemoAlert = { id: number; site: string; cat: string; sev: Sev; title: string; when: string; src: string; conf: number; photo?: number; state: AlertState };
export type DemoTask = { id: string; alert: number; title: string; who: string; pri: string; due: string; status: "New" | "In progress" | "Done"; proof: boolean };

export const pexelsUrl = (id: number, w = 600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const SITES = [
  { id: "hw", name: "Demo Highway NH-46 Stretch", kind: "Roads", mgr: "Riya Sharma", km: "km 40 to 150" },
  { id: "sl", name: "Demo Solar Plant Sehore A", kind: "Solar", mgr: "Riya Sharma", km: "18 MW · 36 rows" },
  { id: "tb", name: "Demo Tower B Construction Site", kind: "Construction", mgr: "Neha Verma", km: "12 floors" },
];

export const CREW = ["Imran Khan (Crew Lead)", "Sunita Yadav (Maintenance)", "Arjun Patel (Electrician)", "Neha Verma (Safety Officer)"];

export const CATCOL: Record<string, string> = {
  Pothole: "var(--coral)", Waterlogging: "var(--sky)", Crack: "var(--sand)", Signage: "var(--sun)", Barrier: "var(--sand)", Dust: "var(--sun)",
  Intrusion: "#B9B4C8", "Bird droppings": "var(--sun)", Vegetation: "var(--lime)", Equipment: "var(--sand)", Safety: "var(--coral)", Progress: "var(--teal)", Housekeeping: "var(--sand)", Material: "var(--sand)",
};

// Pexels photo ids, by alert type.
const PHOTO_BY_CAT: Record<string, number> = {
  Pothole: 5688465, Waterlogging: 31172239, Crack: 17706118, Signage: 23857944, Barrier: 9963247, Dust: 15751124, "Bird droppings": 9893727,
  Vegetation: 6572421, Safety: 10202856, Progress: 8961526, Housekeeping: 8961064,
};

type Row = [number, string, string, Sev, string, string, string, number];
const ROWS: Row[] = [
  [1, "hw", "Pothole", "High", "Pothole about 0.4 m² at km 134.2 LHS", "Today 07:58", "Dashcam", 94],
  [2, "hw", "Waterlogging", "Medium", "Standing water near culvert, km 52.6", "Today 06:20", "Dashcam", 89],
  [3, "hw", "Crack", "Medium", "Alligator cracking, km 126.0 to 126.3", "Yesterday 16:40", "Survey vehicle", 91],
  [4, "hw", "Pothole", "Low", "Small pothole, km 128.4 RHS", "Yesterday 11:05", "Crew phone", 82],
  [5, "hw", "Signage", "Low", "Faded speed limit sign, km 141", "Mon 10:15", "Dashcam", 77],
  [6, "hw", "Barrier", "Medium", "Bent crash barrier, km 138.7", "Sun 17:30", "Drone", 85],
  [7, "sl", "Dust", "High", "Rows B12 to B18 soiled, est. 6% yield loss", "Today 08:42", "Fixed camera", 93],
  [8, "sl", "Intrusion", "High", "Two people inside fence, gate B", "Today 02:14", "Night camera", 88],
  [9, "sl", "Dust", "Medium", "Inverter block 3 panels dusty", "Yesterday 09:00", "Fixed camera", 86],
  [10, "sl", "Vegetation", "Low", "Grass shading row C4", "Mon 12:00", "Drone", 90],
  [11, "sl", "Bird droppings", "Low", "Droppings on rows A2 to A5", "Sun 08:10", "Fixed camera", 80],
  [12, "sl", "Equipment", "Medium", "String box 14 door open", "Sat 15:20", "Crew phone", 84],
  [13, "tb", "Safety", "High", "Two workers without helmets, level 3", "Today 09:10", "Crew phone", 92],
  [14, "tb", "Progress", "Medium", "Slab pour 80% done vs 100% planned, level 4", "Today 07:30", "Drone", 87],
  [15, "tb", "Housekeeping", "Low", "Debris blocking stairwell B", "Yesterday 08:30", "Crew phone", 90],
  [16, "tb", "Safety", "Medium", "Scaffold missing guard rail, east face", "Yesterday 14:10", "Crew phone", 83],
  [17, "tb", "Material", "Low", "Cement stock below reorder level, store 2", "Mon 11:00", "Crew phone", 95],
  [18, "tb", "Safety", "High", "Excavation edge without barricade", "Sun 09:40", "Drone", 86],
];

export const makeAlerts = (): DemoAlert[] =>
  ROWS.map((r) => ({ id: r[0], site: r[1], cat: r[2], sev: r[3], title: r[4], when: r[5], src: r[6], conf: r[7], photo: PHOTO_BY_CAT[r[2]], state: [4, 9, 16].includes(r[0]) ? "tasked" : "open" }));

export const makeTasks = (): DemoTask[] => [
  { id: "WO-098", alert: 4, title: "Patch small pothole at km 128.4", who: CREW[0], pri: "Normal", due: "Yesterday", status: "Done", proof: true },
  { id: "WO-099", alert: 9, title: "Clean panels at inverter block 3", who: CREW[1], pri: "Normal", due: "Today", status: "In progress", proof: false },
  { id: "WO-100", alert: 16, title: "Fit guard rail on east scaffold", who: CREW[3], pri: "High", due: "Yesterday", status: "Done", proof: true },
];

// Older footage and photos that only show up in the archive search: [site, title, source, date, keywords]
export const EXTRA: [string, string, string, string, string][] = [
  ["hw", "Waterlogging at culvert after rain, km 52.6", "Dashcam", "12 Aug", "waterlogging water rain flood culvert drain"],
  ["hw", "Standing water on carriageway, km 134", "Crew phone", "14 Aug", "waterlogging water rain flood"],
  ["hw", "Drain blocked with silt, km 58", "Drone", "3 Sep", "drain blocked silt culvert water"],
  ["hw", "Pothole patched, km 128", "Crew phone", "7 Oct", "pothole patched repair after"],
  ["sl", "Panel cleaning completed, rows B1 to B6", "Crew phone", "Yesterday", "cleaning cleaned panel panels dust after पैनल सफाई"],
  ["sl", "Cable cut near string box 14", "Fixed camera", "2 Oct", "theft cable cut intruder night"],
  ["sl", "Inverter 2 nameplate photo", "Crew phone", "5 Oct", "inverter nameplate equipment"],
  ["tb", "Rebar check before slab pour, level 4", "Crew phone", "Today", "rebar slab pour concrete inspection"],
  ["tb", "Site entry gate and visitor log", "Fixed camera", "Mon", "gate entry visitor security"],
  ["tb", "Workers wearing helmets, level 2", "Crew phone", "Tue", "helmet ppe safety workers vest"],
];

export const SYNONYMS: Record<string, string> = { "पैनल": "panel", "सफाई": "cleaning", "धूल": "dust", "पानी": "water", "गड्ढा": "pothole", "हेलमेट": "helmet" };
export const STOP_WORDS = "a an the on at of in for to after before this last week today show me with without any".split(" ");
export const ARCHIVE_SOURCES = ["Dashcam", "Survey vehicle", "Crew phone", "Drone", "Fixed camera", "Night camera"];
export const SUGGESTED_SEARCHES = ["waterlogging after rain", "pothole", "dust on panels", "workers without helmets", "intruder at night", "पैनल सफाई"];
export const CHECKLIST: [string, string][] = [
  ["alert", "Open an alert and read its details"], ["task", "Make a task from an alert"], ["start", "Open Tasks and start the job as the crew lead"],
  ["finish", "Take the proof photo to finish it"], ["search", "Search the archive"], ["report", "Send the daily report"], ["setup", "Change a setting in Setup"],
];
export const INITIAL_SETUP = {
  src: { "Upload files": 1, "Crew phone app": 1, "WhatsApp photos": 1, "Drone folder": 0, "IP camera": 0, "Dashcam files": 1 } as Record<string, number>,
  det: { Dust: 1, Potholes: 1, Cracks: 1, Waterlogging: 1, Intrusion: 1, "Helmets and vests": 1, Vegetation: 0, "Progress photos": 1 } as Record<string, number>,
  net: "Patchy",
  alerts: { "In the app": 1, WhatsApp: 1, Email: 0 } as Record<string, number>,
};
