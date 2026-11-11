// Honest offline answers for the Harmonium chat: one plain line saying the AI is unavailable and why,
// then (only when the question matches) a small deterministic answer built from the bundled NASA snapshots.
import vital from '../../public/data/vital_signs.json';

export type HLang = 'en' | 'bn';
export type FailReason = 'nokey' | 'offline' | 'http' | 'parse';
export interface FailInfo { reason: FailReason; status?: number }

interface Series { id: string; unit: string; source: string; points: { year: number; value: number }[] }
const SERIES = (vital as { series: Series[] }).series;
const GENERATED = (vital as { generated: string }).generated;
const find = (id: string) => SERIES.find((s) => s.id === id)!;
const last = (s: Series) => s.points[s.points.length - 1];
const maxOf = (s: Series) => s.points.reduce((a, b) => (b.value > a.value ? b : a));

export const currentLang = (): HLang => (typeof document !== 'undefined' && document.documentElement.lang === 'bn' ? 'bn' : 'en');
const bnDigits = (s: string | number) => String(s).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export function whyUnavailable(f: FailInfo, lang: HLang): string {
  const bn = lang === 'bn';
  switch (f.reason) {
    case 'nokey': return bn ? 'এআই সহকারী এখন বন্ধ: এই সাইটে কোনো এপিআই কী সেট করা নেই।' : 'The AI assistant is unavailable: no API key is set on this site.';
    case 'offline': return bn ? 'এআই সহকারী এখন পাওয়া যাচ্ছে না: সংযোগ নেই বা অনলাইনে পৌঁছানো যায়নি।' : 'The AI assistant is unavailable: you appear to be offline or the service could not be reached.';
    case 'http': return bn ? `এআই সহকারী এখন পাওয়া যাচ্ছে না: সার্ভিস ত্রুটি (HTTP ${bnDigits(f.status ?? 0)}) দিয়েছে।` : `The AI assistant is unavailable: the service returned an error (HTTP ${f.status ?? '?'}).`;
    default: return bn ? 'এআই সহকারী এখন পাওয়া যাচ্ছে না: উত্তরটি পড়া যায়নি।' : 'The AI assistant is unavailable: its reply could not be read.';
  }
}

/** A short, sourced answer when the question is about something the bundled snapshots cover; '' when it is not. */
export function snapshotAnswer(question: string, lang: HLang): string {
  const q = question.toLowerCase();
  const bn = lang === 'bn';
  const n = (v: number, d = 2) => (bn ? bnDigits(v.toFixed(d)) : v.toFixed(d));
  const y = (v: number | string) => (bn ? bnDigits(v) : String(v));
  const temp = find('temp'), co2 = find('co2'), ice = find('ice');
  const parts: string[] = [];
  const wantTemp = /warm|temperature|anomal|climate|heat|degree|°c|2024|hot|তাপ|গরম|উষ্ণ|জলবায়ু|ডিগ্রি/.test(q);
  const wantCo2 = /co2|co₂|carbon|greenhouse|কার্বন|গ্রিনহাউস/.test(q);
  const wantIce = /arctic|sea ice|ice|polar|মেরু|বরফ|সুমেরু/.test(q);
  if (wantTemp || wantIce) {
    const l = last(temp), r = maxOf(temp);
    parts.push(bn
      ? `বৈশ্বিক গড় তাপমাত্রার অসংগতি (১৯৫১–১৯৮০ গড়ের তুলনায়): ${y(l.year)} সালে +${n(l.value)}°C; রেকর্ড ${y(r.year)} সালে +${n(r.value)}°C।`
      : `Global mean temperature anomaly (vs the 1951–1980 average): +${n(l.value)}°C in ${l.year}; record +${n(r.value)}°C in ${r.year}.`);
  }
  if (wantIce) {
    const f = ice.points[0], l = last(ice);
    parts.push(bn
      ? `আর্কটিকে সেপ্টেম্বরের সামুদ্রিক বরফ: ${y(f.year)} সালে ${n(f.value)} থেকে ${y(l.year)} সালে ${n(l.value)} মিলিয়ন বর্গ কিমি (সাম্প্রতিক বছর প্রাথমিক, সংশোধন হতে পারে)।`
      : `Arctic September sea-ice extent: ${n(f.value)} million km² in ${f.year} to ${n(l.value)} in ${l.year} (recent years are near-real-time and may be revised).`);
  }
  if (wantCo2) {
    const f = co2.points[0], l = last(co2);
    parts.push(bn
      ? `মাউনা লোয়ায় বার্ষিক গড় CO₂: ${y(f.year)} সালে ${n(f.value, 1)} ppm থেকে ${y(l.year)} সালে ${n(l.value, 1)} ppm।`
      : `Mauna Loa annual mean CO₂: ${n(f.value, 1)} ppm in ${f.year} to ${n(l.value, 1)} ppm in ${l.year}.`);
  }
  if (!parts.length) return '';
  const src = [wantTemp || wantIce ? temp : null, wantIce ? ice : null, wantCo2 ? co2 : null].filter(Boolean).map((s) => (s as Series).source);
  const head = bn ? `অ্যাপে থাকা ডেটা স্ন্যাপশট থেকে (তৈরি ${y(GENERATED)}, লাইভ নয়):` : `From the data snapshot bundled in this app (generated ${GENERATED}, not live):`;
  return `${head}\n${parts.join('\n')}\n${bn ? 'সূত্র' : 'Source'}: ${src.join('; ')}`;
}

export function fallbackReply(question: string, f: FailInfo, lang: HLang): string {
  const ans = snapshotAnswer(question, lang);
  return ans ? `${whyUnavailable(f, lang)}\n\n${ans}` : `${whyUnavailable(f, lang)} ${lang === 'bn' ? 'এই প্রশ্নের জন্য অ্যাপে কোনো স্ন্যাপশট ডেটা নেই।' : 'The app has no bundled data for this question.'}`;
}
