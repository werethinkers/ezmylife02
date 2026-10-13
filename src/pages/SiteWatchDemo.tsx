import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import SEOFooter from "@/components/SEOFooter";
import { PageSeo } from "@/components/seo/PageSeo";
import { SitesCta } from "@/components/sites/SitesCta";
import { seoFor } from "@/lib/seo/pages";
import {
  ARCHIVE_SOURCES, CATCOL, CHECKLIST, CREW, EXTRA, INITIAL_SETUP, SITES, STOP_WORDS, SUGGESTED_SEARCHES, SYNONYMS,
  makeAlerts, makeTasks, pexelsUrl, type AlertState, type DemoAlert, type DemoTask,
} from "@/data/siteWatch";
import "./sitewatch/sitewatch.css";

const siteOf = (id: string) => SITES.find((s) => s.id === id)!;

/** A sample photo, or a plain labelled tile when there is no photo (or it does not load). */
function Photo({ photo, cat, label = "sample photo", w = 600 }: { photo?: number; cat: string; label?: string; w?: number }) {
  const [bad, setBad] = useState(false);
  if (photo && !bad) return <img src={pexelsUrl(photo, w)} alt={`Sample photo: ${cat}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} />;
  return <span>{cat}<br /><span className="m" style={{ fontWeight: 600 }}>{label}</span></span>;
}

const SevChip = ({ s }: { s: string }) => <span className={`chip ${s === "High" ? "cr" : s === "Medium" ? "sun" : "gr"}`}>{s}</span>;
const STATE_LABEL: Record<string, string> = { open: "Open", tasked: "Task sent", dismissed: "Dismissed", false: "False alarm", Done: "Done", "In progress": "In progress", New: "New" };
function StChip({ s }: { s: string }) {
  const cls = s === "open" ? "pk" : s === "Done" ? "ok" : s === "dismissed" || s === "false" ? "gr" : "sun";
  return <span className={`chip ${cls}`}>{STATE_LABEL[s] ?? s}</span>;
}

type Tab = "alerts" | "tasks" | "archive" | "reports" | "setup";
const TABS: [Tab, string][] = [["alerts", "Alerts"], ["tasks", "Tasks"], ["archive", "Archive"], ["reports", "Reports"], ["setup", "Setup"]];

export default function SiteWatchDemo() {
  const [tab, setTab] = useState<Tab>("alerts");
  const [siteId, setSiteId] = useState("hw");
  const [alerts, setAlerts] = useState<DemoAlert[]>(makeAlerts);
  const [tasks, setTasks] = useState<DemoTask[]>(makeTasks);
  const [sel, setSel] = useState<number | null>(null);
  const [ftype, setFtype] = useState("all");
  const [fsev, setFsev] = useState("all");
  const [fstat, setFstat] = useState("all");
  const [sort, setSort] = useState("new");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [q, setQ] = useState("waterlogging after rain");
  const [qInput, setQInput] = useState("waterlogging after rain");
  const [asrc, setAsrc] = useState("all");
  const [did, setDid] = useState<Record<string, boolean>>({});
  const [setup, setSetup] = useState(INITIAL_SETUP);
  const [toast, setToast] = useState("");
  const [reportMsg, setReportMsg] = useState<ReactNode>(null);
  const [form, setForm] = useState({ who: CREW[0], pri: "Normal", due: "Today" });

  const site = siteOf(siteId);
  const mark = (k: string) => setDid((d) => (d[k] ? d : { ...d, [k]: true }));
  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2600); };
  const setState = (id: number, state: AlertState) => setAlerts((as) => as.map((a) => (a.id === id ? { ...a, state } : a)));
  const alertById = (id: number) => alerts.find((a) => a.id === id)!;

  return (
    <div className="min-h-screen bg-background">
      <PageSeo {...seoFor("/studios/site-watch", "")} jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "Site Watch demo", url: "https://ezyourlife.com/studios/site-watch" }} />
      <Navbar />
      <main className="sw mx-auto max-w-7xl px-4">
        <section className="sec" style={{ paddingBottom: 0, paddingTop: 24 }}>
          <div className="bar">
            <div>
              <span className="badge"><Link to="/studios" style={{ textDecoration: "none", color: "inherit" }}>Studios</Link> › <Link to="/studios#sites" style={{ textDecoration: "none", color: "inherit" }}>Sites</Link> › Site Watch</span>
              <h1 style={{ marginTop: 10, fontSize: "clamp(24px,4vw,38px)" }}>Site Watch <mark>demo</mark></h1>
            </div>
            <Link className="btn" to="/studios#sites">Back to Studios</Link>
          </div>
        </section>

        <div className="app">
          <div className="main panel">
            <div className="bar">
              <label className="fld">Site
                <select aria-label="Site" value={siteId} onChange={(e) => { setSiteId(e.target.value); setSel(null); setTaskId(null); setFtype("all"); }}>
                  {SITES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <div className="m"><b>{site.kind}</b> · Manager: {site.mgr} · {site.km}</div>
            </div>
            <div className="tabs" role="tablist">
              {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
            </div>
            <div>
              {tab === "alerts" && Alerts()}
              {tab === "tasks" && Tasks()}
              {tab === "archive" && Archive()}
              {tab === "reports" && Reports()}
              {tab === "setup" && Setup()}
            </div>
          </div>

          <aside className="side">
            <div className="panel">
              <div className="bar"><h3>Try these 7 things</h3><span className="chip pk">Demo data</span></div>
              <ul className="todo">
                {CHECKLIST.map(([k, t], i) => (
                  <li key={k} className={did[k] ? "done" : ""}><span className="n">{did[k] ? "✓" : i + 1}</span>{t}</li>
                ))}
              </ul>
              <p className="m" style={{ margin: 0 }}>Everything here is sample data. You cannot upload or save anything in this demo.</p>
              <p className="m" style={{ margin: 0 }}>Sample photos from <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a>, free to use.</p>
            </div>
          </aside>
        </div>

        <SitesCta />
      </main>
      {toast && <div className="sw"><div className="toast" role="status">{toast}</div></div>}
      <SEOFooter />
    </div>
  );

  /* ---------------- tabs ---------------- */
  function Alerts() {
    const rank: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    const types = [...new Set(alerts.filter((a) => a.site === siteId).map((a) => a.cat))];
    const list = alerts
      .filter((a) => a.site === siteId && (ftype === "all" || a.cat === ftype) && (fsev === "all" || a.sev === fsev) && (fstat === "all" || a.state === fstat))
      .sort((a, b) => (sort === "sev" ? rank[a.sev] - rank[b.sev] : sort === "conf" ? b.conf - a.conf : a.id - b.id));
    const a = sel ? alerts.find((x) => x.id === sel && x.site === siteId) : undefined;
    return (
      <>
        <div className="filters">
          <label>Type<select value={ftype} onChange={(e) => setFtype(e.target.value)}><option value="all">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>Severity<select value={fsev} onChange={(e) => setFsev(e.target.value)}><option value="all">All</option><option>High</option><option>Medium</option><option>Low</option></select></label>
          <label>Status<select value={fstat} onChange={(e) => setFstat(e.target.value)}><option value="all">All</option><option value="open">Open</option><option value="tasked">Task sent</option><option value="dismissed">Dismissed</option><option value="false">False alarm</option></select></label>
          <label>Sort by<select value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Newest first</option><option value="sev">Severity</option><option value="conf">AI confidence</option></select></label>
        </div>
        <div className="list" style={{ marginTop: 12 }}>
          {list.length ? list.map((x) => (
            <button key={x.id} className={`row${sel === x.id ? " sel" : ""}`} type="button" onClick={() => { setSel(x.id); mark("alert"); }}>
              <div className="thumb" style={{ background: CATCOL[x.cat] }}><Photo photo={x.photo} cat={x.cat} w={240} /></div>
              <div className="tx">
                <b>{x.title}</b>
                <span className="m">{x.when} · {x.src} · {x.conf}% sure</span>
                <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><span className="chip">{x.cat}</span><SevChip s={x.sev} /><StChip s={x.state} /></span>
              </div>
            </button>
          )) : <div className="empty">No alerts match these filters.</div>}
        </div>
        {a && AlertDetail(a)}
      </>
    );
  }

  function AlertDetail(a: DemoAlert) {
    const tk = tasks.find((t) => t.alert === a.id);
    const makeTask = () => {
      const id = `WO-${100 + tasks.length - 2}`;
      const verb: Record<string, string> = { Pothole: "Patch pothole", Waterlogging: "Clear drain", Crack: "Seal cracks", Dust: "Clean panels", Intrusion: "Inspect fence and gate", Safety: "Safety briefing and fix" };
      const t: DemoTask = { id, alert: a.id, title: `${verb[a.cat] ?? `Fix: ${a.cat}`} · ${a.title.split(",")[0]}`, who: form.who, pri: form.pri, due: form.due, status: "New", proof: false };
      setTasks((ts) => [...ts, t]); setState(a.id, "tasked"); setTaskId(id); mark("task"); say(`${id} sent to ${form.who.split(" (")[0]}`);
    };
    return (
      <div className="detail" style={{ marginTop: 14 }}>
        <div><div className="big" style={{ background: CATCOL[a.cat] }}><Photo photo={a.photo} cat={a.cat} /></div></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 style={{ fontSize: 16 }}>{a.title}</h3>
          <dl className="kv"><dt>Site</dt><dd>{siteOf(a.site).name}</dd><dt>Type</dt><dd>{a.cat}</dd><dt>Severity</dt><dd>{a.sev}</dd><dt>Seen</dt><dd>{a.when}</dd><dt>Source</dt><dd>{a.src}</dd><dt>AI confidence</dt><dd>{a.conf}%</dd></dl>
          {a.state === "open" ? (
            <>
              <div className="two" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <label className="fld">Assign to<select value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })}>{CREW.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label className="fld">Priority<select value={form.pri} onChange={(e) => setForm({ ...form, pri: e.target.value })}><option>Normal</option><option>High</option><option>Low</option></select></label>
              </div>
              <label className="fld">Due<select value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })}><option>Today</option><option>Tomorrow</option><option>In 3 days</option></select></label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn pink" type="button" onClick={makeTask}>Make task</button>
                <button className="btn" type="button" onClick={() => setState(a.id, "dismissed")}>Dismiss</button>
                <button className="btn" type="button" onClick={() => { setState(a.id, "false"); say("Marked as false alarm. Site Watch learns from this."); }}>False alarm</button>
              </div>
            </>
          ) : (
            <>
              <div><StChip s={a.state} />{tk && <span className="m"> {tk.id} · {tk.who} · {tk.status}</span>}</div>
              {a.state !== "tasked" && <button className="btn sm" type="button" onClick={() => setState(a.id, "open")}>Reopen</button>}
            </>
          )}
        </div>
      </div>
    );
  }

  function Tasks() {
    const list = tasks.filter((t) => alertById(t.alert).site === siteId);
    const t = list.find((x) => x.id === taskId);
    const update = (patch: Partial<DemoTask>) => setTasks((ts) => ts.map((x) => (x.id === taskId ? { ...x, ...patch } : x)));
    return (
      <div className="two">
        <div>
          <h3>Work orders</h3>
          <div className="scroll" style={{ marginTop: 8 }}>
            <table>
              <thead><tr><th>ID</th><th>Task</th><th>Assigned</th><th>Status</th></tr></thead>
              <tbody>
                {list.length ? list.map((x) => (
                  <tr key={x.id} onClick={() => setTaskId(x.id)} style={{ cursor: "pointer", background: taskId === x.id ? "#FFF1B8" : undefined }}>
                    <td>{x.id}</td><td>{x.title}<div className="m">Due {x.due} · {x.pri}</div></td><td>{x.who}</td>
                    <td><StChip s={x.status} />{x.proof && <> <span className="chip tl">Proof</span></>}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="empty">No work orders yet for this site. Make one from an alert.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="m">Select a work order to see it on the crew phone.</p>
        </div>
        <div>
          {t ? Phone(t, () => { update({ status: "In progress" }); mark("start"); }, () => { update({ status: "Done", proof: true }); mark("finish"); say("Marked done. Proof photo saved."); }) : <div className="empty">Select a work order to open the crew phone.</div>}
        </div>
      </div>
    );
  }

  function Phone(t: DemoTask, onStart: () => void, onFinish: () => void) {
    const a = alertById(t.alert);
    return (
      <div className="phone">
        <div className="top"><div className="m" style={{ color: "#ddd" }}>{t.who}</div><div className="t">Today's jobs</div></div>
        <div className="bd">
          <div className="job">
            <StChip s={t.status} />
            <b>{t.title}</b>
            <div className="thumb" style={{ width: "100%", height: 110, background: CATCOL[a.cat] }}><Photo photo={a.photo} cat={a.cat} /></div>
            <span className="m">Due {t.due} · {t.pri} priority</span>
            {t.status === "New" && <button className="btn ink" type="button" onClick={onStart}>Start job</button>}
            {t.status === "In progress" && <><button className="btn pink" type="button" onClick={onFinish}>Take photo and finish</button><span className="m">Works offline. GPS and time are added.</span></>}
            {t.status === "Done" && <span className="m">Proof saved with GPS 23.2599, 77.4126 and time 10:42.</span>}
            {t.proof && <div className="thumb" style={{ width: "100%", height: 80, background: "var(--lime)" }}><span>After photo<br /><span className="m" style={{ fontWeight: 600 }}>sample photo</span></span></div>}
          </div>
        </div>
      </div>
    );
  }

  function Archive() {
    const words = q.toLowerCase().split(/[^a-z0-9ऀ-ॿ]+/).filter(Boolean).map((w) => SYNONYMS[w] ?? w).filter((w) => !STOP_WORDS.includes(w));
    const pool = [
      ...alerts.map((a) => ({ site: a.site, t: a.title, src: a.src, d: a.when, k: `${a.cat} ${a.title}`.toLowerCase(), cat: a.cat, photo: a.photo })),
      ...EXTRA.map((e) => ({ site: e[0], t: e[1], src: e[2], d: e[3], k: `${e[1]} ${e[4]}`.toLowerCase(), cat: "Pothole", photo: undefined as number | undefined })),
    ];
    const out = pool
      .filter((p) => asrc === "all" || p.src === asrc)
      .map((p) => ({ p, s: words.length ? words.filter((w) => p.k.includes(w)).length / words.length : 0 }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    const run = (text: string) => { setQ(text); setQInput(text); mark("search"); };
    const onSubmit = (e: FormEvent) => { e.preventDefault(); setQ(qInput); mark("search"); };
    return (
      <>
        <form className="filters" onSubmit={onSubmit}>
          <label className="fld" style={{ flex: "1 1 260px" }}>Search all sites<input type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} /></label>
          <label className="fld">Source<select value={asrc} onChange={(e) => setAsrc(e.target.value)}><option value="all">All sources</option>{ARCHIVE_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <button className="btn ink" type="submit">Search</button>
        </form>
        <div className="filters" style={{ marginTop: 10 }}>
          <span className="m">Try:</span>
          {SUGGESTED_SEARCHES.map((x) => <button key={x} className="btn sm" type="button" onClick={() => run(x)}>{x}</button>)}
        </div>
        <div className="m" style={{ margin: "10px 0" }}>{out.length} matches · search is free in the real app too</div>
        <div className="res">
          {out.length ? out.map((x, i) => (
            <div className="rc" key={i}>
              <div className="im" style={{ background: CATCOL[x.p.cat] || "var(--sky)" }}>{x.p.photo ? <Photo photo={x.p.photo} cat={x.p.cat} w={360} /> : "photo or clip"}</div>
              <div className="tx"><b>{x.p.t}</b>{siteOf(x.p.site).name.replace("Demo ", "")} · {x.p.src} · {x.p.d} · {Math.round(60 + x.s * 38)}% match</div>
            </div>
          )) : <div className="empty" style={{ gridColumn: "1/-1" }}>No matches. Try one of the suggestions above.</div>}
        </div>
      </>
    );
  }

  function Reports() {
    const as = alerts.filter((a) => a.site === siteId);
    const wos = tasks.filter((t) => alertById(t.alert).site === siteId);
    const open = as.filter((a) => a.state === "open").length;
    const tk = as.filter((a) => a.state === "tasked").length;
    const done = wos.filter((t) => t.status === "Done").length;
    const high = as.filter((a) => a.sev === "High").length;
    return (
      <>
        <div className="detail">
          <div>
            <h3>Daily report</h3>
            <p className="m" style={{ margin: "4px 0 0" }}>{site.name} · 13 Oct 2026</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              <span className="chip cr">{as.length} alerts</span><span className="chip cr">{high} high</span><span className="chip pk">{open} open</span><span className="chip sun">{tk} with tasks</span><span className="chip ok">{done} tasks done</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="m">Prepared for {site.mgr}. Copy to Neha Verma (Safety Officer).</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn wa" type="button" onClick={() => { mark("report"); setReportMsg(<><span className="chip ok">Demo: sent to WhatsApp</span> <span className="m">{site.mgr} would receive it at 18:00.</span></>); }}>Send to WhatsApp</button>
              <button className="btn" type="button" onClick={() => { mark("report"); setReportMsg(<span className="chip ok">Demo: sent by email</span>); }}>Send by email</button>
              <button className="btn" type="button" onClick={() => say("Demo only. The real app downloads a PDF.")}>Download PDF</button>
            </div>
            <div>{reportMsg}</div>
          </div>
        </div>
        <div className="scroll" style={{ marginTop: 12 }}>
          <table><thead><tr><th>Alert</th><th>Severity</th><th>Status</th></tr></thead>
            <tbody>{as.map((a) => <tr key={a.id}><td>{a.title}</td><td><SevChip s={a.sev} /></td><td><StChip s={a.state} /></td></tr>)}</tbody></table>
        </div>
      </>
    );
  }

  function Setup() {
    const toggle = (g: "src" | "det" | "alerts", i: string, on: boolean) => { setSetup((s) => ({ ...s, [g]: { ...s[g], [i]: on ? 1 : 0 } })); mark("setup"); };
    const group = (g: "src" | "det" | "alerts") => Object.keys(setup[g]).map((i) => (
      <label className="tog" key={i}><input type="checkbox" checked={!!setup[g][i]} onChange={(e) => toggle(g, i, e.target.checked)} />{i}</label>
    ));
    const shadow = { boxShadow: "var(--sh-sm)" };
    return (
      <>
        <div className="setup">
          <div className="panel" style={shadow}><h3>Where does footage come from?</h3>{group("src")}</div>
          <div className="panel" style={shadow}><h3>What should we look for?</h3>{group("det")}</div>
          <div className="panel" style={shadow}>
            <h3>Connection at this site</h3>
            {["Always online", "Patchy", "Mostly offline"].map((n) => (
              <label className="tog" key={n}><input type="radio" name="net" checked={setup.net === n} onChange={() => { setSetup((s) => ({ ...s, net: n })); mark("setup"); }} />{n}</label>
            ))}
            <h3 style={{ marginTop: 6 }}>Who gets alerts?</h3>{group("alerts")}
          </div>
        </div>
        <p className="m">Changes in this demo are not saved. In the real app, these settings decide what Site Watch looks for and how it reaches your crew.</p>
      </>
    );
  }
}

