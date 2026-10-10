"""Cover a partir de captura REAL do app (sequência de screenshots do portal Maestri).

Monta public/projects/<slug>/cover.mp4 (H.264 yuv420p 24 fps, 1280x800, <= 1,5 MB) na mesma
moldura macOS clara do cover-videos.py, com loop (crossfade fim -> início), e o cover.webp
(1600x1000, mesma moldura) a partir do frame escolhido.

Uso:
  python scripts/capture-cover.py <slug> <pasta-frames> <segmentos> <frame-cover> [crop]

  pasta-frames  f0000.png, f0001.png... (saída do shoot.mjs)
  segmentos     "ini-fim:seg,ini-fim:seg,..." frames [ini, fim] tocados em seg segundos
                (ex.: "0-8:0.8,9-56:2.6,57-72:1.4,73-105:2")
  frame-cover   índice do frame do cover.webp
  crop          x0,y0,x1,y1 em pixels do screenshot (padrão: tudo)
"""

import importlib.util
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("cv", ROOT / "scripts/cover-videos.py")
cv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cv)

FPS = 24
MP4_MAX = 1_500_000
XF = 0.4


def cover_webp(src: Path, box, out: Path) -> None:
    """Frame -> cover 1600x1000 com a moldura (área interna (48,88)-(1552,948))."""
    over = ROOT / "tmp/capture/frame-1600.png"
    if not over.exists():
        save, cv.W, cv.H = (cv.W, cv.H), 1600, 1000
        cv.frame_overlay(over)
        cv.W, cv.H = save
    im = Image.open(src).convert("RGB")
    if box:
        im = im.crop(box)
    iw, ih = 1508, 864  # um pouco maior que a área interna; a moldura cobre a sobra
    r = max(iw / im.width, ih / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.Resampling.LANCZOS)
    l, t = (im.width - iw) // 2, (im.height - ih) // 2
    im = im.crop((l, t, l + iw, t + ih))
    canvas = Image.new("RGB", (1600, 1000), "white")
    canvas.paste(im, (46, 86))
    canvas.paste(Image.open(over), (0, 0), Image.open(over))
    canvas.save(out, "WEBP", quality=82, method=6)


def main() -> None:
    slug, frames, segs, cover_i = sys.argv[1], Path(sys.argv[2]), sys.argv[3], int(sys.argv[4])
    box = tuple(map(int, sys.argv[5].split(","))) if len(sys.argv) > 5 else None
    work = ROOT / "tmp/capture" / slug
    work.mkdir(parents=True, exist_ok=True)
    overlay = ROOT / "tmp/capture/frame-overlay.png"
    cv.frame_overlay(overlay)
    # concat com duração por frame
    lines, total = [], 0.0
    for seg in segs.split(","):
        rng, dur = seg.split(":")
        a, b = map(int, rng.split("-"))
        idx = [i for i in range(a, b + 1) if (frames / f"f{i:04d}.png").exists()]
        d = float(dur) / len(idx)
        for i in idx:
            lines += [f"file '{(frames / f'f{i:04d}.png').as_posix()}'", f"duration {d:.5f}"]
        total += float(dur)
    lines.append(lines[-2])  # concat repete o último
    lst = work / "list.txt"
    lst.write_text("\n".join(lines), encoding="utf-8")
    loop = total - XF
    pre = f"crop={box[2] - box[0]}:{box[3] - box[1]}:{box[0]}:{box[1]}," if box else ""
    graph = (
        f"[0:v]{pre}scale={cv.VW}:{cv.VH}:flags=lanczos,setsar=1,framerate=fps={FPS},"
        f"format=yuv420p,split[a][b];"
        f"[a]trim=0:{XF},setpts=PTS-STARTPTS[head];"
        f"[b]trim={XF}:{total},setpts=PTS-STARTPTS[body];"
        f"[body][head]xfade=transition=fade:duration={XF}:offset={loop - XF}[lp];"
        f"[lp]pad={cv.W}:{cv.H}:{cv.VX}:{cv.VY}:white[p];"
        f"[p][1:v]overlay=0:0:shortest=1,format=yuv420p[v]"
    )
    dest = ROOT / "public/projects" / slug
    dest.mkdir(parents=True, exist_ok=True)
    out = dest / "cover.mp4"
    crf = 26
    while True:
        subprocess.run(
            [cv.FFMPEG, "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
             "-loop", "1", "-framerate", str(FPS), "-i", str(overlay), "-filter_complex", graph,
             "-map", "[v]", "-t", f"{loop:.3f}", "-r", str(FPS), "-an", "-map_metadata", "-1",
             "-c:v", "libx264", "-crf", str(crf), "-preset", "slow", "-pix_fmt", "yuv420p",
             "-profile:v", "high", "-movflags", "+faststart", str(out)],
            check=True,
        )
        size = out.stat().st_size
        if size <= MP4_MAX or crf >= 40:
            break
        crf += 2
    cover_webp(frames / f"f{cover_i:04d}.png", box, dest / "cover.webp")
    print(f"{slug}: cover.mp4 {size / 1e6:.2f} MB crf {crf}, {loop:.2f}s; cover.webp {(dest / 'cover.webp').stat().st_size / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
