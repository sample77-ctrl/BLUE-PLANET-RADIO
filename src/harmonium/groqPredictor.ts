import { currentLang, fallbackReply, type FailInfo, type HLang } from './fallback';

// Read at call time so tests can stub it. The key is never logged or rendered. NB: a VITE_ variable ships in the public bundle.
const groqKey = (): string => ((import.meta.env.VITE_GROQ_API_KEY as string | undefined) ?? '').trim();
export const hasGroqKey = (): boolean => groqKey() !== '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

/** One-line method shown next to every pitch-to-year result. */
export const PITCH_METHOD_EN = 'Method: anomaly = 1.5 × log2(Hz / 220), then year = 2026 + (anomaly − 1.25) / 0.25 × 10, 5–95 years. An illustrative mapping from pitch; not a forecast and not NASA data.';
export const PITCH_METHOD_BN = 'পদ্ধতি: অসংগতি = ১.৫ × log2(Hz / ২২০), তারপর সাল = ২০২৬ + (অসংগতি − ১.২৫) / ০.২৫ × ১০, ৫–৯৫ বছর। সুর থেকে নেওয়া একটি দৃষ্টান্তমূলক রূপান্তর; পূর্বাভাস নয়, নাসার ডেটাও নয়।';

export interface FuturePrediction {
  source?: 'ai' | 'built-in'; // who wrote the explanation text
  predictedYear: number;
  yearsFromNow: number;
  temperatureAnomaly: number;
  phenomenonTitleEn: string;
  phenomenonTitleBn: string;
  whyAndHowEn: string;
  whyAndHowBn: string;
  keyDrivers: string[];
  keyDriversBn: string[];
  musicalRagaAnalogy: string;
  musicalRagaAnalogyBn: string;
  sourceTrajectory: string;
  futureVoiceCharacterEn?: string;
  futureVoiceCharacterBn?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  source?: 'ai' | 'built-in'; // who wrote an assistant message
}

/** What we actually know about the AI service: 'unconfigured' = no key; 'idle' = key set, nothing sent yet; 'connected' only after a request succeeded. */
export type AiStatus = 'unconfigured' | 'idle' | 'connected' | 'offline';
let succeeded = false, failed = false;
const listeners = new Set<() => void>();
export function getAiStatus(): AiStatus {
  if (!hasGroqKey()) return 'unconfigured';
  return failed ? 'offline' : succeeded ? 'connected' : 'idle';
}
export const subscribeAiStatus = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
function mark(ok: boolean) { succeeded = ok; failed = !ok; listeners.forEach((f) => f()); }
export const resetAiStatusForTests = () => { succeeded = false; failed = false; };

