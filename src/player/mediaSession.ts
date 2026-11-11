import { getNowPlaying, subscribeNowPlaying } from './nowPlaying';

/** Lock-screen / media-key integration where the browser has it. Metadata and play/pause/prev/next only.
 *  Web Audio alone usually does not raise OS controls (they follow an <audio> element), so this is best-effort and unverified on iOS. */
export function installMediaSession(): () => void {
  const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
  if (!ms || typeof MediaMetadata === 'undefined') return () => {};
  const act = (name: MediaSessionAction, fn: MediaSessionActionHandler | null) => { try { ms.setActionHandler(name, fn); } catch { /* not supported here */ } };
  const apply = () => {
    const np = getNowPlaying();
    if (!np) { ms.metadata = null; ms.playbackState = 'none'; return; }
    ms.metadata = new MediaMetadata({ title: np.title, artist: np.subtitle, album: 'Sonic Earth Atlas' });
    ms.playbackState = np.state === 'playing' ? 'playing' : 'paused';
    const c = np.controls;
    act('play', () => { if (getNowPlaying()?.state !== 'playing') c.toggle(); });
    act('pause', () => { if (getNowPlaying()?.state === 'playing') c.toggle(); });
    act('previoustrack', c.step ? () => c.step!(-1) : null);
    act('nexttrack', c.nextStory && np.upNext?.length ? c.nextStory : c.step ? () => c.step!(1) : null);
  };
  apply();
  const off = subscribeNowPlaying(apply);
  return () => { off(); (['play', 'pause', 'previoustrack', 'nexttrack'] as MediaSessionAction[]).forEach((a) => act(a, null)); };
}
