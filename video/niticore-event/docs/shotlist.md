# Niticore at AI Everything Abu Dhabi: social cut, shot list
35.9 s · 112 bpm · 67 beats (1 beat = 0.536 s) · 30 fps · formats: 9:16 (Instagram Reels / Stories),
4:5 (Instagram and LinkedIn feed), 1:1 (X and LinkedIn), 16:9 (X and LinkedIn landscape).
Built on the launch film's engine (video/niticore-flow): particles, the design-system components as 3D
boards, bloom. Copy only from niticore-website-v2 (`src/content/event.json`, the /announcements page and
its visit pass). Sound-off first: every message is on screen, and the narrator (Kokoro af_heart, as in the launch film) says each scene's words as they appear.

| # | beats | time | on screen | voice |
|---|-------|------|-----------|-------|
| 1 | 0-4 | 0:00-0:02 | a spark unfurls into ribbons; the niticore wordmark builds letter by letter | — |
| 2 | 4-10 | 0:02-0:05 | "We're at AI Everything **Abu Dhabi**." · 6–7 October 2026 · ADNEC Centre; the organiser's logo on its white plate; a globe of light turns to the UAE and a pin drops on Abu Dhabi (chip with the UAE flag) | "We're at AI Everything Abu Dhabi." |
| 3 | 10-18 | 0:05-0:10 | "Come and see Niticore **live** at our stand." The violet stand tile (the site's) on a floor of light: "Find us at stands", H3-P019 + H3-P020 flipping in like a departure board | "Come and see Niticore live, at our stand." |
| 4 | 18-26 | 0:10-0:14 | "Take the free **5-minute** readiness diagnostic." Readiness diagnostic panel: Governance Readiness ring fills, "Free" and "5 minutes", the green "Take the readiness scan" button is pressed | "Take the free, five-minute readiness diagnostic." |
| 5 | 26-34 | 0:14-0:18 | "Or sit down with our team for a guided **walkthrough** of the platform." The Governance Health dashboard builds itself | "Or sit down with our team for a guided walkthrough of the platform." |
| 6 | 34-45 | 0:18-0:24 | The visit pass: "Meet Niticore at AI Everything **Abu Dhabi**."; Dates 6–7 October 2026 (+ organiser's logo); Hours Tue 6 Oct 11:00–18:00, Wed 7 Oct 09:00–18:00, Abu Dhabi time (GST); Venue ADNEC Centre, Abu Dhabi (+ flag); the stand tile; on 16:9 the "Take the readiness scan" button | "Meet Niticore on the sixth and seventh of October, at ADNEC Centre, Abu Dhabi." |
| 7 | 45-67 | 0:24-0:36 | The niticore-sub wordmark at the top; "See you at stands"; H3-P019 + H3-P020 in large type, each part flipping in as it is spoken; www.niticore.ai | "Niticore." / "AI governance, from policy to proof." / "See you at stands" / "H3," / "P019," / "and H3," / "P020." |

Layouts: 16:9 puts the words on the left and the picture on the right; 9:16, 4:5 and 1:1 put the words
on top and the picture under them (9:16 keeps clear of the Reels UI). Sentence case everywhere.
Render: `bash niticore-event/tools/render_all.sh` from `video/` (frames on the GPU, then H.264), then the
mix (`sfx.mjs`, `mix.mjs --no-mux`) and the mux per format.
