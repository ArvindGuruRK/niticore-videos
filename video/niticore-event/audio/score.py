# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""Score for the AI Everything Abu Dhabi social cut: 112 bpm, D major, 67 beats (~36 s), a voice on the end card.

    MOTION_REEL_SKILL=<skill> uv run niticore-event/audio/score.py

Same family as the launch film (niticore-flow): D major, bells, plucks and pads, but quicker for a
feed. A spark and a build (0-4), the drop as Abu Dhabi appears (4), a groove through the stand,
the readiness scan and the walkthrough (4-34), a lift for the visit pass (34-45), the resolve on
the logo (45). Writes audio/music.wav and beats.json.
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
from dsp import SR, Bus, bass_note, clap, crash, filt, hat, keys, kick, ks_pluck, hz, measure_beats, midi, \
    note_name, pad_chord, pluck, reverb_ir, riser, sidechain, sub_drop  # noqa: E402

HERE = Path(__file__).resolve().parent
FILM = HERE.parent
BPM, BEATS = 112.0, 67
VOICE = "af_heart"
# the narrator, each phrase's speech onset on a beat (the captions roll in on the same beats); the stand numbers with a slight pause inside each
PLACE = [(7, 4.4), (8, 10.4), (9, 18.4), (10, 26.3), (11, 34.8),   # the narrator, on each scene's words
         (0, 45.6), (1, 47.6), (2, 52.4), (3, 54.6), (4, 56.5), (5, 59.2), (6, 61.1)]
BEAT = 60 / BPM
DUR = BEATS * BEAT


def T(b):
    return b * BEAT


CH = {
    "D": ["D3", "A3", "D4", "F#4", "A4"], "A": ["A2", "E3", "A3", "C#4", "E4"],
    "Bm": ["B2", "F#3", "B3", "D4", "F#4"], "G": ["G2", "D3", "G3", "B3", "D4"],
}
ROOT = {"D": "D2", "A": "A1", "Bm": "B1", "G": "G1"}
PROG = ["D", "A", "Bm", "G"]
HOOK = {
    "D": [(0, "F#5", 1), (1, "A5", 0.5), (1.5, "B5", 1), (2.5, "A5", 1.5)],
    "A": [(0, "E5", 1), (1, "C#5", 0.5), (1.5, "E5", 1), (2.5, "A5", 1.5)],
    "Bm": [(0, "F#5", 1), (1, "D5", 0.5), (1.5, "B4", 1), (2.5, "D5", 1.5)],
    "G": [(0, "D5", 0.5), (0.5, "E5", 0.5), (1, "F#5", 1), (2, "E5", 2)],
}


def speech_onset(y, sr):
    hop = int(0.01 * sr)
    rms = np.sqrt(np.convolve(y ** 2, np.ones(hop) / hop, mode="same"))[::hop]
    thr = rms.max() * 10 ** (-36 / 20)
    on = int(np.argmax(rms > thr)); off = len(rms) - int(np.argmax(rms[::-1] > thr))
    return on * hop / sr, off * hop / sr


