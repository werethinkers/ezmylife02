// Brings many branches into `staging` in one go, so they can reach `main` together in one PR.
// See docs/branching.md for the whole flow.
//
//   node scripts/merge-train.mjs                     # main + every open PR into staging (needs gh)
//   node scripts/merge-train.mjs branch-a branch-b   # main + just these branches
//   add --push to push staging when everything passes, --no-checks to skip build, check:apps and check:seo
//
// Steps: start from origin/staging (or origin/main if staging does not exist yet), merge
// origin/main in, then merge each branch. A branch that conflicts is skipped and reported; the
// others still go in. Then the build, `npm run check:apps` and `npm run check:seo` run. If they fail, each branch is
// tried on its own to find the one that breaks them, and that branch is left out.
import { execSync, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const push = args.includes("--push");
const checks = !args.includes("--no-checks");
let branches = args.filter((a) => !a.startsWith("--"));

const git = (cmd, opts = {}) => execSync(`git ${cmd}`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
const tryGit = (cmd) => spawnSync("git", cmd, { encoding: "utf8" });
const log = (s) => console.log(s);

if (git("status --porcelain")) {
  console.error("The working tree has uncommitted changes. Commit or stash them first.");
  process.exit(1);
}

git("config rerere.enabled true");
git("fetch --quiet origin");
const hasStaging = tryGit(["rev-parse", "--verify", "--quiet", "origin/staging"]).status === 0;
git(`checkout -q -B staging ${hasStaging ? "origin/staging" : "origin/main"}`);

if (!branches.length) {
  const out = execSync("gh pr list --base staging --state open --json headRefName,isDraft --jq '.[] | select(.isDraft | not) | .headRefName'", { encoding: "utf8" });
  branches = out.split("\n").map((s) => s.trim()).filter(Boolean);
  log(`Open, ready PRs into staging: ${branches.join(", ") || "(none)"}`);
}

const start = git("rev-parse HEAD");
const merged = [];
const conflicted = [];

function mergeOne(ref, label) {
  // main fast-forwards staging when staging has nothing of its own (right after a release).
  const ff = label === "main" ? "--ff" : "--no-ff";
  const r = tryGit(["merge", ff, "--no-edit", "-m", `Merge ${label} into staging`, ref]);
  if (r.status === 0) return true;
  // rerere may have resolved everything from an earlier run; accept that.
  const left = git("diff --name-only --diff-filter=U");
  if (!left && git("status --porcelain") !== "") {
    git("add -A");
    git(`commit -q --no-edit`);
    return true;
  }
  const files = left.split("\n").filter(Boolean);
  tryGit(["merge", "--abort"]);
  conflicted.push({ branch: label, files });
  return false;
}

if (!mergeOne("origin/main", "main")) {
  console.error("main does not merge cleanly into staging. Fix that first (merge main into staging by hand).");
  console.error(conflicted[0].files.map((f) => `  ${f}`).join("\n"));
  process.exit(1);
}
conflicted.length = 0;

for (const b of branches) {
  if (tryGit(["rev-parse", "--verify", "--quiet", `origin/${b}`]).status !== 0) {
    conflicted.push({ branch: b, files: ["(branch not found on origin)"] });
    continue;
  }
  if (mergeOne(`origin/${b}`, b)) merged.push(b);
}

function runChecks() {
  for (const cmd of ["npm run build", "npm run check:apps", "npm run check:seo"]) {
    const r = spawnSync(cmd, { shell: true, encoding: "utf8" });
    if (r.status !== 0) return `${cmd} failed:\n${(r.stdout + r.stderr).split("\n").slice(-25).join("\n")}`;
  }
  return null;
}

const broken = [];
if (checks && merged.length) {
  let failure = runChecks();
  if (failure) {
    log(`Checks failed with everything merged. Finding the branch that breaks them.\n${failure}`);
    // Rebuild one branch at a time; keep each branch whose addition still passes.
    git(`reset -q --hard ${start}`);
    mergeOne("origin/main", "main");
    const keep = [];
    for (const b of merged) {
      const before = git("rev-parse HEAD");
      mergeOne(`origin/${b}`, b);
      const f = runChecks();
      if (f) {
        broken.push({ branch: b, why: f });
        git(`reset -q --hard ${before}`);
      } else keep.push(b);
    }
    merged.length = 0;
    merged.push(...keep);
  }
}

log("\n=== Merge train result ===");
log(`Merged into staging: ${merged.join(", ") || "(none)"}`);
for (const c of conflicted) log(`Skipped, conflicts with staging: ${c.branch}\n${c.files.map((f) => `    ${f}`).join("\n")}`);
for (const b of broken) log(`Skipped, breaks the build or check:apps: ${b.branch}\n${b.why}`);

if (push) {
  execSync("git push origin staging", { stdio: "inherit" });
  log("Pushed staging.");
  ensureReleasePr();
} else {
  log("Not pushed (add --push to push staging).");
}
if (conflicted.length || broken.length) process.exitCode = 2;

// Keeps one open release PR from staging into main whenever staging has something main lacks.
// Best effort: GitHub Actions may not be allowed to open PRs in this repo's settings.
function ensureReleasePr() {
  if (git("rev-list --count origin/main..staging") === "0") return;
  const open = spawnSync("gh", ["pr", "list", "--base", "main", "--head", "staging", "--state", "open", "--json", "number", "--jq", "length"], { encoding: "utf8" });
  if (open.status !== 0 || open.stdout.trim() !== "0") return;
  const r = spawnSync("gh", ["pr", "create", "--draft", "--base", "main", "--head", "staging",
    "--title", "Release: staging into main",
    "--body", "Everything merged into staging since the last release. Merge with a merge commit (not squash) only when Abhijay says go; Vercel deploys main. See docs/branching.md."], { encoding: "utf8" });
  log(r.status === 0 ? `Opened release PR: ${r.stdout.trim()}` : `Could not open the release PR: ${r.stderr.trim()}`);
}
