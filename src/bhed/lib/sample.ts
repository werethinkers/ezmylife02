import type { BhedNode, Chart } from "./types";
import { makeNode } from "./tree";

function cell(title: string, body: string, children: BhedNode[] = []): BhedNode {
  return makeNode({ title, body, children, collapsed: true });
}

export function makeSampleChart(): Chart {
  const now = Date.now();
  const root = makeNode({
    title: "Ashtanga",
    collapsed: false,
    body: "Patanjali's yoga is one subject opened into eight भेद. Open a limb, or go deeper, and its प्रभेद sit in their own table. Add a photo, a diagram, or a clip to any cell — it stays visible when that cell is closed.",
    children: [
      cell("Yama", "Restraints in how you meet other people. Five प्रभेद live under this one भेद — and some of those open further.", [
        cell("Ahimsa", "Non-harm. Open it: the प्रभेद keep going, and each one can split again.", [
          cell("In thought", "Not wishing harm, even privately."),
          cell("In speech", "Words that don't cut. This one opens again.", [
            cell("Harsh speech", "The sharp reply you don't send."),
            cell("Silence", "Stopping before the second sentence.", [
              cell("Pause", "A breath before you answer. This can split too — there is no last प्रभेद."),
            ]),
          ]),
          cell("In action", "Hands that leave people whole."),
        ]),
        cell("Satya", "Truthfulness. Speech and thought that match what is real."),
        cell("Asteya", "Non-stealing. Not taking what is not given — time and credit included."),
        cell("Brahmacharya", "Right use of energy. Attention kept from leaking into appetite."),
        cell("Aparigraha", "Non-grasping. Holding people and things without the need to own them."),
      ]),
      cell(
        "Niyama",
        "Observances toward your own life. Five प्रभेद, personal rather than social.",
        [
          cell("Shaucha", "Cleanliness of body, surroundings, and motive."),
          cell("Santosha", "Contentment. Enough, as things stand."),
          cell("Tapas", "Discipline. The heat that keeps a practice alive."),
          cell("Svadhyaya", "Self-study. Reading a text, and reading yourself."),
          cell("Ishvara pranidhana", "Dedication. Setting the work before something larger."),
        ],
      ),
      cell("Asana", "A steady, comfortable seat. The posture is the still place the rest of the practice stands on."),
      cell("Pranayama", "Regulation of breath. Lengthening the inhale, the exhale, and the pause between them."),
      cell("Pratyahara", "Drawing the senses back. The world stays where it is; attention comes home."),
      cell("Dharana", "Concentration. Holding the mind on one point without forcing it shut."),
      cell("Dhyana", "Meditation. The point remains, and the effort to hold it falls away."),
      cell("Samadhi", "Absorption. Knower, knowing, and known are no longer three."),
    ],
  });
  return {
    id: crypto.randomUUID(),
    title: root.title,
    root,
    createdAt: now,
    updatedAt: now,
  };
}

const STOCK_AHIMSA = "Non-harm. The resolve not to injure, in act, speech, or wish.";

/** Grafts the deeper Ahimsa example onto an untouched copy of the original sample. */
export function withDeeperAhimsa(chart: Chart): Chart | null {
  const yama = chart.root.children.find((node) => node.title === "Yama");
  const ahimsa = yama?.children.find((node) => node.title === "Ahimsa");
  if (!yama || !ahimsa || ahimsa.children.length > 0 || ahimsa.body.trim() !== STOCK_AHIMSA) return null;
  const freshYama = makeSampleChart().root.children.find((node) => node.title === "Yama");
  const freshAhimsa = freshYama?.children.find((node) => node.title === "Ahimsa");
  if (!freshAhimsa) return null;
  const grafted = { ...freshAhimsa, id: ahimsa.id };
  return {
    ...chart,
    updatedAt: Date.now(),
    root: {
      ...chart.root,
      children: chart.root.children.map((child) =>
        child.id === yama.id
          ? { ...yama, children: yama.children.map((item) => (item.id === ahimsa.id ? grafted : item)) }
          : child,
      ),
    },
  };
}
