# EU AI Act, Article 5: shot list

47.14 s · 112 bpm (beat = 0.536 s) · 88 beats · format: 16x9
Music: `audio/score.py` (retro swing: marimba, vibes, walking bass, snaps; D-minor pizzicato on the board)
VO: Stella, Kokoro voice (`audio/script.txt`, placed on the grid by `score.py`)
Look: 3-D clay (three.js) with deep, solid, saturated colours and no pastels. Each scene has its own dark room: navy (title, sign-off), teal (cabinet), plum (calendar) and forest (board). The props are gold, crimson, royal, violet, teal, emerald and orange clay; Stella is gold. Spotlight pools, soft shadows, contact AO and light depth of field.
Placement: all type faces the camera straight on and stands on dark clay podium steps or ledges, never flat on the floor. Each shot's group is centred and fills about 80–90 % of the width. Sentence case everywhere (house rule).

| # | beats | time | shot | on screen | motion | out | sound |
|---|-------|------|------|-----------|--------|-----|-------|
| 1 | 0-11 | 0.0-5.9 | Hook + title | Navy stage. A giant crimson clay "5" slams onto a dark podium step (crumbs, camera shake), then the camera pulls back: "Article" hops in letter by letter, Stella sleeps in a crimson ring, "Prohibited AI practices" sits on a ledge in front, and "The EU AI Act · Module 2" is on the back wall | close on the 5, log-space pull to a straight-on wide | podium lowers into the stage; Stella wakes | impact, toks, pop, VO "Welcome to Article 5..." |
| 2 | 11-19 | 5.9-10.2 | Stella + ID card | Stella in front of her ring (now a halo) holds up a teal clay ID card: Bureau of Compliance / Name: Stella the Standard / Department: EU AI Act / Clearance: AI | card flips up, settles straight to camera | whip right to the cabinet | VO "I'm Stella the Standard..." |
| 3 | 19-33 | 10.2-17.7 | Risk cabinet | Teal room, charcoal cabinet "EU AI Act" (slight turn), drawers emerald Minimal, royal Limited, amber High, crimson Unacceptable; gold arrow "More risk" | drawers pop bottom-up on b27, b29 and b31; Stella points at each | Stella floats to the top drawer | VO "four levels of risk... Minimal. Limited. High." |
| 4 | 33-47 | 17.7-25.2 | Unacceptable | Top drawer bursts on b35.5 (shake); the navy "Unacceptable risk" file rises above the cabinet; a red clay seal "Banned / outright" slams in from the camera on b45 | camera rises with the file, cabinet drops out of frame | whip down to the calendar | music stops on b35.5 and b45; VO "...banned outright." |
| 5 | 47-56 | 25.2-30.0 | Calendar | Plum room, walnut desk, charcoal flip calendar with navy pages: February 1 → 2, 2025; red clay ring drawn round the 2; gold tag "In force from 2 Feb 2025" | page flips b49.6, ring b51.4, tag b52.6 | whip right to the board | VO "...since the second of February, 2025." |
| 6 | 56-72 | 30.0-38.6 | Prohibited practices board | Forest room, walnut-framed felt board, gold plate "Art. 5 · Prohibited practices", three clay cards: royal Social scoring (people with star ratings), violet Harmful manipulation (puppet on strings), teal Untargeted face scraping (faces into a funnel and database) | each card pops when named; a red "Banned" seal slams onto it (b62.5, b66.5, b70.5) | camera drops to the desk | VO "So, what's on the banned list?" + the three names |
| 7 | 72-76 | 38.6-40.7 | Case file | Orange case file on a sloped charcoal stand that faces the camera: "File: Prohibited AI practices / EU AI Act · Article 5"; the cards fly in and the lid closes | lid slams b74.7; Stella pats it | rise to the sign-off | VO "That's Article 5, filed." |
| 8 | 76-82 | 40.7-44.0 | Sign-off | Navy stage, two-step podium: "A compliant system" / "is a happy system." ("happy" in gold); Stella in her ring with a ticked checklist to the right | podium rises, words bounce in with the line | Niticore nameplate pops onto the podium | VO "Remember: a compliant system..." |
| 9 | 82-88 | 44.0-47.1 | End card | Niticore nameplate on the podium face; footer "EU AI Act · Module 2 · Article 5"; Stella waves | slow push-in, hold | end | marimba button, bell |

Longest gap without a new event: beats 19-27 (cabinet build, 4.3 s), covered by the arrow growing and Stella's move.

## Transitions (round 3)

`timeline.json` inserts a designed transition at every section change. The film is now 96 beats (51.4 s), and `score.py` and the hit list are mapped onto the same timeline.

| from → to | style |
|---|---|
| ID card → cabinet | gold-rimmed clay star opens from the centre and turns as it grows |
| top drawer → "Unacceptable risk" file | clay bands sweep up: gold, crimson, navy |
| file → calendar | bands sweep down: gold, crimson, plum |
| calendar → board | bands sweep left: gold, emerald, forest |
| board → desk | bands sweep down: gold, orange, walnut |
| desk → sign-off | gold star again, bookending the film |

In every transition the camera leans into the wipe on the outgoing scene and settles into the next one. The title → ID card change stays the in-set move: the podium sinks while Stella hops forward.
