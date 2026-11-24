# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""Score + Stella's voice edit for "EU AI Act, Article 5" (clay bureau explainer).

    MOTION_REEL_SKILL=<skill> VOICE=af_heart uv run --python 3.12 eu-ai-act-art5/audio/score.py

112 BPM, 4/4 swing, F major. 88 story beats; timeline.json inserts the designed transitions
(98 film beats = 52.5 s). Everything below is placed in story beats and mapped with F(). A retro cartoon office tune: marimba, vibes,
walking upright bass, brushes and finger snaps. The evidence board (b56-72) turns to D minor
pizzicato; the file closing (b72) resolves home to F.

Reads  audio/vo/<VOICE>/pNN.wav (Kokoro takes, one per line of script.txt; tts.py)
Writes audio/music.wav, audio/vo.wav, beats.json, lipsync.json
"""
import json
import os
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import uniform_filter1d


def _skill_dir():
    if os.environ.get("MOTION_REEL_SKILL"):
        return Path(os.environ["MOTION_REEL_SKILL"])
    found = sorted((Path.home() / ".claude/plugins").glob("**/skills/motion-reel/scripts/dsp.py"))
    if found:
        return found[-1].parent.parent
    sys.exit("set MOTION_REEL_SKILL to the folder that holds the motion-reel SKILL.md")


sys.path.insert(0, str(_skill_dir() / "scripts"))
from dsp import *  # noqa: E402,F403

HERE = Path(__file__).resolve().parent
FILM = HERE.parent
BPM = 112
BEAT = 60 / BPM
TL = json.loads((FILM / "timeline.json").read_text())
TRS = TL["transitions"]


def F(s):
    """story beat -> film beat (the same map as film.js toFilm)"""
    off = 0.0
    for tr in TRS:
        a0, b1, L = tr["a0"], tr["b1"], tr["L"]
        if s <= a0:
            return s + off
        if s < b1:
            return a0 + off + (s - a0) / (b1 - a0) * L
        off += L - (b1 - a0)
    return s + off


def Finv(f):
    """film beat -> story beat (inside a transition the story is slowed, so chords hold)"""
    off = 0.0
    for tr in TRS:
        a0, b1, L = tr["a0"], tr["b1"], tr["L"]
        fs = a0 + off
        if f < fs:
            return f - off
        if f < fs + L:
            return a0 + (f - fs) / L * (b1 - a0)
        off += L - (b1 - a0)
    return f - off


NB = int(round(F(TL["storyBeats"])))
DUR = NB * BEAT
N = int(SR * DUR)
VOICE = os.environ.get("VOICE", "af_heart")
seed(20261118)


def T(b):
    return b * BEAT


SWING = 0.16  # the off-beat eighth lands at b + 0.5 + SWING/2 (a light shuffle)


def sw(b):
    return b + (SWING / 2 if abs((b % 1) - 0.5) < 1e-6 else 0)


# ---------------------------------------------------------------- instruments

def marimba(note, length=0.5, gain=1.0):
    n = int(length * SR)
    t = tvec(n)
    f = hz(note)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.32)
    x += 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.05)
    x += 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / 0.012)
    return x * (1 - np.exp(-t / 0.0015)) * np.clip((length - t) / 0.03, 0, 1) * gain


def vibes(notes, length):
    n = int(length * SR)
    t = tvec(n)
    trem = 1 - 0.28 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.2 * t))
    x = sum(np.sin(2 * np.pi * hz(nt) * t) + 0.18 * np.sin(2 * np.pi * hz(nt) * 4 * t) * np.exp(-t / 0.15)
            for nt in notes)
    return x / len(notes) * np.exp(-t / 1.4) * (1 - np.exp(-t / 0.004)) * trem * np.clip((length - t) / 0.08, 0, 1)


def upright(note, length):
    n = int(length * SR)
    t = tvec(n)
    f = hz(note)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.08)
    x += filt(rng.standard_normal(n) * np.exp(-t / 0.01), "bandpass", [200, 900]) * 0.4
    return np.tanh(1.3 * x) * np.exp(-t / 0.55) * (1 - np.exp(-t / 0.004)) * np.clip((length - t) / 0.03, 0, 1)


def pizz(note, length=0.28):
    return ks_pluck(hz(note), length, bright=0.45, buzz=0.0)


def brush(accent=1.0):
    n = int(0.22 * SR)
    t = tvec(n)
    x = filt(rng.standard_normal(n), "bandpass", [1800, 9000]) * np.exp(-t / 0.07) * accent
    return x * (1 - np.exp(-t / 0.01))


def snap():
    n = int(0.12 * SR)
    t = tvec(n)
    x = filt(rng.standard_normal(n), "bandpass", [1500, 3800]) * np.exp(-t / 0.018)
    x += 0.4 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.01)
    return x * (1 - np.exp(-t / 0.0004))


def soft_kick():
    n = int(0.35 * SR)
    t = tvec(n)
    f = 55 + 70 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * (1 - np.exp(-t / 0.001))


# ---------------------------------------------------------------- Stella's lines on the grid

# (take index, beat the speech onset lands on, caption)
LINES = [
    (0, 1.0, "Welcome to Article 5 of the EU AI Act: prohibited AI practices."),
    (1, 12.0, "I'm Stella the Standard, from the Bureau of Compliance."),
    (2, 19.0, "The EU AI Act sorts AI into four levels of risk."),
    (3, 27.0, "Minimal."),
    (4, 29.0, "Limited."),
    (5, 31.0, "High."),
    (6, 33.0, "And right at the top... unacceptable."),
    (7, 39.0, "Unacceptable risk isn't managed. It's banned outright."),
    (8, 47.0, "That rule has applied since the second of February, 2025."),
    (9, 56.5, "So, what's on the banned list?"),
    (10, 60.0, "Social scoring."),
    (11, 63.5, "Harmful manipulation."),
    (12, 67.5, "Untargeted face scraping."),
    (13, 72.5, "That's Article 5, filed."),
    (14, 77.0, "Remember: a compliant system is a happy system!"),
]


def build_vo():
    vo = np.zeros(N + SR * 2)
    placed = []
    for k, beat, text in LINES:
        y, _ = librosa.load(HERE / "vo" / VOICE / f"p{k:02d}.wav", sr=SR, mono=True)
        hop = int(SR * 0.005)
        rms = librosa.feature.rms(y=y, frame_length=hop * 4, hop_length=hop)[0]
        db = 20 * np.log10(rms + 1e-9) - 20 * np.log10(rms.max())
        loud = np.nonzero(db > -35)[0]
        on = max(0.0, loud[0] * 0.005 - 0.02)
        off = min(len(y) / SR, loud[-1] * 0.005 + 0.06)
        seg = y[int(on * SR):int(off * SR)].copy()
        fo = int(0.02 * SR)
        seg[-fo:] *= np.linspace(1, 0, fo)
        fb = F(beat)
        s = int(round(T(fb) * SR))
        vo[s:s + len(seg)] += seg
        placed.append({"p": k, "beat": round(fb, 3), "t0": round(T(fb), 3), "t1": round(T(fb) + len(seg) / SR, 3),
                       "text": text})
    print(f"VO edit ({VOICE}):")
    for a, b in zip(placed, placed[1:] + [{"t0": DUR}]):
        gap = b["t0"] - a["t1"]
        print(f"  b{a['beat']:5.1f} {a['t0']:6.2f}-{a['t1']:6.2f}  gap {gap * 1000:+6.0f} ms  {a['text']}"
              + ("  OVERLAP" if gap < 0 else ""))
    return vo[:N], placed


def compress(x, thresh_db=-22, ratio=3.0, attack=0.004, release=0.08, makeup_db=4):
    e = env_follow(x, attack, release)
    over = np.maximum(20 * np.log10(e + 1e-9) - thresh_db, 0)
    return x * 10 ** ((-over * (1 - 1 / ratio) + makeup_db) / 20)


def vo_chain(x):
    x = filt(x, "highpass", 90, 2)
    x = peq(x, 250, -2.0, 1.0)
    x = peq(x, 3000, 3.0, 0.9)
    x = peq(x, 9000, 2.0, 0.7)
    return compress(x)


# ---------------------------------------------------------------- the score

def main():
    drums, bass, music, fx = (Bus(DUR, BPM) for _ in range(4))
    vo, phrases = build_vo()

    # harmony per bar start (beat): F6 Dm7 Gm7 C7 turnaround; board scene in D minor
    F6, Dm7, Gm7, C7 = ["F3", "A3", "C4", "D4"], ["D3", "F3", "A3", "C4"], ["G3", "Bb3", "D4", "F4"], ["C3", "E3", "Bb3", "D4"]
    Bb, A7, Dm = ["Bb2", "D3", "F3", "A3"], ["A2", "C#3", "G3", "E4"], ["D3", "F3", "A3", "D4"]
    roots = {"F6": "F", "Dm7": "D", "Gm7": "G", "C7": "C", "Bb": "Bb", "A7": "A", "Dm": "D"}
    chords = {"F6": F6, "Dm7": Dm7, "Gm7": Gm7, "C7": C7, "Bb": Bb, "A7": A7, "Dm": Dm}
    def chord_story(sb):
        bar = int(sb // 4)
        b = bar * 4
        if 56 <= b < 72:
            return ["Dm", "Dm", "Bb", "A7"][bar % 4]
        if b >= 84:
            return "F6"
        return ["F6", "Dm7", "Gm7", "C7"][bar % 4]

    def chord_at(b):  # film beat -> its story bar's chord (held through a transition)
        return chord_story(Finv(b) + 1e-6)

    STOPS = [(F(35.5), F(37.0)), (F(45.0), F(47.0))]   # drama: "...unacceptable." and "banned outright" land in silence

    def stopped(b):
        return any(a <= b < z for a, z in STOPS)

    # ---- rhythm: soft kick on 1 & 3, snaps on 2 & 4, swung brushes all through (the grid source)
    for b in range(0, NB - 4):
        if stopped(b):
            continue
        if b % 2 == 0:
            drums.add(soft_kick(), b, 0.55 if b >= 4 else 0.35)
        else:
            drums.add(snap(), b, 0.45, pan=0.15)
        if b >= 4:
            drums.add(brush(0.8), b, 0.18, pan=-0.2)
            if not stopped(b + 0.5):
                drums.add(brush(0.5), sw(b + 0.5), 0.12, pan=-0.25)
    drums.add(soft_kick(), F(84), 0.6)

    # ---- walking bass from b4: root, third/fifth, approach note
    scale_f = ["F", "G", "A", "Bb", "C", "D", "E"]
    for b in range(4, NB - 4):
        if stopped(b):
            continue
        c = chord_at(b)
        notes = chords[c]
        root = roots[c]
        pos = b % 4
        if pos == 0:
            nt = root + "2"
        elif pos == 1:
            nt = notes[1][:-1] + "2"
        elif pos == 2:
            nt = notes[2][:-1] + "2"
        else:
            nxt = roots[chord_at(b + 1)]
            nt = scale_f[(scale_f.index(nxt.replace("#", "")) + 1) % 7] + "2" if nxt in scale_f else nxt + "2"
        bass.add(upright(nt, BEAT * 0.9), b, 0.55)
    bass.add(upright("F2", T(3.5)), F(84), 0.6)

    # ---- vibes comp: off-beat swung chord stabs (bar's beat 1.5 and 3.5), sustained in the intro
    music.add(vibes(F6, T(4)), 0, 0.30)
    music.add(vibes(Dm7, T(4)), 4, 0.26)
    music.add(vibes(Gm7, T(2)), 8, 0.26)
    music.add(vibes(C7, T(2)), 10, 0.26)
    for b in range(12, NB - 4):
        for off in (1.5, 3.5):
            bb = b + off
            if b % 4 or stopped(bb) or (F(56) <= bb < F(72)):
                continue
            music.add(vibes(chords[chord_at(bb)], BEAT * 0.9), sw(bb), 0.14, pan=0.2)
    music.add(vibes(F6 + ["A4"], T(4)), F(84), 0.3)

    # ---- marimba hooks between Stella's lines (never under a word)
    hook = [("C5", 0), ("D5", 0.5), ("F5", 1.0), ("A5", 1.5), ("G5", 2.5), ("F5", 3.0)]
    for nt, o in hook:
        music.add(marimba(nt, 0.45), sw(10.5 + o) if o % 1 else 10.5 + o, 0.30, pan=-0.2)
    for nt, b in (("A5", 17.75), ("G5", 18.0), ("F5", 18.5),
                  ("F5", 26.0), ("A5", 26.5),
                  ("C5", 27.75), ("D5", 29.75), ("E5", 31.75), ("F5", 32.5), ("C6", 32.75),
                  ("A5", 54.5), ("Bb5", 55.0), ("C6", 55.5),
                  ("F5", 81.0), ("A5", 81.5), ("C6", 82.0), ("F6", 82.5)):
        music.add(marimba(nt, 0.5), F(b), 0.28, pan=-0.2)
    # the risk ladder climbs: one rising marimba note per drawer
    for nt, b in (("F4", 27.0), ("A4", 29.0), ("C5", 31.0)):
        music.add(marimba(nt, 0.8), F(b), 0.22, pan=0.1)

    # ---- evidence board (b56-72): detective pizzicato in D minor
    for b in np.arange(F(56), F(72), 0.5):
        c = chords[chord_at(b)]
        nt = c[int(b * 2) % 4]
        nt = nt[:-1] + str(int(nt[-1]) + 1)
        music.add(pizz(nt, 0.25), sw(b) if (b % 1) else b, 0.16 if (b % 1) else 0.22, pan=0.25)

    # ---- transitions
    fx.add(whoosh(T(1.0), 400, 3000), 11.0, 0.18)        # into Stella
    fx.add(riser(T(2.5)), F(33.0), 0.12)                 # up to the top drawer
    fx.add(sub_drop(1.2), F(35.5), 0.35)                 # "unacceptable."
    # the section wipes get their whooshes from film.js's hit list (sfx.mjs)

    kick_t = [T(b) for b in range(4, NB - 4, 2) if not stopped(b)]
    pump = sidechain(kick_t, bass.x.shape[1], 0.18, 0.12)
    ir = reverb_ir(1.6, 0.45)
    wet_src = music.x * 0.4 + drums.x * 0.08 + fx.x * 0.15
    wet = np.stack([signal.fftconvolve(wet_src[c], ir[c])[: wet_src.shape[1]] for c in range(2)])
    bed = drums.x * 0.8 + bass.x * pump * 0.85 + music.x * 0.8 + fx.x * 0.7 + wet * 0.4
    bed = np.stack([filt(ch, "highpass", 30) for ch in bed])[:, :N]
    bed /= np.abs(bed).max() + 1e-9
    bed *= 0.5
    fade = int(0.6 * SR)
    bed[:, -fade:] *= np.linspace(1, 0, fade) ** 2
    sf.write(HERE / "music.wav", bed.T, SR, subtype="PCM_24")

    grid_src = drums.x[:, :N].mean(axis=0)
    grid = measure_beats(grid_src, SR, BPM, n_beats=NB + 1)
    grid.update({"designed_bpm": BPM, "downbeats": grid["beats"][::4],
                 "sections": {k: [round(F(a), 3), round(F(b), 3)] for k, (a, b) in {
                     "title": (0, 12), "stella": (12, 19), "cabinet": (19, 39), "unacceptable": (39, 47),
                     "calendar": (47, 56), "board": (56, 72), "file": (72, 76), "signoff": (76, 82),
                     "end": (82, 88)}.items()},
                 "timeline": "timeline.json (story beats -> film beats)",
                 "source": "audio/score.py drum stem, librosa beat_track + onsets, linear fit"})
    (FILM / "beats.json").write_text(json.dumps(grid, indent=1))
    print(f"beats: {grid['bpm']} bpm, offset {grid['offset'] * 1000:.1f} ms, "
          f"{grid['fit_inliers']}/{len(grid['detected'])} inliers, fit rms {grid['fit_residual_ms']} ms")

    v = vo_chain(vo)
    v = v / (np.abs(v).max() + 1e-9) * 0.7
    sf.write(HERE / "vo.wav", np.stack([v, v]).T, SR, subtype="PCM_24")
    hop = SR // 100
    fr = np.sqrt(np.maximum(uniform_filter1d(v ** 2, hop * 3)[::hop], 0))
    op = np.clip((20 * np.log10(fr + 1e-9) - 20 * np.log10(fr.max()) + 40) / 34, 0, 1)
    sm, e = np.zeros_like(op), 0.0
    for i, x in enumerate(op):
        e += (x - e) * (0.75 if x > e else 0.4)
        sm[i] = e
    (FILM / "lipsync.json").write_text(json.dumps({
        "rate": 100, "voice": VOICE, "open": [round(float(x), 3) for x in sm], "visemes": [],
        "phrases": phrases}, ensure_ascii=False))
    print(f"lipsync: {len(phrases)} phrases")


if __name__ == "__main__":
    main()