def build_vo():
    vo = np.zeros(int(DUR * SR) + SR * 2); placed = []
    lines = [l.strip() for l in (HERE / "script.txt").read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    for idx, beat in PLACE:
        y, sr = sf.read(HERE / "vo" / VOICE / f"p{idx:02d}.wav")
        on, off = speech_onset(y, sr)
        y = signal.resample_poly(y, SR, sr)
        a, b = int(on * SR), int(off * SR) + int(0.08 * SR)
        seg = y[max(0, a - int(0.03 * SR)):b]; fade = int(0.04 * SR); seg[-fade:] *= np.linspace(1, 0, fade)
        start = T(beat) - 0.03; s0 = int(start * SR); vo[s0:s0 + len(seg)] += seg
        placed.append({"i": idx, "beat": beat, "t0": round(T(beat), 3), "t1": round(start + len(seg) / SR, 3), "text": lines[idx]})
        print(f"p{idx:02d} @b{beat:<5} {start:6.2f}-{start + len(seg) / SR:6.2f}s  {lines[idx]}")
    vo = filt(vo[: int(DUR * SR)], "highpass", 75)
    vo /= np.abs(vo).max() + 1e-9
    st = np.stack([vo, vo]); ir = reverb_ir(0.9, 0.22, 7)
    wet = np.stack([signal.fftconvolve(st[c], ir[c])[: st.shape[1]] for c in range(2)])
    out = st + 0.11 * wet; out *= 10 ** (-1 / 20) / (np.abs(out).max() + 1e-9)
    sf.write(HERE / "vo.wav", out.T, SR, subtype="PCM_24")
    (HERE / "vo.json").write_text(json.dumps(placed, indent=1))


def main():
    dsp.seed(20261006)
    drums, bass, pads, arp, lead, piano, fx = (Bus(DUR + 3, BPM) for _ in range(7))

    # ---------------- 0-4: the spark and the build; the wordmark lands on 2
    fx.add(sub_drop(1.4, 64, 28), 0, 0.4)
    fx.add(riser(T(4)), 0, 0.3)
    arpeg = ["D5", "A5", "F#5", "A5", "E5", "A5", "F#5", "D6"]
    for i, b in enumerate(np.arange(0.5, 4, 0.25)):
        arp.add(pluck([arpeg[i % 8]], 0.1, 1400 + 500 * b), b, 0.04 + 0.02 * b, pan=0.3 * np.sin(b * 5))
    for b in (2.0, 3.0, 3.5):
        drums.add(kick(soft=True), b, 0.5)
    piano.add(keys(["D5", "A4", "F#4", "D4"], 2.0), 2.0, 0.26)
    fx.add(crash(1.6)[::-1] * 0.9, 4 - 1.6 / BEAT, 0.24)

    # ---------------- 4-45: the groove; 18 brings the hook, 34 lifts it for the visit pass
    def groove(b):
        return 4 <= b < 45

    for b0 in range(4, 45, 4):
        c = PROG[((b0 - 4) // 4) % 4]
        lift = b0 >= 34
        pads.add(pad_chord(CH[c], T(4) + 0.3, (1800, 3600) if lift else (1200, 2600), attack=0.04, release=0.4), b0, 0.3)
        if b0 >= 18:
            for off, nt, ln in HOOK[c]:
                if b0 + off < 45:
                    lead.add(keys([nt], ln * BEAT * 1.5), b0 + off, 0.18 if lift else 0.14)
                    if lift:
                        lead.add(pluck([nt], ln * BEAT * 0.9, 3400), b0 + off, 0.09, pan=0.2)
        for s in range(16):
            b = b0 + s * 0.25
            if not groove(b):
                continue
            if s % 4 == 0:
                drums.add(kick(), b, 0.9)
            if s in (4, 12):
                drums.add(clap(), b, 0.3, pan=0.05)
            if s % 2 == 1:
                drums.add(hat(open_=(s % 4 == 2)), b, 0.07 if s % 4 != 2 else 0.1, pan=0.25)
            if s % 2 == 0:
                bass.add(bass_note(ROOT[c] if s % 4 == 0 else note_name(midi(ROOT[c]) + 12), BEAT / 2 * 0.85, 1100), b, 0.5)
            pool = [CH[c][2], CH[c][3], CH[c][4], note_name(midi(CH[c][3]) + 12)]
            arp.add(pluck([pool[[0, 2, 1, 3, 2, 1, 3, 0][s % 8]]], 0.13, 2600 if lift else 2000), b, 0.11, pan=0.35 * (1 if s % 2 else -1))
    fx.add(sub_drop(1.6, 72, 28), 4, 0.55)
    drums.add(kick(), 4, 1.0)
    fx.add(crash(2.2), 4, 0.26)
    for b in (10, 18, 26):
        fx.add(crash(1.4), b, 0.14)
    fx.add(riser(T(2)), 32, 0.22)
    fx.add(crash(2.0), 34, 0.24)
    fx.add(riser(T(2)), 43, 0.24)

    # ---------------- 45: the resolve on the logo
    fin = ["D3", "A3", "E4", "F#4", "A4"]
    pads.add(pad_chord(fin, T(8) + 1.0, (5200, 1400), attack=0.004, release=1.2), 45, 0.5)
    # 52-63: where to find us: a soft pulse under the voice, then the last chord on the shine
    for b0, c in ((52, "G"), (56, "D"), (60, "A")):
        pads.add(pad_chord(CH[c], T(4) + 0.4, (1400, 2200), attack=0.2, release=0.5), b0, 0.26)
        bass.add(bass_note(ROOT[c], T(3.6), 500), b0, 0.3)
    for b in np.arange(52, 63, 1):
        drums.add(kick(soft=True), b, 0.34 if b % 2 == 0 else 0.0001)
        drums.add(hat(), b + 0.5, 0.035, pan=0.2)
    for b in np.arange(52, 63, 0.5):
        nt = ["D5", "A5", "F#5", "A5"][int(b * 2) % 4]
        arp.add(pluck([nt], 0.12, 1800), b, 0.03, pan=0.3 * np.sin(b * 3))
    pads.add(pad_chord(fin, T(4.5) + 1.6, (4800, 900), attack=0.01, release=1.5), 63.2, 0.5)
    piano.add(keys(["D5", "A4", "F#4", "D4"], 3.5), 63.2, 0.34)
    fx.add(crash(2.6), 63.2, 0.18)
    piano.add(keys(["D5", "A4", "F#4", "D4"], 4.0), 45, 0.4)
    piano.add(keys(["F#5", "D5"], 3.0), 47, 0.22)
    for b, nt in ((45.5, "A5"), (46, "D6"), (46.5, "F#6"), (47.5, "E6"), (48, "D6")):
        arp.add(keys([nt], 1.0), b, 0.1, pan=0.2 * np.sin(b * 2))
        arp.add(ks_pluck(hz(nt), 0.9, 0.5, 0.25), b, 0.04, pan=-0.2)
    drums.add(kick(), 45, 1.0)
    fx.add(crash(3.0), 45, 0.3)
    fx.add(sub_drop(2.0, 66, 26), 45, 0.55)
    bass.add(bass_note("D1", 2.6, 600), 45, 0.55)

    N = int(DUR * SR) + int(1.0 * SR)
    kick_t = [T(b) for b in np.arange(4, 45, 1)]
    pump = sidechain(kick_t, drums.x.shape[1], 0.35, 0.12)
    ir = reverb_ir(2.2, 0.7, 5)
    wsrc = pads.x * 0.5 + arp.x * 0.6 + lead.x * 0.5 + piano.x * 0.6
    wet = np.stack([signal.fftconvolve(wsrc[c], ir[c])[: wsrc.shape[1]] for c in range(2)])
    bed = drums.x * 0.9 + (bass.x * 0.85 + pads.x + arp.x + lead.x) * pump + piano.x + fx.x * 0.8 + wet * 0.55
    bed = np.stack([filt(c, "highpass", 28) for c in bed])[:, :N]
    bed = bed[:, : int(DUR * SR)]
    fade = int(1.6 * SR)
    bed[:, -fade:] *= np.linspace(1, 0, fade) ** 2
    bed *= 10 ** (-3 / 20) / (np.abs(bed).max() + 1e-9)
    sf.write(HERE / "music.wav", bed.T, SR, subtype="PCM_24")
    build_vo()

    grid_src = drums.x[:, : int(DUR * SR)].mean(axis=0).astype(np.float32)
    grid = measure_beats(grid_src, SR, BPM, n_beats=BEATS + 1)
    grid["beats"] = [x for x in grid["beats"] if x < DUR + 0.5]
    grid["downbeats"] = grid["beats"][::4]
    grid["sections"] = [{"name": n, "beat": bt} for n, bt in [("spark", 0), ("abu dhabi", 4), ("stand", 10), ("readiness", 18),
                                                               ("walkthrough", 26), ("visit pass", 34), ("logo", 45), ("stands", 52), ("end", 63)]]
    grid["duration"] = DUR
    grid["designed_bpm"] = BPM
    grid["source"] = "niticore-event/audio/score.py, 112 bpm, D major, grid measured on the drum stem"
    (FILM / "beats.json").write_text(json.dumps(grid, indent=1))
    print(f"grid: {grid['bpm']} bpm, offset {grid['offset'] * 1000:.1f} ms, {len(grid['beats'])} beats, duration {DUR:.2f} s")


if __name__ == "__main__":
    main()
