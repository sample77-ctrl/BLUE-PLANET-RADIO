/** Real Quest progress, read from what the games store. Badges, XP and level are derived from it on every read; nothing about them is stored. */
export const STARS_KEY = 'sonic_rangers_stars'; // { "1": 0..3, "2": .., "3": .., "4": .. } written by SonicRangersGame
export const MODES_KEY = 'sonic_quest_modes'; // { blind?: true, timemachine?: true, dj?: true } written by markMode()

export type ModeId = 'blind' | 'timemachine' | 'dj';
export type BadgeId = 'fire' | 'rain' | 'ocean' | 'orbital' | 'timemachine' | 'blind' | 'dj';
export type Stars = Record<number, number>;
export type Modes = Partial<Record<ModeId, boolean>>;

/** What earns each badge: a mission with at least one star, or a finished action in a mode. */
export const BADGE_RULES: Record<BadgeId, { mission?: number; mode?: ModeId; earnEn: string; earnBn: string }> = {
  fire: { mission: 1, earnEn: 'Finish mission 1 (Amazon wildfire) with at least one star.', earnBn: 'মিশন ১ (আমাজন দাবানল) অন্তত এক তারা নিয়ে শেষ করো।' },
  rain: { mission: 2, earnEn: 'Finish mission 2 (Bengal monsoon rescue) with at least one star.', earnBn: 'মিশন ২ (বাংলার বর্ষা উদ্ধার) অন্তত এক তারা নিয়ে শেষ করো।' },
  ocean: { mission: 3, earnEn: 'Finish mission 3 (Pacific submarine dive) with at least one star.', earnBn: 'মিশন ৩ (প্রশান্ত মহাসাগরের ডাইভ) অন্তত এক তারা নিয়ে শেষ করো।' },
  orbital: { mission: 4, earnEn: 'Finish mission 4 (orbital station) with at least one star.', earnBn: 'মিশন ৪ (অরবিটাল স্টেশন) অন্তত এক তারা নিয়ে শেষ করো।' },
  timemachine: { mode: 'timemachine', earnEn: 'In Time Machine, play the two years together (Play Binaural Harmony).', earnBn: 'টাইম মেশিনে দুটি বছর একসাথে বাজাও (Play Binaural Harmony)।' },
  blind: { mode: 'blind', earnEn: 'Find every target in Blind Explorer.', earnBn: 'ব্লাইন্ড এক্সপ্লোরারে সব লক্ষ্য খুঁজে বের করো।' },
  dj: { mode: 'dj', earnEn: 'In Earth DJ studio, play two layers (fire, rain, ocean) at the same time.', earnBn: 'আর্থ ডিজে স্টুডিওতে দুটি স্তর (আগুন, বৃষ্টি, সাগর) একসাথে বাজাও।' },
};
export const BADGE_ORDER: BadgeId[] = ['fire', 'rain', 'ocean', 'orbital', 'timemachine', 'blind', 'dj'];

export const XP_PER_STAR = 150;
export const XP_PER_MODE = 100;
export const XP_PER_LEVEL = 300;

function readJson(key: string): unknown {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function readStars(): Stars {
  const o = readJson(STARS_KEY);
  const out: Stars = {};
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (typeof v === 'number' && v > 0) out[Number(k)] = Math.min(3, Math.floor(v));
  return out;
}
export function readModes(): Modes {
  const o = readJson(MODES_KEY);
  const out: Modes = {};
  if (o && typeof o === 'object') for (const m of ['blind', 'timemachine', 'dj'] as const) if ((o as Record<string, unknown>)[m] === true) out[m] = true;
  return out;
}
/** Record that a mode's goal was reached. Idempotent; storage errors are ignored (the badge then simply stays locked). */
export function markMode(id: ModeId): void {
  try { localStorage.setItem(MODES_KEY, JSON.stringify({ ...readModes(), [id]: true })); } catch { /* private mode */ }
}

export interface Derived {
  badges: { id: BadgeId; unlocked: boolean }[];
  unlockedCount: number;
  totalStars: number;
  xp: number;
  level: number;
  xpIntoLevel: number;
}
/** Pure: the same stars and modes always give the same badges, XP and level. */
export function derive(stars: Stars, modes: Modes): Derived {
  const badges = BADGE_ORDER.map((id) => {
    const r = BADGE_RULES[id];
    const unlocked = r.mission != null ? (stars[r.mission] ?? 0) > 0 : !!(r.mode && modes[r.mode]);
    return { id, unlocked };
  });
  const totalStars = Object.values(stars).reduce((a, b) => a + (b > 0 ? b : 0), 0);
  const modesDone = (['blind', 'timemachine', 'dj'] as const).filter((m) => modes[m]).length;
  const xp = totalStars * XP_PER_STAR + modesDone * XP_PER_MODE;
  return { badges, unlockedCount: badges.filter((b) => b.unlocked).length, totalStars, xp, level: 1 + Math.floor(xp / XP_PER_LEVEL), xpIntoLevel: xp % XP_PER_LEVEL };
}
