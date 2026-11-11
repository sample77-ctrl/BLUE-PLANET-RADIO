import { CHAPTERS, numberFromPrecip, numberFromSeries, type ChapterId, type ChapterNumber } from '../lib/chapters';

/** Loads the one real number of each landing chapter from the bundled files (the same series the Data Jukebox plays). Its own lazy chunk: the landing's first paint does not wait for it. A failed file gives `null` for that chapter only. */
export async function loadChapterNumbers(signal?: AbortSignal): Promise<Record<ChapterId, ChapterNumber | null>> {
  const [{ loadStorySeries }, { GLOBAL_STORIES }, { loadPrecip, PRECIP_INFO }] = await Promise.all([import('../stories/loadStory'), import('../stories/stories'), import('../datasets/adapters/precip')]);
  const out = {} as Record<ChapterId, ChapterNumber | null>;
  await Promise.all(CHAPTERS.map(async (c) => {
    try {
      if ('precip' in c.source) { out[c.id] = numberFromPrecip(await loadPrecip(signal), PRECIP_INFO); return; }
      const id = c.source.story, story = GLOBAL_STORIES.find((s) => s.id === id);
      const series = story ? await loadStorySeries(story, { signal }) : null;
      out[c.id] = series ? numberFromSeries(series) : null;
    } catch { out[c.id] = null; }
  }));
  return out;
}
