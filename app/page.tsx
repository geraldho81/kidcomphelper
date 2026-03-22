"use client";

import { useState, useCallback } from "react";
import {
  LightbulbFilament,
  TextT,
  Star,
  Shuffle,
  Copy,
  Check,
  Warning,
  ChatCircleDots,
  ArrowLeft,
  Sparkle,
} from "@phosphor-icons/react";

// ── Data ────────────────────────────────────────────────────────────────────

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
  // Home & neighbourhood
  "HDB Home", "Void Deck", "Neighbourhood / Playground", "Kopitiam",
  // School
  "Classroom", "School Canteen", "School Library", "School Hall / Parade Square", "CCA / Sports",
  // Transport
  "MRT / Train", "Bus", "Taxi / Grab",
  // Community
  "Hawker Centre", "Community Centre", "Supermarket / NTUC", "Clinic / Hospital", "Place of Worship",
  // Outdoors
  "Park / Garden", "Beach / East Coast", "Zoo / Gardens by the Bay", "Sports Complex / Stadium",
  // Occasions
  "Family Outing", "Festival Celebration (CNY / Hari Raya / Deepavali)", "Camp / Overseas Trip",
];

type Tab = "ideas" | "phrases" | "endings";
type Screen = "pick" | "form" | "output";

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/\n/g, "<br/>");
}

// ── Pill ─────────────────────────────────────────────────────────────────────

function EmotionPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`emotion-pill ${selected ? "selected" : ""}`}>{label}</button>;
}
function SettingPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`setting-pill ${selected ? "selected" : ""}`}>{label}</button>;
}

// ── Question Block ───────────────────────────────────────────────────────────