class AiFail extends Error { info: FailInfo; constructor(info: FailInfo) { super(info.reason); this.info = info; } }
const isNetFail = (e: unknown) => e instanceof AiFail && (e.info.reason === 'offline' || e.info.reason === 'http');
async function groqChat(body: object): Promise<string> {
  if (!hasGroqKey()) throw new AiFail({ reason: 'nokey' });
  let res: Response;
  try {
    res = await fetch(GROQ_ENDPOINT, { method: 'POST', headers: { Authorization: `Bearer ${groqKey()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch { throw new AiFail({ reason: 'offline' }); }
  if (!res.ok) throw new AiFail({ reason: 'http', status: res.status });
  try {
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch { throw new AiFail({ reason: 'parse' }); }
}
const failInfo = (e: unknown): FailInfo => (e instanceof AiFail ? e.info : { reason: 'offline' });

/**
 * Deterministic physical fallback generator for future climate predictions
 */
export function generateDeterministicFuturePrediction(
  freq: number,
  swaraSequence: string,
  mappedAnomaly: number
): FuturePrediction {
  const currentYear = 2026;
  const baselineDelta = Math.max(0.1, mappedAnomaly - 1.25);
  const estimatedYearsAhead = Math.round(Math.min(95, Math.max(5, (baselineDelta / 0.25) * 10)));
  const ruleYear = currentYear + estimatedYearsAhead;

  return {
    predictedYear: ruleYear,
    yearsFromNow: estimatedYearsAhead,
    temperatureAnomaly: mappedAnomaly,
    source: 'built-in',
    phenomenonTitleEn: `Illustrative +${mappedAnomaly}°C level (year ${ruleYear} on a straight-line rule)`,
    phenomenonTitleBn: `দৃষ্টান্তমূলক +${mappedAnomaly}°C স্তর (সরলরেখা নিয়মে সাল ${ruleYear})`,
    whyAndHowEn: `Illustration, not a forecast. Your pitch (${Math.round(freq)} Hz, ${swaraSequence}) maps to +${mappedAnomaly}°C by a fixed rule, and the year assumes warming continues at a steady 0.25°C per decade from +1.25°C. The drivers below, such as greenhouse-gas forcing, are well-documented climate processes, but they are not predictions for this value.`,
    whyAndHowBn: `এটি দৃষ্টান্ত, পূর্বাভাস নয়। আপনার সুর (${Math.round(freq)} Hz, ${swaraSequence}) একটি নির্দিষ্ট নিয়মে +${mappedAnomaly}°C-এ রূপান্তরিত হয়েছে, আর সালটি ধরে নেয় তাপমাত্রা +১.২৫°C থেকে প্রতি দশকে স্থির ০.২৫°C হারে বাড়বে। নিচের কারণগুলো (যেমন গ্রিনহাউস গ্যাসের প্রভাব) জানা জলবায়ু প্রক্রিয়া, কিন্তু এই মানের পূর্বাভাস নয়।`,
    keyDrivers: [
      'Atmospheric CO2 concentrations surpassing 500 ppm causing enhanced greenhouse trapping',
      'Arctic summer sea-ice loss altering Northern Hemisphere jet streams and planetary albedo',
      'Amplified tropical moisture convergence and intense rainfall corridors',
      'Ocean thermal inertia delay translating stored marine heat into continental extremes',
    ],
    keyDriversBn: [
      'বায়ুমণ্ডলে কার্বন ঘনত্ব ৫০০ পিপিএম অতিক্রম ও তীব্র গ্রিনহাউস প্রতিক্রিয়া',
      'সুমেরুর বরফ বিলুপ্তি, অ্যালবেডো হ্রাস ও জেট স্ট্রিম পরিবর্তন',
      'তীব্র মৌসুমি বৃষ্টি, খরা ও আকস্মিক প্লাবনের করিডোর',
      'মহাসাগরের থার্মাল সম্প্রসারণ ও জলবায়ু বিপর্যয়',
    ],
    musicalRagaAnalogy: 'Raga Deepak: Ancient raga of blazing elemental fire, sonifying planetary heating.',
    musicalRagaAnalogyBn: 'রাগ দীপক: আগুনের রাগ, যা পৃথিবীর তাপমাত্রা বৃদ্ধির সাথে সুরের সাদৃশ্য প্রকাশ করে।',
    sourceTrajectory: PITCH_METHOD_EN,
    futureVoiceCharacterEn: `A searing high-frequency harmonic flutter (${Math.round(freq * 1.05)} Hz) punctuated by rapid turbulent wind resonance, sonifying the severe thermodynamic agitation of Earth's atmosphere.`,
    futureVoiceCharacterBn: `উচ্চগ্রামের তীব্র উষ্ণ বায়ুপ্রবাহের সুর (${Math.round(freq * 1.05)} Hz) ও ঝোড়ো বাতাসের অনুরণন—যা অতিরিক্ত গ্রিনহাউস উত্তাপে পৃথিবীর বায়ুমণ্ডলের চরম অস্থিরতার সংকেত দেয়।`,
  };
}

/**
 * Predicts the future planetary year, why it will happen, and scientific visualization
 * using Groq's high-speed inference engine.
 */
export async function predictFutureClimateFromHarmonium(
  freq: number,
  swaraSequence: string,
  mappedAnomaly: number
): Promise<FuturePrediction> {
  const currentYear = 2026;

  // Rule-based baseline estimate based on IPCC SSP2-4.5 / SSP5-8.5 warming rate (~0.25°C per decade)
  const baselineDelta = Math.max(0.1, mappedAnomaly - 1.25);
  const estimatedYearsAhead = Math.round(Math.min(95, Math.max(5, (baselineDelta / 0.25) * 10)));
  const ruleYear = currentYear + estimatedYearsAhead;

  const prompt = `You are a NASA Earth Science Data Specialist and Indian Classical Acoustic Sonification Expert working on the "Harmonium Chat" project for NASA Space Apps Challenge 2026.
A player has played a musical melody on a classical Indian Harmonium.
Acoustic Details:
- Dominant / Average Frequency: ${Math.round(freq)} Hz
- Notes / Swara Sequence: ${swaraSequence}
- Mapped Global Temperature Anomaly: +${mappedAnomaly}°C
Note: The highest observed temperature anomaly in historical NASA records (1880–2025) was +1.29°C in 2024. This pitch maps to a level above any observed value; treat the year as illustrative.

Explain, as an illustration and not a forecast:
1. In what future calendar year (and how many years from now) could this temperature anomaly (+${mappedAnomaly}°C) be reached under current emissions trajectories?
2. Why and how will this happen ("কেন হবে"): Detail the greenhouse feedback loops, ocean warming, Arctic albedo loss, and atmospheric physics.
3. What are the key drivers (3-4 bullet points)?
4. Indian Classical Raga / Mood Analogy (e.g. Raga Deepak for intense heat, Raga Bhairav for planetary awakening, Raga Megh Mallar for disrupted monsoons).
5. Future Voice Characteristic: Describe the acoustic texture and sonic character of Earth's atmosphere under this future state ("futre er kemon voice hoite pare").

Respond in clean JSON format matching this schema strictly without markdown backticks:
{
  "predictedYear": ${ruleYear},
  "yearsFromNow": ${estimatedYearsAhead},
  "temperatureAnomaly": ${mappedAnomaly},
  "phenomenonTitleEn": "Title in English",
  "phenomenonTitleBn": "বাংলায় শিরোনাম",
  "whyAndHowEn": "Detailed scientific explanation in English explaining why and how this future state will emerge.",
  "whyAndHowBn": "কেন ও কীভাবে এই উষ্ণায়ন ঘটবে তার বাংলায় বিস্তারিত বৈজ্ঞানিক ব্যাখ্যা।",
  "keyDrivers": ["driver 1", "driver 2", "driver 3"],
  "keyDriversBn": ["কারণ ১", "কারণ ২", "কারণ ৩"],
  "musicalRagaAnalogy": "Musical raga description in English",
  "musicalRagaAnalogyBn": "রাগ ও সুরের তাৎপর্য বাংলায়",
  "futureVoiceCharacterEn": "Acoustic texture and character of future Earth voice",
  "futureVoiceCharacterBn": "ভবিষ্যতে পৃথিবীর শব্দের রূপ ও সুরের প্রকৃতি বাংলায়",
  "sourceTrajectory": "IPCC AR6 Working Group I / NASA GISS Climate Model Projection"
}`;

  try {
    const rawContent = await groqChat({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert NASA climate scientist and sonification engineer. Always return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });
    if (!rawContent) throw new AiFail({ reason: 'parse' });

    // Strip markdown code fences if model included them
    const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    mark(true);

    return {
      source: 'ai',
      predictedYear: ruleYear, // the year always comes from the stated rule, never from the model
      yearsFromNow: estimatedYearsAhead,
      temperatureAnomaly: mappedAnomaly,
      phenomenonTitleEn: parsed.phenomenonTitleEn || `Global Thermal Horizon (+${mappedAnomaly}°C)`,
      phenomenonTitleBn: parsed.phenomenonTitleBn || `বৈশ্বিক উষ্ণায়ন দিগন্ত (+${mappedAnomaly}°C)`,
      whyAndHowEn: parsed.whyAndHowEn || `Under projected greenhouse gas emission trajectories, global mean temperatures are anticipated to rise by +${mappedAnomaly}°C as cumulative carbon dioxide emissions and diminished Arctic sea ice reduce Earth's albedo.`,
      whyAndHowBn: parsed.whyAndHowBn || `ধারাবাহিক গ্রিনহাউস গ্যাস নির্গমন ও মেরু অঞ্চলের বরফ গলে যাওয়ার কারণে পৃথিবীর অ্যালবেডো কমে গিয়ে বৈশ্বিক গড় তাপমাত্রা +${mappedAnomaly}°C বৃদ্ধি পাওয়ার পূর্বাভাস দেওয়া হয়েছে।`,
      keyDrivers: Array.isArray(parsed.keyDrivers) ? parsed.keyDrivers : [
        'Persistent cumulative CO2 and methane atmospheric loading',
        'Loss of polar reflective sea ice (positive albedo feedback)',
        'Thermal inertia and expansion of the global ocean',
      ],
      keyDriversBn: Array.isArray(parsed.keyDriversBn) ? parsed.keyDriversBn : [
        'বায়ুমণ্ডলে কার্বন ডাই অক্সাইড ও মিথেনের ক্রমবর্ধমান জমা হওয়া',
        'মেরু অঞ্চলের বরফ কমে যাওয়া ও প্রতিফলক হ্রাস (অ্যালবেডো ফিডব্যাক)',
        'মহাসাগরের তাপ ধারণ ও থার্মাল সম্প্রসারণ',
      ],
      musicalRagaAnalogy: parsed.musicalRagaAnalogy || 'Raga Deepak / Bhairav: The ascending high pitch mirrors the thermal escalation of the biosphere.',
      musicalRagaAnalogyBn: parsed.musicalRagaAnalogyBn || 'রাগ দীপক ও ভৈরব: তীব্র স্বরগ্রাম ধরিত্রীর তাপমাত্রার ঊর্ধ্বগতি ও সতর্কবার্তার সুর নির্দেশ করে।',
      sourceTrajectory: PITCH_METHOD_EN, // always ours: the model's own source claims are not verified
      futureVoiceCharacterEn: parsed.futureVoiceCharacterEn || `A searing high-frequency harmonic flutter (${Math.round(freq * 1.05)} Hz) punctuated by rapid turbulent wind resonance, sonifying the severe thermodynamic agitation of Earth's atmosphere.`,
      futureVoiceCharacterBn: parsed.futureVoiceCharacterBn || `উচ্চগ্রামের তীব্র উষ্ণ বায়ুপ্রবাহের সুর (${Math.round(freq * 1.05)} Hz) ও ঝোড়ো বাতাসের অনুরণন—যা অতিরিক্ত গ্রিনহাউস উত্তাপে পৃথিবীর বায়ুমণ্ডলের চরম অস্থিরতার সংকেত দেয়।`,
    };
  } catch (e) {
    if (isNetFail(e)) mark(false);
    return generateDeterministicFuturePrediction(freq, swaraSequence, mappedAnomaly);
  }
}

/**
 * Free-form conversation with Groq AI regarding harmonium notes, NASA sonification, and future climate.
 */
export async function sendHarmoniumChatMessageDetailed(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  audioContext: { freq: number; swaraSequence: string; mappedAnomaly: number },
  lang: HLang = currentLang(),
): Promise<{ text: string; source: 'ai' | 'built-in' }> {
  const systemPrompt = `You are "Harmonium Earth AI", an intelligent conversational agent inside Blue Planet Radio for the NASA Space Apps Challenge 2026.
You are fluent in both English and Bengali (বাংলা).
Current musical context:
- Harmonium dominant pitch: ${Math.round(audioContext.freq)} Hz
- Recent swaras played: ${audioContext.swaraSequence}
- Illustrative pitch-to-anomaly mapping (not NASA data): +${audioContext.mappedAnomaly}°C

Answer the user with scientific warmth, educational clarity, and musical reverence. Connect Indian classical ragas (Sa, Re, Ga, Ma, Pa, Dha, Ni) with authentic NASA Earth observations (GISTEMP, FIRMS, POWER rainfall, MUR ocean temperature) and future planetary health. Keep answers concise (2-4 paragraphs). If the user speaks Bengali, answer in Bengali. Never present the pitch mapping as a forecast or as NASA data, and say when you are unsure.`;

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  try {
    const text = await groqChat({ model: MODEL, messages: [{ role: 'system', content: systemPrompt }, ...messages], temperature: 0.5, max_tokens: 500 });
    if (!text) throw new AiFail({ reason: 'parse' });
    mark(true);
    return { text, source: 'ai' };
  } catch (e) {
    const info = failInfo(e);
    if (isNetFail(e)) mark(false);
    return { text: fallbackReply(lastUser, info, lang), source: 'built-in' };
  }
}

/** Same as sendHarmoniumChatMessageDetailed, text only (kept for existing callers). */
export async function sendHarmoniumChatMessage(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  audioContext: { freq: number; swaraSequence: string; mappedAnomaly: number },
  lang: HLang = currentLang(),
): Promise<string> {
  return (await sendHarmoniumChatMessageDetailed(messages, audioContext, lang)).text;
}
