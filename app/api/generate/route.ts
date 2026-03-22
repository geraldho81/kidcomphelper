import { NextRequest } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: process.env.KIMI_BASE_URL,
});

const MODEL = process.env.KIMI_MODEL || "kimi-k2.5";

const SYSTEM_PROMPT = `You are an expert Singapore primary school English composition teacher helping P5/P6 students (11-year-olds) write better compositions.

Rules you MUST follow:
- All content must be 100% child-safe and appropriate for 11-year-olds
- Use Singapore context naturally: HDB flats, MRT, hawker centres, void decks, school canteens, CCAs, local festivals (CNY, Hari Raya, Deepavali), neighbourhood life
- Embed MOE values: kindness, perseverance, honesty, gratitude, courage, resilience
- Write in Standard English but allow light, natural Singapore flavour in dialogue (e.g. "lah", "ah", "wah", "aiyah") — not exaggerated
- Keep language accessible to P5/P6 level — clear, vivid, not overly complex
- Focus on show-don't-tell techniques, sensory details, and strong emotional resonance
- Every piece must help students write stronger PSLE-style compositions

LANGUAGE RULES — strictly enforced:
- NEVER use em dashes (— or –). Use a comma, full stop, or rewrite the sentence instead.
- NEVER use filler AI phrases such as: "in conclusion", "it is worth noting", "it goes without saying", "needless to say", "as mentioned", "delve into", "tapestry", "testament to", "as a result of this", "in the grand scheme of things", "at the end of the day", "this just goes to show", "journey" (used metaphorically), "beacon", "foster", "bustling", "vibrant", "crucial", "pivotal", "embark", "it is important to note".
- Write like a real teacher crafting model compositions — specific, grounded, and human. Avoid generic phrasing.
- Every sentence must earn its place. No padding.`;

type GenerateRequest = {
  type: "ideas" | "phrases" | "endings";
  theme: string;
  emotions?: string[];
  settings?: string[];
  includeDialogue?: boolean;
  brief?: string;
};

function buildIdeasPrompt(req: GenerateRequest): string {
  const settingNote = req.settings?.length
    ? `Settings to weave in: ${req.settings.join(", ")}.`
    : "";

  return `Generate 5 story starter ideas for the composition theme: "${req.theme}".
${settingNote}

For each idea:
- Write 3–4 vivid sentences that set up a compelling situation
- End with a personal hook question that invites the student to connect emotionally (e.g. "Have you ever felt like this?")
- Include a simple story structure hint: Beginning → Problem → Resolution → Reflection
- Make each idea feel different from the others (different settings, different characters, different emotional angles)

Format each idea like this:
**Idea [number]: [short title]**
[3-4 sentence story starter]
*Hook: [personal question]*
*Story hint: Beginning → [brief hint] → Problem → [brief hint] → Resolution → [brief hint]*

---`;
}

function buildPhrasesPrompt(req: GenerateRequest): string {
  const emotions = req.emotions?.length ? req.emotions : ["Excitement"];
  const dialogueNote = req.includeDialogue
    ? `\n\nAlso generate 5 natural dialogue snippets relevant to this theme. Format each as:\n**Dialogue [n]:** [Speaker]: "[line]" / [Speaker]: "[line]"`
    : "";

  return `Generate 12 descriptive phrases for a composition about "${req.theme}" featuring these emotions: ${emotions.join(", ")}.

Requirements for phrases:
- Use show-don't-tell (describe the physical sensation, not just the emotion name)
- Include sensory details: sight, sound, smell, touch, taste where relevant
- Use vivid similes with Singapore-familiar references (e.g. comparing to MRT, hawker centre smells, HDB corridors, monsoon rain)
- Group phrases by emotion
- Each phrase should be 1–2 sentences, ready to drop into a composition

Format:
**[Emotion name]**
1. [phrase]
2. [phrase]
3. [phrase]
(continue for each emotion)
${dialogueNote}`;
}

function buildEndingsPrompt(req: GenerateRequest): string {
  const emotion = req.emotions?.length ? req.emotions[0] : "reflection";
  const briefNote = req.brief?.trim()
    ? `What happened in the story: "${req.brief.trim()}"`
    : "";

  return `Generate 5 reflective conclusion paragraphs for a composition about "${req.theme}" where the main emotion is ${emotion}.
${briefNote}

Each conclusion must:
- Show clear personal growth or insight (not just "I learned a lesson")
- Reference a specific detail from the theme to feel personal and authentic
- End with a forward-looking thought or resolve — what the student will do differently
- Be 3–5 sentences, PSLE-appropriate in sophistication
- Vary in tone: e.g. one hopeful, one quiet/reflective, one determined, one grateful, one bittersweet

After the 5 conclusions, provide 3 reflection questions to help the student personalise their ending:
**Reflection Questions:**
1. [question]
2. [question]
3. [question]

Format each conclusion:
**Ending [number]: [mood/tone label]**
[paragraph]

---`;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();

    if (!body.type || !body.theme) {
      return Response.json(
        { error: "Missing required fields: type, theme" },
        { status: 400 }
      );
    }

    let userPrompt: string;
    switch (body.type) {
      case "ideas":   userPrompt = buildIdeasPrompt(body); break;
      case "phrases": userPrompt = buildPhrasesPrompt(body); break;
      case "endings": userPrompt = buildEndingsPrompt(body); break;
      default:
        return Response.json({ error: "Invalid type" }, { status: 400 });
    }

    const stream = await (client.chat.completions.create as Function)({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      // kimi-k2.5: thinking disabled = temperature 0.6, thinking enabled = 1.0
      temperature: 0.6,
      max_tokens: 2000,
      stream: true,
      thinking: { type: "disabled" },
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            let text = chunk.choices[0]?.delta?.content ?? "";
            if (!text) continue;
            // Strip em/en dashes on the fly
            text = text.replace(/\u2014/g, ",").replace(/\u2013/g, "-");
            controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    console.error("Kimi API error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate content";
    return Response.json({ error: message }, { status: 500 });
  }
}
