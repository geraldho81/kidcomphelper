"use client";

import { useState, useCallback } from "react";
import {
  LightbulbFilament,
  NotePencil,
  Star,
  Shuffle,
  Copy,
  Check,
  Warning,
  ChatCircleDots,
  ArrowLeft,
  Sparkle,
  CheckCircle,
} from "@phosphor-icons/react";

// ── Data ─────────────────────────────────────────────────────────────────────

const THEMES = [
  // Values & character
  "Trying Something New",
  "A Change for the Better",
  "Being Thankful / Grateful",
  "A Difficult Decision",
  "An Act of Kindness",
  "Overcoming Fear / A Brave Act",
  "A Mistake I Made",
  "A Challenge I Overcame",
  "Teamwork / Helping a Friend",
  "A Lesson Learned",
  "Standing Up for What Is Right",
  "Being Honest",
  "Second Chances",
  "Keeping a Promise",
  "Doing the Right Thing When Nobody Is Watching",
  // Relationships & people
  "Friendship / An Unexpected Friend",
  "Helping a Stranger",
  "A Misunderstanding with a Friend",
  "Making Up After a Fight",
  "A New Student / Being the New Kid",
  "Someone Who Inspired Me",
  "My Relationship with a Grandparent",
  "A Sibling Moment",
  // Events & experiences
  "An Unexpected Incident / Surprise",
  "A Long Wait",
  "A Special Gift",
  "A Memorable Family Day / Festival",
  "An Unforgettable School / CCA Event",
  "Getting Lost",
  "A Day Everything Went Wrong",
  "An Accident or Injury",
  "My First Time Travelling Alone",
  "Performing in Front of an Audience",
  "Joining a New CCA",
  "A Competition or Race",
  "Helping at Home",
  "A Rainy Day Surprise",
  // School life
  "A Test or Exam I Was Worried About",
  "A Project That Almost Failed",
  "A Teacher Who Changed My Life",
  "When I Got into Trouble at School",
  "The Last Day of Primary School",
];

const EMOTIONS = [
  "Happiness", "Sadness", "Fear", "Excitement",
  "Anger", "Surprise", "Embarrassment", "Jealousy",
  "Tiredness", "Pride", "Regret", "Gratitude",
];

const SETTINGS = [
  "HDB Home", "Void Deck", "Neighbourhood / Playground", "Kopitiam",
  "Classroom", "School Canteen", "School Library", "School Hall / Parade Square", "CCA / Sports",
  "MRT / Train", "Bus", "Taxi / Grab",
  "Hawker Centre", "Community Centre", "Supermarket / NTUC", "Clinic / Hospital", "Place of Worship",
  "Park / Garden", "Beach / East Coast", "Zoo / Gardens by the Bay", "Sports Complex / Stadium",
  "Family Outing", "Festival Celebration (CNY / Hari Raya / Deepavali)", "Camp / Overseas Trip",
];

type Tab = "ideas" | "phrases" | "endings";
type Screen = "pick" | "form" | "output";

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: "ideas" as Tab,
    icon: <LightbulbFilament size={30} weight="duotone" />,
    color: "#E8522A",
    bg: "#FFF0EB",
    border: "#FFD0C0",
    title: "I need story ideas",
    desc: "Get 5 ideas to start your composition",
    formTitle: "Tell me about your composition",
    generateLabel: "Get my story ideas!",
  },
  {
    id: "phrases" as Tab,
    icon: <ChatCircleDots size={30} weight="duotone" />,
    color: "#1A8A79",
    bg: "#E8F7F5",
    border: "#A8DDD8",
    title: "I need phrases and dialogue",
    desc: "Get descriptive phrases and character conversations",
    formTitle: "Tell me about your character",
    generateLabel: "Get my phrases!",
  },
  {
    id: "endings" as Tab,
    icon: <Star size={30} weight="duotone" />,
    color: "#7B4FD4",
    bg: "#F0EBFF",
    border: "#C8B4F4",
    title: "I need a strong ending",
    desc: "Get reflective endings to finish your story well",
    formTitle: "Let me write an ending for you",
    generateLabel: "Get my ending!",
  },
];

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/\n/g, "<br/>");
}

// ── Question block ────────────────────────────────────────────────────────────

