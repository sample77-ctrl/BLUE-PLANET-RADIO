// Harmonium UI strings ({en, bn}); kept here because src/lib/strings.ts is shared. Use via useHT().
import { usePrefs } from '../lib/prefs';

const S = {
  aiUnconfigured: { en: 'AI not configured', bn: 'এআই সেট করা নেই' },
  aiIdle: { en: 'AI key set, not tried yet', bn: 'এআই কী আছে, এখনও চেষ্টা করা হয়নি' },
  aiConnected: { en: 'AI connected', bn: 'এআই সংযুক্ত' },
  aiOffline: { en: 'Offline, using built-in answers', bn: 'অফলাইন, অ্যাপের নিজস্ব উত্তর দেওয়া হচ্ছে' },
  closeHarmonium: { en: 'Close Harmonium Chat', bn: 'হারমোনিয়াম চ্যাট বন্ধ করুন' },
  tabExplorer: { en: 'Harmonium Explorer', bn: 'হারমোনিয়াম ও অনুসন্ধান' },
  tabChat: { en: 'AI Chat', bn: 'এআই চ্যাট' },
  tabsLabel: { en: 'Harmonium views', bn: 'হারমোনিয়ামের দৃশ্য' },
  eyebrow: { en: 'Pitch → NASA snapshot · Groq AI', bn: 'সুর → নাসা স্ন্যাপশট · গ্রক এআই' },
  predBadgeAi: { en: 'Illustration, text by AI (Groq gpt-oss-120b)', bn: 'দৃষ্টান্ত, লেখা এআই-এর (Groq gpt-oss-120b)' },
  predBadgeBuiltIn: { en: 'Illustration, built-in text (no AI)', bn: 'দৃষ্টান্ত, অ্যাপের নিজস্ব লেখা (এআই নয়)' },
  notForecast: { en: 'Not a forecast. Not NASA data.', bn: 'পূর্বাভাস নয়। নাসার ডেটা নয়।' },
  method: { en: 'Method', bn: 'পদ্ধতি' },
  chatSourceAi: { en: 'AI', bn: 'এআই' },
  chatSourceBuiltIn: { en: 'Built-in answer, not AI', bn: 'অ্যাপের নিজস্ব উত্তর, এআই নয়' },
  predictionNote: { en: 'Illustrative pitch mapping', bn: 'দৃষ্টান্তমূলক সুর-রূপান্তর' },
  predictionWhy: { en: 'Year (illustrative): {y}, +{n} years. Anomaly +{a}°C from pitch {f} Hz.', bn: 'সাল (দৃষ্টান্ত): {y}, {n} বছর পর। সুর {f} Hz থেকে অসংগতি +{a}°C।' },
  predictHint: { en: 'No AI key on this site: the text is built in, not written by AI.', bn: 'এই সাইটে এআই কী নেই: লেখাটি অ্যাপের নিজস্ব, এআই-এর লেখা নয়।' },
  predictionTitle: { en: 'Illustrative future, from your pitch', bn: 'আপনার সুর থেকে দৃষ্টান্তমূলক ভবিষ্যৎ' },
} as const;
export type HKey = keyof typeof S;

export function useHT() {
  const { lang } = usePrefs();
  return (k: HKey, vars?: Record<string, string | number>) => {
    let s: string = S[k][lang];
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, String(b));
    return s;
  };
}
