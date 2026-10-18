# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""Niticore for TIME Medical: score + voice-over edit. 96 BPM, 4/4, 84 beats = 52.5 s, D major.

    MOTION_REEL_SKILL=<skill> uv run niticore-time-medical/audio/score.py

The launch film's family (niticore-flow): D major, bells, plucks, pads. Song form (beats): 0-8.2 the logo (a spark, air, a pulse that builds)  ·  8.4-19.6 two tracks (a light
groove)  ·  19.6-28 the clock (ticks over a held minor chord)  ·  28-37.2 the bigger risk (B minor, tense,
thin)  ·  37.4-39 the floor drops out  ·  39-54.4 Niticore (the chorus and its hook)  ·  54.4-64.6 bigger than
compliance (lifted)  ·  64.6-72.8 the question (a breath)  ·  74.2 the resolve on the end card.
Voice: audio/vo/af_heart/pNN.wav (tts.py at speed 1.0; p13 and p14 are the launch film's own end takes),
each phrase's speech onset placed on a beat (PLACE). Writes audio/music.wav, audio/vo.wav, audio/vo.json,
audio/vo_env.json and beats.json.
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, str(Path(os.environ["MOTION_REEL_SKILL"]) / "scripts"))
import dsp  # noqa: E402
from dsp import SR, Bus, bass_note, clap, crash, filt, hat, keys, kick, ks_pluck, hz, midi, \
    note_name, pad_chord, peq, pluck, reverb_ir, riser, sidechain, sub_drop  # noqa: E402

HERE = Path(__file__).resolve().parent
FILM = HERE.parent
BPM, BEATS = 96.0, 84
BEAT = 60 / BPM
DUR = BEATS * BEAT
VOICE = "af_heart"
PLACE = [(0, 1.0), (1, 5.75), (2, 9.25), (3, 11.5), (4, 14.75), (5, 20.5), (6, 29.0), (7, 39.0), (8, 42.5),
         (9, 55.5), (10, 58.25), (11, 61.75), (12, 66.0), (13, 74.6), (14, 77.0)]


def T(b):
    return b * BEAT


CH = {
    "D": ["D3", "A3", "D4", "F#4", "A4"], "A": ["A2", "E3", "A3", "C#4", "E4"],
    "Bm": ["B2", "F#3", "B3", "D4", "F#4"], "G": ["G2", "D3", "G3", "B3", "D4"],
    "Em": ["E3", "B3", "E4", "G4", "B4"], "F#m": ["F#2", "C#3", "F#3", "A3", "C#4"],
}
ROOT = {"D": "D2", "A": "A1", "Bm": "B1", "G": "G1", "Em": "E2", "F#m": "F#1"}
CHORUS = ["D", "A", "Bm", "G"]
SHADOW = ["Bm", "G", "Em", "F#m"]
HOOK = {
    "D": [(0, "F#5", 1), (1, "A5", 0.5), (1.5, "B5", 1), (2.5, "A5", 1.5)],
    "A": [(0, "E5", 1), (1, "C#5", 0.5), (1.5, "E5", 1), (2.5, "A5", 1.5)],
    "Bm": [(0, "F#5", 1), (1, "D5", 0.5), (1.5, "B4", 1), (2.5, "D5", 1.5)],
    "G": [(0, "D5", 0.5), (0.5, "E5", 0.5), (1, "F#5", 1), (2, "E5", 2)],
}


def vo_chain(y):
    y = filt(y, "highpass", 75)
    y = peq(y, 180, 2.0, 0.8)
    y = peq(y, 3200, 2.5, 1.0)
    y = peq(y, 10000, 2.0, 0.7)
    env = dsp.env_follow(np.abs(y), 0.005, 0.12) + 1e-6
    lvl = 20 * np.log10(env / (np.abs(y).max() + 1e-9))
    gr = np.where(lvl > -20, (lvl + 20) * (1 - 1 / 3), 0)
    y = y * 10 ** (-gr / 20)
    return y / (np.abs(y).max() + 1e-9)


def speech_onset(y, sr):
    hop = int(0.01 * sr)
    rms = np.sqrt(np.convolve(y ** 2, np.ones(hop) / hop, mode="same"))[::hop]
    thr = rms.max() * 10 ** (-36 / 20)
    on = int(np.argmax(rms > thr))
    off = len(rms) - int(np.argmax(rms[::-1] > thr))
    return on * hop / sr, off * hop / sr