function Question({ number, label, hint, children }: {
  number: number; label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="step-badge mt-0.5">{number}</span>
        <div>
          <p className="text-xl font-700 leading-snug" style={{ color: "var(--ink)" }}>{label}</p>
          {hint && <p className="text-base mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>{hint}</p>}
        </div>
      </div>
      <div className="pl-[52px]">{children}</div>
    </div>
  );
}

// ── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, selected, type, onClick }: {
  label: string; selected: boolean; type: "emotion" | "setting"; onClick: () => void;
}) {
  const cls = selected ? `pill ${type}-selected` : "pill";
  return (
    <button onClick={onClick} className={cls}>
      {selected && <CheckCircle size={14} weight="fill" className="mr-1 opacity-80" />}
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [screen, setScreen] = useState<Screen>("pick");
  const [activeTab, setActiveTab] = useState<Tab>("ideas");

  const [ideasTheme, setIdeasTheme] = useState(THEMES[0]);
  const [ideasCustomTheme, setIdeasCustomTheme] = useState("");
  const [ideasSettings, setIdeasSettings] = useState<string[]>([]);
  const [ideasCustomSetting, setIdeasCustomSetting] = useState("");

  const [phrasesTheme, setPhrasesTheme] = useState(THEMES[0]);
  const [phrasesCustomTheme, setPhrasesCustomTheme] = useState("");
  const [phrasesEmotions, setPhrasesEmotions] = useState<string[]>([]);
  const [includeDialogue, setIncludeDialogue] = useState(true);

  const [endingsTheme, setEndingsTheme] = useState(THEMES[0]);
  const [endingsCustomTheme, setEndingsCustomTheme] = useState("");
  const [endingsEmotion, setEndingsEmotion] = useState(EMOTIONS[0]);
  const [brief, setBrief] = useState("");

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const toggle = useCallback((list: string[], item: string, setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }, []);

  async function generate(payload: object) {
    setLoading(true);
    setError("");
    setOutput("");
    setScreen("output");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let result = "";
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setOutput(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  function resolveTheme(theme: string, custom: string) {
    return theme === "Others" ? (custom.trim() || "a Singapore composition topic") : theme;
  }

  function handleGenerate() {
    if (activeTab === "ideas") {
      generate({
        type: "ideas",
        theme: resolveTheme(ideasTheme, ideasCustomTheme),
        settings: [...ideasSettings, ...(ideasCustomSetting.trim() ? [ideasCustomSetting.trim()] : [])],
      });
    } else if (activeTab === "phrases") {
      generate({
        type: "phrases",
        theme: resolveTheme(phrasesTheme, phrasesCustomTheme),
        emotions: phrasesEmotions.length ? phrasesEmotions : ["Excitement"],
        includeDialogue,
      });
    } else {
      generate({
        type: "endings",
        theme: resolveTheme(endingsTheme, endingsCustomTheme),
        emotions: [endingsEmotion],
        brief,
      });
    }
  }

  function handleSurprise() {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setActiveTab("ideas");
    setIdeasTheme(theme);
    generate({ type: "ideas", theme });
  }

  function pickTab(tab: Tab) {
    setActiveTab(tab);
    setOutput("");
    setError("");
    setScreen("form");
  }

  function goBack() {
    setScreen("pick");
    setOutput("");
    setError("");
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputCls = "w-full border-2 rounded-2xl px-5 py-4 text-lg font-500 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer";
  const inputStyle = { borderColor: "var(--border)", color: "var(--ink)" };

  return (
    <div className="min-h-[100dvh] flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b" style={{ background: "rgba(253,249,246,0.92)", backdropFilter: "blur(16px)", borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--coral-bg)" }}>
              <NotePencil size={18} weight="duotone" style={{ color: "var(--coral)" }} />
            </div>
            <span className="text-base font-800 tracking-tight" style={{ color: "var(--ink)" }}>KidComp Helper</span>
            <span className="hidden sm:inline text-xs font-700 px-2.5 py-1 rounded-full" style={{ background: "var(--coral-bg)", color: "var(--coral)" }}>
              P5 and P6
            </span>
          </div>
          <button
            onClick={handleSurprise}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm font-700 px-3.5 py-2 rounded-xl border-2 transition-all hover:bg-white disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <Shuffle size={14} weight="bold" />
            <span className="hidden sm:inline">Surprise me</span>
          </button>
        </div>
      </header>

      {/* ── SCREEN 1: Pick ── */}
      {screen === "pick" && (
        <div className="flex-1 flex items-center justify-center px-5 py-12 fade-in">
          <div className="w-full max-w-lg">

            {/* Hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-5 shadow-lg" style={{ background: "linear-gradient(135deg, #FFE8D8, #FFD0B8)" }}>
                <NotePencil size={52} weight="duotone" style={{ color: "var(--coral)" }} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-800 tracking-tight mb-3" style={{ color: "var(--ink)", lineHeight: 1.15 }}>
                KidComp Helper
              </h1>
              <p className="text-xl font-500" style={{ color: "var(--muted)" }}>
                What do you need help with today?
              </p>
            </div>

            {/* Choice cards */}
            <div className="space-y-4">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => pickTab(tab.id)} className="choice-card group">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: tab.bg, color: tab.color, border: `2px solid ${tab.border}` }}
                    >
                      {tab.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xl font-700 leading-tight" style={{ color: "var(--ink)" }}>{tab.title}</p>
                      <p className="text-base mt-0.5 font-500" style={{ color: "var(--muted)" }}>{tab.desc}</p>
                    </div>
                    <ArrowLeft size={20} weight="bold" className="rotate-180 flex-shrink-0 opacity-30 group-hover:opacity-70 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 2: Form ── */}
      {screen === "form" && (
        <div className="flex-1 flex items-start justify-center px-5 py-10 fade-in">
          <div className="w-full max-w-xl space-y-8">

            {/* Back */}
            <button onClick={goBack} className="flex items-center gap-2 text-base font-600 transition-all hover:opacity-60" style={{ color: "var(--muted)" }}>
              <ArrowLeft size={18} weight="bold" /> Choose something else
            </button>

            {/* Header */}
            <div className="card p-6" style={{ borderColor: currentTab.border, background: currentTab.bg }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "white", color: currentTab.color }}>
                  {currentTab.icon}
                </div>
                <div>
                  <p className="text-sm font-700 uppercase tracking-widest" style={{ color: currentTab.color }}>
                    {currentTab.title}
                  </p>
                  <p className="text-2xl font-800 tracking-tight" style={{ color: "var(--ink)" }}>
                    {currentTab.formTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* ── IDEAS ── */}
            {activeTab === "ideas" && (
              <>
                <Question
                  number={1}
                  label="What is your composition about?"
                  hint='Pick a topic from the list. Choose "Others: type your own topic" if yours is not here.'
                >
                  <select value={ideasTheme} onChange={(e) => setIdeasTheme(e.target.value)} className={inputCls} style={inputStyle}>
                    <option value="Others">Others: type your own topic</option>
                    {THEMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {ideasTheme === "Others" && (
                    <input autoFocus type="text" value={ideasCustomTheme} onChange={(e) => setIdeasCustomTheme(e.target.value)}
                      placeholder="e.g. My first day at secondary school, The day I lost my dog..."
                      className="mt-3 w-full border-2 rounded-2xl px-5 py-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                      style={inputStyle} />
                  )}
                </Question>

                <Question
                  number={2}
                  label="Where does your story happen?"
                  hint="This is optional. Tap the places that fit your story, or type your own at the bottom."
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SETTINGS.map((s) => (
                      <Pill key={s} label={s} selected={ideasSettings.includes(s)} type="setting" onClick={() => toggle(ideasSettings, s, setIdeasSettings)} />
                    ))}
                  </div>
                  <input type="text" value={ideasCustomSetting} onChange={(e) => setIdeasCustomSetting(e.target.value)}
                    placeholder="Not on the list? Type it here. e.g. Sentosa, a shopping mall, my grandmother's flat..."
                    className="w-full border-2 rounded-2xl px-5 py-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                    style={inputStyle} />
                </Question>
              </>
            )}

            {/* ── PHRASES ── */}
            {activeTab === "phrases" && (
              <>
                <Question
                  number={1}
                  label="What is your composition about?"
                  hint='Pick a topic from the list. Choose "Others: type your own topic" if yours is not here.'
                >
                  <select value={phrasesTheme} onChange={(e) => setPhrasesTheme(e.target.value)} className={inputCls} style={inputStyle}>
                    <option value="Others">Others: type your own topic</option>
                    {THEMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {phrasesTheme === "Others" && (
                    <input autoFocus type="text" value={phrasesCustomTheme} onChange={(e) => setPhrasesCustomTheme(e.target.value)}
                      placeholder="e.g. My first day at secondary school, The day I lost my dog..."
                      className="mt-3 w-full border-2 rounded-2xl px-5 py-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                      style={inputStyle} />
                  )}
                </Question>

                <Question number={2} label="How does your character feel?" hint="Pick 1 to 3 feelings.">
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((e) => (
                      <Pill key={e} label={e} selected={phrasesEmotions.includes(e)} type="emotion" onClick={() => toggle(phrasesEmotions, e, setPhrasesEmotions)} />
                    ))}
                  </div>
                </Question>

                <Question number={3} label="Do you want conversations between characters?">
                  <div className="flex gap-3">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        onClick={() => setIncludeDialogue(v)}
                        className="flex-1 py-4 rounded-2xl text-lg font-700 border-2 transition-all"
                        style={{
                          borderColor: includeDialogue === v ? "var(--teal)" : "var(--border)",
                          background: includeDialogue === v ? "var(--teal)" : "white",
                          color: includeDialogue === v ? "white" : "#4B5563",
                          boxShadow: includeDialogue === v ? "0 3px 12px rgba(26,138,121,0.3)" : "none",
                        }}
                      >
                        {v ? "Yes, add them" : "No thanks"}
                      </button>
                    ))}
                  </div>
                </Question>
              </>
            )}

            {/* ── ENDINGS ── */}
            {activeTab === "endings" && (
              <>
                <Question
                  number={1}
                  label="What is your composition about?"
                  hint='Pick a topic from the list. Choose "Others: type your own topic" if yours is not here.'
                >
                  <select value={endingsTheme} onChange={(e) => setEndingsTheme(e.target.value)} className={inputCls} style={inputStyle}>
                    <option value="Others">Others: type your own topic</option>
                    {THEMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {endingsTheme === "Others" && (
                    <input autoFocus type="text" value={endingsCustomTheme} onChange={(e) => setEndingsCustomTheme(e.target.value)}
                      placeholder="e.g. My first day at secondary school, The day I lost my dog..."
                      className="mt-3 w-full border-2 rounded-2xl px-5 py-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                      style={inputStyle} />
                  )}
                </Question>

                <Question number={2} label="What does your character learn or feel at the end?">
                  <select value={endingsEmotion} onChange={(e) => setEndingsEmotion(e.target.value)} className={inputCls} style={inputStyle}>
                    {EMOTIONS.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </Question>

                <Question
                  number={3}
                  label="What happened in your story?"
                  hint="This is optional. But if you write something, the ending will fit your story better."
                >
                  <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4}
                    placeholder="e.g. I tried rock climbing for the first time and nearly gave up halfway, but my friend cheered me on."
                    className="w-full border-2 rounded-2xl px-5 py-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none transition-all"
                    style={inputStyle} />
                </Question>
              </>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              className="btn-generate w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-xl font-800 text-white"
              style={{ background: `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}CC)` }}
            >
              <Sparkle size={26} weight="fill" />
              {currentTab.generateLabel}
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: Output ── */}
      {screen === "output" && (
        <div className="flex-1 flex items-start justify-center px-5 py-10 fade-in">
          <div className="w-full max-w-xl">

            {/* Back */}
            <button onClick={() => setScreen("form")} className="flex items-center gap-2 text-base font-600 mb-6 transition-all hover:opacity-60" style={{ color: "var(--muted)" }}>
              <ArrowLeft size={18} weight="bold" /> Back to questions
            </button>

            {/* Loading */}
            {loading && (
              <div className="card p-8 space-y-3">
                <p className="text-base font-700 mb-4" style={{ color: "var(--muted)" }}>Getting your ideas ready...</p>
                {[92, 78, 100, 65, 85, 55, 90, 70, 80, 60].map((w, i) => (
                  <div key={i} className="skeleton h-4" style={{ width: `${w}%`, animationDelay: `${i * 55}ms` }} />
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="card p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Warning size={28} className="text-red-400" weight="duotone" />
                </div>
                <p className="text-lg font-700 mb-2" style={{ color: "var(--ink)" }}>Something went wrong</p>
                <p className="text-base mb-5" style={{ color: "var(--muted)" }}>{error}</p>
                <button onClick={() => setScreen("form")} className="px-6 py-3 rounded-xl text-base font-700 text-white" style={{ background: "var(--coral)" }}>
                  Try again
                </button>
              </div>
            )}

            {/* Output */}
            {output && (
              <div className="slide-up space-y-4">
                {/* Toolbar */}
                <div className="flex items-center justify-between">
                  <p className="text-base font-700" style={{ color: "var(--muted)" }}>
                    Here are your {activeTab === "ideas" ? "story ideas" : activeTab === "phrases" ? "phrases" : "endings"}
                    {loading && <span className="ml-2 inline-block w-2 h-4 rounded-sm animate-pulse" style={{ background: "var(--coral)" }} />}
                  </p>
                  {!loading && (
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-700 border-2 transition-all hover:bg-white"
                      style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                      {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>

                {/* Content */}
                <div
                  className="card prose-output text-lg leading-9 p-7"
                  style={{ color: "#374151" }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }}
                />

                {/* Action buttons */}
                {!loading && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleGenerate}
                      className="flex-1 py-4 rounded-2xl text-base font-700 border-2 transition-all hover:bg-white"
                      style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                      Generate again
                    </button>
                    <button onClick={() => setScreen("form")}
                      className="flex-1 py-4 rounded-2xl text-base font-700 text-white"
                      style={{ background: `linear-gradient(135deg, ${currentTab.color}, ${currentTab.color}CC)` }}>
                      Change my answers
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