function Question({ number, label, hint, children }: {
  number: number;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <span className="q-badge mt-1">{number}</span>
        <div>
          <p className="text-xl font-700 text-zinc-800 leading-snug">{label}</p>
          {hint && <p className="text-base mt-1 text-zinc-500">{hint}</p>}
        </div>
      </div>
      <div className="pl-[54px]">{children}</div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [screen, setScreen] = useState<Screen>("pick");
  const [activeTab, setActiveTab] = useState<Tab>("ideas");

  // Ideas
  const [ideasTheme, setIdeasTheme] = useState(THEMES[0]);
  const [ideasCustomTheme, setIdeasCustomTheme] = useState("");
  const [ideasSettings, setIdeasSettings] = useState<string[]>([]);
  const [ideasCustomSetting, setIdeasCustomSetting] = useState("");

  // Phrases
  const [phrasesTheme, setPhrasesTheme] = useState("Others");
  const [phrasesCustomTheme, setPhrasesCustomTheme] = useState("");
  const [phrasesEmotions, setPhrasesEmotions] = useState<string[]>([]);
  const [includeDialogue, setIncludeDialogue] = useState(true);

  // Endings
  const [endingsTheme, setEndingsTheme] = useState(THEMES[0]);
  const [endingsCustomTheme, setEndingsCustomTheme] = useState("");
  const [endingsEmotion, setEndingsEmotion] = useState(EMOTIONS[0]);
  const [brief, setBrief] = useState("");

  // Output
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
      // Stream the response — show text as it arrives
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let result = "";
      setLoading(false); // stop skeleton, start showing streamed text
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

  function handleGenerate() {
    if (activeTab === "ideas") {
      generate({
        type: "ideas",
        theme: ideasTheme === "Others" ? (ideasCustomTheme.trim() || "a Singapore composition topic") : ideasTheme,
        settings: [
          ...ideasSettings,
          ...(ideasCustomSetting.trim() ? [ideasCustomSetting.trim()] : []),
        ],
      });
    } else if (activeTab === "phrases") {
      generate({
        type: "phrases",
        theme: phrasesTheme === "Others"
          ? (phrasesCustomTheme.trim() || "a Singapore composition topic")
          : phrasesTheme,
        emotions: phrasesEmotions.length ? phrasesEmotions : ["Excitement"],
        includeDialogue,
      });
    } else {
      generate({
        type: "endings",
        theme: endingsTheme === "Others" ? (endingsCustomTheme.trim() || "a Singapore composition topic") : endingsTheme,
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

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectCls =
    "w-full border-2 rounded-xl px-4 py-4 text-lg font-500 text-zinc-800 bg-white focus:outline-none focus:ring-2 transition-shadow cursor-pointer";
  const selectStyle = { borderColor: "var(--border)" };

  const CHOICES = [
    {
      id: "ideas" as Tab,
      icon: <LightbulbFilament size={28} weight="duotone" />,
      color: "var(--coral)",
      title: "I need story ideas",
      desc: "Get 5 ideas to start your composition",
    },
    {
      id: "phrases" as Tab,
      icon: <ChatCircleDots size={28} weight="duotone" />,
      color: "var(--teal)",
      title: "I need phrases",
      desc: "Get descriptive phrases and conversations",
    },
    {
      id: "endings" as Tab,
      icon: <Star size={28} weight="duotone" />,
      color: "#7C3AED",
      title: "I need a strong ending",
      desc: "Get reflective endings to finish your story",
    },
  ];

  const tabLabels: Record<Tab, string> = {
    ideas: "Story Ideas",
    phrases: "Phrases + Dialogue",
    endings: "Strong Endings",
  };

  const generateLabels: Record<Tab, string> = {
    ideas: "Get my story ideas!",
    phrases: "Get my phrases!",
    endings: "Get my ending!",
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "var(--bg)" }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 border-b flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <TextT size={18} weight="duotone" style={{ color: "var(--coral)" }} />
          <span className="text-sm font-800 tracking-tight" style={{ color: "var(--ink)" }}>
            KidComp Helper
          </span>
        </div>
        <div className="flex items-center gap-2">
          {screen !== "pick" && (
            <button
              onClick={() => { setScreen("pick"); setOutput(""); setError(""); }}
              className="flex items-center gap-1.5 text-xs font-700 px-3 py-1.5 rounded-lg border transition-all hover:bg-zinc-50"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <ArrowLeft size={13} weight="bold" /> Start over
            </button>
          )}
          <button
            onClick={handleSurprise}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-700 px-3 py-1.5 rounded-lg border transition-all hover:bg-zinc-50 disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <Shuffle size={13} weight="bold" />
            <span className="hidden sm:inline">Surprise me</span>
          </button>
        </div>
      </header>

      {/* ── SCREEN 1: Pick what you need ── */}
      {screen === "pick" && (
        <div className="flex-1 flex items-center justify-center px-4 py-12 fade-in">
          <div className="w-full max-w-lg">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{ background: "rgba(201,75,43,0.1)" }}
              >
                <TextT size={32} weight="duotone" style={{ color: "var(--coral)" }} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-800 tracking-tight mb-3" style={{ color: "var(--ink)" }}>
                KidComp Helper
              </h1>
              <p className="text-xl text-zinc-500 font-500">
                What do you need help with today?
              </p>
            </div>

            <div className="space-y-4">
              {CHOICES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pickTab(c.id)}
                  className="choice-card"
                >
                  <div className="flex items-center gap-5">
                    <span
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${c.color}14`, color: c.color }}
                    >
                      {c.icon}
                    </span>
                    <div>
                      <p className="text-xl font-700" style={{ color: "var(--ink)" }}>{c.title}</p>
                      <p className="text-base mt-0.5 text-zinc-500">{c.desc}</p>
                    </div>
                    <ArrowLeft size={18} weight="bold" className="ml-auto rotate-180 flex-shrink-0" style={{ color: "var(--muted)" }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 2: Form ── */}
      {screen === "form" && (
        <div className="flex-1 flex items-start justify-center px-4 py-10 fade-in">
          <div className="w-full max-w-xl space-y-10">

            {/* Back button */}
            <button
              onClick={() => { setScreen("pick"); setOutput(""); setError(""); }}
              className="flex items-center gap-2 text-base font-600 transition-colors hover:opacity-70"
              style={{ color: "var(--muted)" }}
            >
              <ArrowLeft size={18} weight="bold" />
              Choose something else
            </button>

            {/* Section header */}
            <div className="text-center">
              <p className="text-sm font-700 uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                {tabLabels[activeTab]}
              </p>
              <h2 className="text-3xl sm:text-4xl font-800 tracking-tight" style={{ color: "var(--ink)" }}>
                {activeTab === "ideas" && "Tell me about your composition"}
                {activeTab === "phrases" && "Tell me about your character"}
                {activeTab === "endings" && "Let me write an ending for you"}
              </h2>
            </div>

            {/* ── IDEAS FORM ── */}
            {activeTab === "ideas" && (
              <>
                <Question
                  number={1}
                  label="What is your composition about?"
                  hint='Pick a topic from the list. Not sure which one? Choose "Others" at the top and type your own.'
                >
                  <select value={ideasTheme} onChange={(e) => setIdeasTheme(e.target.value)} className={selectCls} style={selectStyle}>
                    <option value="Others">Others — type your own topic</option>
                    {THEMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {ideasTheme === "Others" && (
                    <input
                      type="text"
                      value={ideasCustomTheme}
                      onChange={(e) => setIdeasCustomTheme(e.target.value)}
                      placeholder="e.g. My first day at secondary school, The day I lost my dog..."
                      className="mt-3 w-full border-2 rounded-xl px-4 py-4 text-lg text-zinc-800 bg-white focus:outline-none focus:ring-2 transition-shadow"
                      style={selectStyle}
                      autoFocus
                    />
                  )}
                </Question>

                <Question
                  number={2}
                  label="Where does your story happen?"
                  hint="This is optional. Tap the places that fit your story — or type your own at the bottom."
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SETTINGS.map((s) => (
                      <SettingPill key={s} label={s} selected={ideasSettings.includes(s)} onClick={() => toggle(ideasSettings, s, setIdeasSettings)} />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={ideasCustomSetting}
                    onChange={(e) => setIdeasCustomSetting(e.target.value)}
                    placeholder="Not on the list? Type it here — e.g. Sentosa, a shopping mall, my grandmother's flat..."
                    className="w-full border-2 rounded-xl px-4 py-4 text-lg text-zinc-800 bg-white focus:outline-none focus:ring-2 transition-shadow"
                    style={{ borderColor: "var(--border)" }}
                  />
                </Question>
              </>
            )}

            {/* ── PHRASES FORM ── */}
            {activeTab === "phrases" && (
              <>
                <Question
                  number={1}
                  label="What is your composition about?"
                  hint='Pick a topic from the list. Not sure which one? Choose "Others" at the top and type your own.'
                >
                  <select value={phrasesTheme} onChange={(e) => setPhrasesTheme(e.target.value)} className={selectCls} style={selectStyle}>
                    <option value="Others">Others — type your own topic</option>
                    {THEMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {phrasesTheme === "Others" && (
                    <input
                      type="text"
                      value={phrasesCustomTheme}
                      onChange={(e) => setPhrasesCustomTheme(e.target.value)}
                      placeholder="e.g. My first day at secondary school, The day I lost my dog..."
                      className="mt-3 w-full border-2 rounded-xl px-4 py-4 text-lg text-zinc-800 bg-white focus:outline-none focus:ring-2 transition-shadow"
                      style={selectStyle}
                      autoFocus
                    />
                  )}
                </Question>

                <Question
                  number={2}
                  label="How does your character feel?"
                  hint="Pick 1 to 3 feelings."
                >
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map((e) => (
                      <EmotionPill key={e} label={e} selected={phrasesEmotions.includes(e)} onClick={() => toggle(phrasesEmotions, e, setPhrasesEmotions)} />
                    ))}
                  </div>
                </Question>

                <Question number={3} label="Do you want conversations between characters?">
                  <div className="flex gap-3">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        onClick={() => setIncludeDialogue(v)}
                        className="flex-1 py-3 rounded-xl text-base font-700 border-2 transition-all"
                        style={{
                          borderColor: includeDialogue === v ? "var(--teal)" : "var(--border)",
                          background: includeDialogue === v ? "var(--teal)" : "white",
                          color: includeDialogue === v ? "white" : "#3F3F46",
                        }}
                      >
                        {v ? "Yes, add them" : "No thanks"}
                      </button>
                    ))}
                  </div>
                </Question>
              </>
            )}

            {/* ── ENDINGS FORM ── */}
            {activeTab === "endings" && (
              <>
                <Question
                  number={1}
                  label="What is your composition about?"
                  hint='Pick a topic from the list. Not sure which one? Choose "Others" at the top and type your own.'
                >
                  <select value={endingsTheme} onChange={(e) => setEndingsTheme(e.target.value)} className={selectCls} style={selectStyle}>
                    <option value="Others">Others — type your own topic</option>
                    {THEMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {endingsTheme === "Others" && (
                    <input
                      type="text"
                      value={endingsCustomTheme}
                      onChange={(e) => setEndingsCustomTheme(e.target.value)}
                      placeholder="e.g. My first day at secondary school, The day I lost my dog..."
                      className="mt-3 w-full border-2 rounded-xl px-4 py-4 text-lg text-zinc-800 bg-white focus:outline-none focus:ring-2 transition-shadow"
                      style={selectStyle}
                      autoFocus
                    />
                  )}
                </Question>

                <Question number={2} label="What does your character learn or feel at the end?">
                  <select value={endingsEmotion} onChange={(e) => setEndingsEmotion(e.target.value)} className={selectCls} style={selectStyle}>
                    {EMOTIONS.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </Question>

                <Question
                  number={3}
                  label="What happened in your story?"
                  hint="This is optional — but if you write something, the ending will fit your story better."
                >
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Example: I tried rock climbing for the first time and nearly gave up halfway, but my friend cheered me on."
                    rows={4}
                    className="w-full border-2 rounded-xl px-4 py-4 text-lg text-zinc-800 bg-white focus:outline-none focus:ring-2 resize-none transition-shadow"
                    style={selectStyle}
                  />
                </Question>
              </>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              className="btn-generate w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-xl font-800 text-white"
              style={{ background: "linear-gradient(135deg, var(--coral), var(--coral-light))" }}
            >
              <Sparkle size={26} weight="fill" />
              {generateLabels[activeTab]}
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: Output ── */}
      {screen === "output" && (
        <div className="flex-1 flex items-start justify-center px-4 py-10 fade-in">
          <div className="w-full max-w-xl">

            {/* Loading */}
            {loading && (
              <div className="space-y-4">
                <p className="text-base font-700 text-zinc-500">Getting your ideas ready...</p>
                <div className="space-y-3">
                  {[92, 78, 100, 65, 85, 55, 90, 70, 80, 60, 75, 88].map((w, i) => (
                    <div key={i} className="skeleton h-4" style={{ width: `${w}%`, animationDelay: `${i * 55}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Warning size={28} className="text-red-500" weight="duotone" />
                </div>
                <p className="text-lg font-700 text-zinc-800 mb-2">Something went wrong</p>
                <p className="text-sm text-zinc-500 mb-6">{error}</p>
                <button
                  onClick={() => setScreen("form")}
                  className="px-6 py-2.5 rounded-xl text-sm font-700 text-white"
                  style={{ background: "var(--coral)" }}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Output content — visible while streaming too */}
            {output && (
              <div className="slide-up">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-base font-700 text-zinc-500">
                    Here are your {tabLabels[activeTab].toLowerCase()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-700 border transition-all hover:bg-zinc-50"
                      style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                    >
                      {copied ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Content card */}
                <div
                  className="prose-output text-lg leading-9 text-zinc-700 bg-white border rounded-2xl p-8"
                  style={{ borderColor: "var(--border)" }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }}
                />

                {/* Try again — only shown when streaming is done */}
                {!loading && <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleGenerate}
                    className="flex-1 py-3.5 rounded-2xl text-base font-700 border-2 transition-all hover:bg-zinc-50"
                    style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                  >
                    Generate again
                  </button>
                  <button
                    onClick={() => setScreen("form")}
                    className="flex-1 py-3.5 rounded-2xl text-base font-700 text-white"
                    style={{ background: "var(--coral)" }}
                  >
                    Change my answers
                  </button>
                </div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
