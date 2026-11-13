# Writing and cutting the video: The Earth Information Jukebox

Guidelines for a NASA Space Apps project video in the **Earth Information Jukebox** category, written for Blue Planet Radio but valid for any entry in this challenge. Read once before writing `story.json` and `shots.json`.

## 1. What this category is judged on
The challenge asks for **NASA Earth Information Center (EIC) visual frames, or comparable Earth science information, paired with sound generated from the data**. A generic space site, or music laid over pictures, does not answer it. So the film has one job above all: **let the judge hear data become sound and understand how**, within the first minute.

Space Apps judges usually score Impact, Creativity, Validity, Relevance and Presentation. Check the event's own Judging & Awards guide and the local "240 seconds" rules (length limit, file format, upload place, captions) before the final export, and change this file if they differ. Map the film to the criteria like this:

| Criterion | What the film must show |
|---|---|
| Relevance | an EIC frame on screen, the needle sweeping it, the sound it makes. Say the words "Earth Information Center". |
| Validity | the mapping said once, plainly (height = pitch, brightness = loudness, colour = timbre; one note per year), and one decoded note ("1998: 0.61 °C, so A4"). Source, unit and period visible on screen. |
| Creativity | the moment only sound can do: two periods in two ears (Side A / Side B), the globe's fire, rain and ocean voices in stereo. |
| Impact | who it is for (people who cannot see a chart, students, a Bangladesh audience in বাংলা) and one real use. |
| Presentation | clean audio, no dead air, no unreadable UI, one story start to finish. |

## 2. The rules this category adds to the house rules
1. **Sound is the picture.** At least a third of the runtime should have the app's own sound audible. Record it with `record.mjs` (it captures the app's Web Audio, see README). Never fake it with a recording that the app did not make.
2. **Let it play.** Give at least three "listen" moments of 3-6 s each with no narration over them: the first EIC sweep, the Side A / Side B comparison, the globe voices. The narrator sets each one up in the line before ("Listen to the last thirty years."), then stops talking.
3. **No music under sonification.** Music sits under narration only and must dip out whenever app sound plays (`assemble.mjs` ducks music under both voice and app sound; keep `music.gain` at -18 dB or lower). Music with a clear pitch or beat confuses a judge who is trying to hear data, so use a pad, a drone or nothing.
4. **Say the mapping once, show it every time.** One sentence of mapping, then the app's own "What you hear" legend or readout on screen while it plays.
5. **Honest labels.** Snapshots are snapshots: never "live" or "real time data" for bundled files. "Generated live in your browser" is true of the *sound*; say it that way. Prototype and sample data are named as such (a `note=` chip on a card does this). No numbers from memory: every number on a card or in the narration comes from the app's bundled data or its About the Science page.
6. **Credit.** "NASA images and data" in the closing card, plus the EIC/earth.gov frames and each dataset by name; not affiliated with or endorsed by NASA. Fonts and other assets per their licences.
7. **Headphones.** The stereo (left/right) moments only work on headphones; one small "Headphones on" card at the start, or a line in the hook.
8. **Bilingual.** One short moment in বাংলা (switch the interface, or a বাংলা card made with `lang=bn`) proves it without slowing the film.

## 3. A 240 s structure that fits this challenge
Speech at about 2.5 words a second, leaving room for the listen moments. Budgets are a starting point; the team's own footage, once recorded, sets the final times (house rule 1).

| Beat | Time | Seconds | Content |
|---|---|---|---|
| 01 hook | 0:00 | 15 | Silence, then one EIC frame and its sound. One line: what you are hearing. Headphones card. |
| 02 who | 0:15 | 12 | Team, place, why we care (Bangladesh, monsoon, heat). Title card. |
| 03 problem | 0:27 | 15 | Pictures of a changing Earth only reach people who can see them. One real fact with its source. |
| 04 answer | 0:42 | 10 | Blue Planet Radio in one breath; who uses it. |
| 05 frames | 0:52 | 35 | EIC frame on the Frame Stage: mapping sentence, then a **listen** moment; the interface takes the colour under the needle. |
| 06 data behind | 1:27 | 30 | The real series behind the frame; Side A / Side B in two ears (**listen**); one decoded note. |
| 07 globe | 1:57 | 30 | Explore Earth: fire, rain, ocean voices in stereo (**listen**); pick Bangladesh; the profile says only what exists. |
| 08 for everyone | 2:27 | 25 | Keyboard, screen reader, List view, reduced motion, বাংলা, Sonic Quest for kids (a few seconds each, no tour). |
| 09 science | 2:52 | 20 | Datasets on one card (source · period · unit); About the Science; what is a snapshot. |
| 10 impact + limits | 3:12 | 18 | Who it helps, one honest limit, what is next. |
| 11 close | 3:30 | 10 | Logo, tagline, link or QR, credits, "not endorsed by NASA". |

Leave 0.3-0.5 s of air at every cut and about 0.5 s of black (fade) at both ends.

## 4. Writing the narration
- One idea per sentence, and each sentence sits on the clip that shows it (house rule: audio follows picture).
- Write for the ear: "one note per year", not "an annual-resolution pentatonic mapping".
- Numbers: say at most one per sentence, rounded the way the app shows them, with the unit.
- Names ElevenLabs may mispronounce: "GISTEMP", "MUR", "FIRMS", "Sylhet", "বাংলা", the team name. Run `node narrate.mjs --only <beat>` on one beat first and listen; respell in the text if needed (e.g. "gis-temp").
- `node narrate.mjs --dry` must show no OVER and a total of about 75-80 % of 240 s (lower than other categories, because of the listen moments).

## 5. Recording the app (`record.mjs` + `shots.json`)
- Record the **production build** (`npm run build && npm run preview`), 1920x1080, dark scheme, fresh profile per shot. Run `node record.mjs --sync-test` once per machine and put its `audioShift` in `shots.json`.
- One shot per action, a little longer than its slot (2 s of handle each side). Record each listen moment as its own shot so it can be trimmed without cutting the sound mid-note.
- Small UI text must read at 1080p: if not, a `css` setup step can scale the control for the recording (it is not a change to the app).
- Look at every clip's contact sheet and listen to it before cutting: `record.mjs` warns when no sound was captured, and a page that loaded slowly can start on a spinner.
- If the team records clips themselves (screen recorder with system audio), those clips are the picture: put them in `footage/` and cut around them; do not replace them with `record.mjs` clips without asking.

## 6. Graphics (`graphics/card.html`)
Title, fact and lower-third cards in the app's own look, made from the URL query (see the comment at the top of the file). Keep every card on screen at least 3 s plus 1 s per 10 words. Fact cards always carry a `src=` line (source | period | method). `render-frames.mjs` renders at 25 fps, the same as the recordings and the cut; never convert to 30.

## 7. Before export
- `node assemble.mjs --plan` shows no SHORT shots; `--draft` watched end to end with headphones.
- Frames at each sentence's start match what the sentence says (`frames-sheet.sh` at the voice `at` times).
- `node check.mjs out/video.mp4 240 --sheet` passes (length, -16 LUFS, peak under -1 dB).
- Someone who has not seen the app watches it once and can say how the sound was made. If they cannot, the mapping sentence or the decoded note is missing.
- Nothing in the film claims live data, NASA endorsement, or a feature the deployed build does not have.