def build_vo():
    n = int(DUR * SR) + SR * 2
    vo = np.zeros(n)
    placed, prev_end = [], 0
    lines = [l.strip() for l in (HERE / "script.txt").read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    for idx, beat in PLACE:
        y, sr = sf.read(HERE / "vo" / VOICE / f"p{idx:02d}.wav")
        on, off = speech_onset(y, sr)
        y = signal.resample_poly(y, SR, sr)
        a, b = int(on * SR), int(off * SR) + int(0.08 * SR)
        seg = y[max(0, a - int(0.03 * SR)):b]
        fade = int(0.04 * SR)
        seg[-fade:] *= np.linspace(1, 0, fade)
        start = T(beat) - 0.03
        s = int(start * SR)
        vo[s:s + len(seg)] += seg
        end = start + len(seg) / SR
        gap = start - prev_end
        print(f"p{idx:02d} @b{beat:<5} {start:6.2f}-{end:6.2f}s (b{end / BEAT:5.1f})  gap {gap:+5.2f}s{'  OVERLAP' if gap < 0 else ''}  {lines[idx]}")
        placed.append({"i": idx, "beat": beat, "t0": round(T(beat), 3), "t1": round(end, 3), "text": lines[idx]})
        prev_end = end
    vo = vo_chain(vo[: int(DUR * SR)])
    hop = SR // 100
    rms = np.sqrt(np.convolve(vo ** 2, np.ones(int(0.03 * SR)) / int(0.03 * SR), mode="same"))[::hop]
    rms = np.clip(rms / (np.percentile(rms[rms > 1e-4], 98) + 1e-9), 0, 1)
    (HERE / "vo_env.json").write_text(json.dumps({"rate": 100, "env": [round(float(v), 3) for v in rms]}))
    st = np.stack([vo, vo])
    ir = reverb_ir(0.9, 0.22, 7)
    wet = np.stack([signal.fftconvolve(st[c], ir[c])[: st.shape[1]] for c in range(2)])
    out = st + 0.11 * wet
    out *= 10 ** (-1 / 20) / (np.abs(out).max() + 1e-9)
    sf.write(HERE / "vo.wav", out.T, SR, subtype="PCM_24")
    (HERE / "vo.json").write_text(json.dumps(placed, indent=1))
    return placed


def groove_bar(b0, c, drums, bass, arp, hi=False, hook=None, lead=None, stop=None):
    for s in range(16):
        b = b0 + s * 0.25
        if stop is not None and b >= stop:
            break
        if s % 4 == 0:
            drums.add(kick(), b, 0.9)
        if s in (4, 12):
            drums.add(clap(), b, 0.3, pan=0.05)
        if s % 4 == 2:
            drums.add(hat(open_=hi), b, 0.12 if hi else 0.09, pan=0.25)
        if s % 2 == 0:
            bass.add(bass_note(ROOT[c] if s % 4 == 0 else note_name(midi(ROOT[c]) + 12), BEAT / 2 * 0.85, 1000), b, 0.5)
        pool = [CH[c][2], CH[c][3], CH[c][4], note_name(midi(CH[c][3]) + 12)]
        arp.add(pluck([pool[[0, 2, 1, 3, 2, 1, 3, 0][s % 8]]], 0.14, 2400 if hi else 1900), b, 0.12 if hi else 0.1, pan=0.35 * (1 if s % 2 else -1))
    if hook is not None:
        for off, nt, ln in HOOK[c]:
            if stop is None or b0 + off < stop:
                lead.add(keys([nt], ln * BEAT * 1.6), b0 + off, 0.2)
                if hi:
                    lead.add(pluck([nt], ln * BEAT * 0.9, 3200), b0 + off, 0.1, pan=0.2)


def main():
    dsp.seed(20261012)
    drums, bass, pads, arp, lead, piano, fx = (Bus(DUR + 3, BPM) for _ in range(7))

    # ---------------- 0-8.2: the spark, the logo, then a pulse that builds under "two tracks"
    fx.add(sub_drop(1.6, 60, 28), 0, 0.45)
    drums.add(kick(), 1.05, 0.8)
    fx.add(crash(2.0), 1.05, 0.14)
    pads.add(pad_chord(["D3", "A3", "E4", "F#4", "A4"], T(8.4) + 0.6, (400, 2400), attack=1.0, release=1.0), 0, 0.32)
    arpeg = ["D4", "A4", "E5", "F#5", "A5", "F#5", "E5", "A4"]
    for i, b in enumerate(np.arange(2, 8.5, 0.5)):
        piano.add(keys([arpeg[i % 8]], 1.4), b, 0.2 + 0.06 * (i % 2 == 0))
    for b in np.arange(5.5, 8.5, 0.5):
        bass.add(bass_note("D2", BEAT / 2 * 0.7, 500 + 120 * (b - 5.5)), b, 0.3 + 0.03 * (b - 5.5))
    for b in np.arange(6.5, 8.5, 0.25):
        drums.add(hat(), b, 0.04 + 0.012 * (b - 6.5), pan=0.25)
    fx.add(riser(T(2.2)), 6.2, 0.2)

    # ---------------- 8.4-19.6: two tracks: a light groove, a bell on each market
    for b0 in (8.4, 12.4, 16.4):
        c = CHORUS[int((b0 - 8.4) // 4)]
        pads.add(pad_chord(CH[c], T(4) + 0.3, (1100, 2200), attack=0.06, release=0.4), b0, 0.28)
        for s in range(16):
            b = b0 + s * 0.25
            if b >= 19.4:
                break
            if s in (0, 8):
                drums.add(kick(soft=True), b, 0.7)
            if s in (4, 12):
                drums.add(clap(tight=True), b, 0.16, pan=0.05)
            if s % 4 == 2:
                drums.add(hat(), b, 0.07, pan=0.25)
            if s % 4 == 0:
                bass.add(bass_note(ROOT[c], BEAT * 0.8, 800), b, 0.42)
            if s % 2 == 0:
                pool = [CH[c][2], CH[c][3], CH[c][4], note_name(midi(CH[c][3]) + 12)]
                arp.add(pluck([pool[[0, 2, 1, 3][(s // 2) % 4]]], 0.14, 1800), b, 0.075, pan=0.35 * (1 if s % 4 else -1))
    fx.add(crash(1.6), 8.4, 0.16)
    fx.add(riser(T(1.6)), 18.2, 0.18)

    # ---------------- 19.6-28: the clock: ticks over a held minor chord
    fx.add(sub_drop(1.6, 62, 28), 20.4, 0.4)
    drums.add(kick(), 20.4, 0.75)
    pads.add(pad_chord(CH["Bm"], T(4) + 0.4, (900, 1300), attack=0.2, release=0.5), 20.4, 0.28)
    pads.add(pad_chord(CH["G"], T(3.6) + 0.4, (1100, 1700), attack=0.3, release=0.5), 24.4, 0.28)
    for b in np.arange(20.9, 27.9, 1):
        drums.add(hat(), b, 0.05, pan=0.2)
    for b in (22.4, 24.4, 26.4):
        bass.add(bass_note(ROOT["Bm" if b < 24.4 else "G"], T(1.8), 500), b, 0.36)
        drums.add(kick(soft=True), b, 0.55)

    # ---------------- 28-37.2: the bigger risk: the shadow (B minor, tense); 37.2-39 the floor drops out
    for bar, b0 in enumerate((28.4, 32.4)):
        c = SHADOW[bar]
        pads.add(pad_chord(CH[c][:4] + [note_name(midi(CH[c][3]) + 1)], T(4.4) + 0.3, (500, 900), attack=0.3, release=0.4), b0, 0.32)
    for b in np.arange(28.4, 37.2, 0.5):
        c = SHADOW[min(1, int((b - 28.4) // 4))]
        bass.add(bass_note(ROOT[c], 0.2, 600), b, 0.46 if (b * 2) % 2 == 0 else 0.3)
    for b in np.arange(28.4, 37.2, 0.25):
        drums.add(hat(), b, 0.045 if (b * 4) % 2 else 0.07, pan=0.25)
    for b in np.arange(28.4, 37.2, 2):
        drums.add(kick(), b, 0.6)
    fx.add(sub_drop(1.2, 58, 30), 29.0, 0.3)
    fx.add(riser(T(2.4)), 36.6, 0.24)

    # ---------------- 39-54.4: Niticore: the chorus and its hook; 54.4-64.6 lifted (bigger than compliance)
    fx.add(sub_drop(1.6, 72, 28), 39.0, 0.55)
    drums.add(kick(), 39.0, 1.0)
    fx.add(crash(2.2), 39.0, 0.26)
    piano.add(keys(["D5", "A4", "F#4", "D4"], 3.0), 39.1, 0.3)
    for i, b0 in enumerate(np.arange(39.0, 64.6, 4)):
        c = CHORUS[i % 4]
        hi = b0 >= 55.0
        pads.add(pad_chord(CH[c], T(4) + 0.3, (1700, 3400) if hi else (1500, 3000), attack=0.04, release=0.4), b0, 0.3)
        groove_bar(b0, c, drums, bass, arp, hi=hi, hook=(b0 >= 43.0), lead=lead, stop=64.6)
    fx.add(crash(2.0), 55.0, 0.22)
    fx.add(riser(T(1.6)), 63.0, 0.2)

    # ---------------- 64.6-72.8: the question: a breath, pads and a slow piano
    for b0, c in ((65.0, "Bm"), (69.0, "G")):
        pads.add(pad_chord(CH[c], T(4) + 0.5, (900, 1600), attack=0.3, release=0.6), b0, 0.3)
        bass.add(bass_note(ROOT[c], T(3.6), 450), b0, 0.3)
    for b, nt in ((66.0, "F#5"), (67.0, "D5"), (68.0, "B4"), (69.0, "D5"), (70.0, "E5"), (71.0, "D5")):
        piano.add(keys([nt], 1.6), b, 0.2)
    fx.add(riser(T(2.2)), 72.0, 0.26)
    fx.add(crash(1.6)[::-1] * 0.9, 74.2 - 1.6 / BEAT, 0.24)

    # ---------------- 74.2: the resolve (the end card), as in the launch film
    fin = ["D3", "A3", "E4", "F#4", "A4"]
    pads.add(pad_chord(fin, T(9.8) + 1.0, (5200, 900), attack=0.004, release=1.5), 74.2, 0.55)
    piano.add(keys(["D5", "A4", "F#4", "D4"], 4.5), 74.2, 0.4)
    piano.add(keys(["E5", "A4"], 3.0), 77.0, 0.24)
    piano.add(keys(["F#5", "D5"], 3.5), 79.6, 0.22)
    drums.add(kick(), 74.2, 1.0)
    fx.add(crash(3.4), 74.2, 0.3)
    fx.add(sub_drop(2.2, 66, 26), 74.2, 0.6)
    bass.add(bass_note("D1", 2.8, 600), 74.2, 0.6)
    for b, nt in ((74.7, "A5"), (75.2, "D6"), (75.7, "F#6"), (76.6, "E6"), (77.1, "D6")):
        arp.add(keys([nt], 1.0), b, 0.09, pan=0.2 * np.sin(b * 2))
        arp.add(ks_pluck(hz(nt), 0.9, 0.5, 0.25), b, 0.035, pan=-0.2)

    N = int(DUR * SR)
    kick_t = [T(b) for b in np.arange(39.0, 64.6, 1)]
    pump = sidechain(kick_t, drums.x.shape[1], 0.35, 0.12)
    ir = reverb_ir(2.4, 0.7, 5)
    wsrc = pads.x * 0.5 + arp.x * 0.6 + lead.x * 0.5 + piano.x * 0.6
    wet = np.stack([signal.fftconvolve(wsrc[c], ir[c])[: wsrc.shape[1]] for c in range(2)])
    bed = drums.x * 0.9 + (bass.x * 0.85 + pads.x + arp.x + lead.x) * pump + piano.x + fx.x * 0.8 + wet * 0.55
    for x0, x1 in ((37.4, 38.95),):   # the stop before the drop
        a, b = int(T(x0) * SR), int(T(x1) * SR)
        bed[:, a:b] = fx.x[:, a:b] * 0.8 + wet[:, a:b] * 0.3
    bed = np.stack([filt(c, "highpass", 28) for c in bed])[:, :N]
    fade = int(1.6 * SR)
    bed[:, -fade:] *= np.linspace(1, 0, fade) ** 2
    bed *= 10 ** (-3 / 20) / (np.abs(bed).max() + 1e-9)
    sf.write(HERE / "music.wav", bed.T, SR, subtype="PCM_24")

    placed = build_vo()

    # the grid is the score's own (designed, not measured): a beat every 0.625 s from 0
    grid = {"bpm": BPM, "period": BEAT, "offset": 0.0, "beats": [round(i * BEAT, 5) for i in range(BEATS + 1)]}
    grid["downbeats"] = grid["beats"][::4]
    grid["sections"] = [{"name": n, "beat": bt} for n, bt in [("logo", 0), ("two tracks", 8.2), ("clock", 19.6), ("bigger risk", 28),
                                                               ("niticore", 39), ("outcomes", 54.4), ("question", 64.6), ("end", 74.2)]]
    grid["duration"] = DUR
    grid["designed_bpm"] = BPM
    grid["vo"] = placed
    grid["source"] = "niticore-time-medical/audio/score.py, 96 bpm, D major (the launch film's family)"
    (FILM / "beats.json").write_text(json.dumps(grid, indent=1))
    print(f"grid: {BPM} bpm, {BEATS} beats, {DUR:.2f} s")


if __name__ == "__main__":
    main()
