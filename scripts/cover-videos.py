"""Covers animados: baixa os mp4 gerados a partir dos covers, faz loop de 4s com
crossfade fim->início, enquadra na mesma moldura macOS do cover.webp e exporta
public/projects/<slug>/cover.webm (VP9) + cover.mp4 (H.264), sem áudio. Se o webm
sair maior que o mp4, é descartado e fica só o mp4 (o <video> tem que tocar só com mp4).

Uso:
  python scripts/cover-videos.py                 # todos de tmp/covers-gen/videos.tsv
  python scripts/cover-videos.py digital-twin-3d # só esses slugs

videos.tsv: slug<TAB>url[<TAB>modo]. Modo:
  framed            vídeo gerado a partir do cover.webp COM moldura: recorta a área interna
  crop=x0,y0,x1,y1  recorte em frações do quadro (ex.: tirar barra lateral/toolbar de print de app)
  start=S           começa o loop em S segundos (loop = min(4, duração - S - 0,45))
  (vazio)           imagem crua, preenche a janela com crop central
Opções combinam com ";" (ex.: crop=0.1,0,0.9,0.9;start=1).
Arquivo local já baixado: tmp/covers-gen/videos/<slug>.mp4 (pula o download).
"""

import json
import subprocess
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = "D:/yt-dlp/ffmpeg.exe"
FFPROBE = "D:/yt-dlp/ffprobe.exe"
TSV = ROOT / "tmp/covers-gen/videos.tsv"
WORK = ROOT / "tmp/covers-gen/videos"

LOOP = 4.0  # duração final (s)
XF = 0.4  # crossfade fim -> início (s)
W, H = 1280, 800  # saída = cover 1600x1000 * 0.8
SCALE = W / 1600
# janela do cover.webp (1600x1000): (48,52)-(1552,948), barra de título 36px
WIN = (48, 52, 1552, 948)
BAR = 36
# área de conteúdo em 1280x800 = (38.4,70.4) 1203.2x688; vídeo um pouco maior, a moldura cobre a sobra
VX, VY, VW, VH = 36, 68, 1208, 694
WEBM_MAX, MP4_MAX = 1_000_000, 1_200_000


def frame_overlay(path: Path) -> None:
    """Moldura idêntica à do covers.py (1600x1000) reduzida a 1280x800, com furo transparente na área de conteúdo."""
    canvas = Image.new("RGBA", (1600, 1000), "#f5f5f7")
    shadow = Image.new("RGBA", canvas.size)
    ImageDraw.Draw(shadow).rounded_rectangle((48, 64, 1552, 960), radius=12, fill=(0, 0, 0, 36))
    canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(16)))
    cw, ch = WIN[2] - WIN[0], WIN[3] - WIN[1]
    window = Image.new("RGB", (cw, ch), "white")
    wd = ImageDraw.Draw(window)
    wd.rectangle((0, 0, cw, BAR), fill="#f2f2f4")
    wd.line((0, BAR - 1, cw, BAR - 1), fill="#dedee2")
    for x in (20, 38, 56):
        wd.ellipse((x - 4, 14, x + 4, 22), fill="#b8b8bd")
    mask = Image.new("L", (cw, ch))
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw - 1, ch - 1), radius=12, fill=255)
    canvas.paste(window, WIN[:2], mask)
    # furo = janela arredondada abaixo da barra de título
    hole = Image.new("L", (1600, 1000), 0)
    hd = ImageDraw.Draw(hole)
    hd.rounded_rectangle((WIN[0], WIN[1], WIN[2] - 1, WIN[3] - 1), radius=12, fill=255)
    hd.rectangle((0, 0, 1600, WIN[1] + BAR - 1), fill=0)
    canvas.putalpha(hole.point(lambda a: 255 - a))
    canvas.resize((W, H), Image.Resampling.LANCZOS).save(path)


def probe(src: Path) -> tuple[float, float, int, int]:
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,r_frame_rate:format=duration", "-of", "json", str(src)],
        capture_output=True, text=True, check=True,
    ).stdout
    info = json.loads(out)
    st = info["streams"][0]
    num, den = map(int, st["r_frame_rate"].split("/"))
    return float(info["format"]["duration"]), num / den, st["width"], st["height"]


def build_filter(dur: float, fps: float, mode: str) -> tuple[str, float]:
    opts = dict(o.split("=", 1) if "=" in o else (o, "") for o in mode.split(";") if o)
    start = float(opts.get("start", 0))  # pula o começo (ex.: IA "recarregando" a tela)
    loop = min(LOOP, dur - start - XF - 0.05)
    if loop < 2:
        raise ValueError(f"vídeo curto demais ({dur:.2f}s)")
    pre = f"fps={fps:g}"
    box = None
    if "framed" in opts:  # área interna relativa do cover 1600x1000
        box = (WIN[0] / 1600, (WIN[1] + BAR) / 1000, WIN[2] / 1600, WIN[3] / 1000)
    elif "crop" in opts:
        box = tuple(map(float, opts["crop"].split(",")))
    if box:
        x0, y0, x1, y1 = box
        pre += f",crop=iw*{x1 - x0:.5f}:ih*{y1 - y0:.5f}:iw*{x0:.5f}:ih*{y0:.5f}"
    # saída[t] = src[S+XF+t]; nos últimos XF s entra src[S..S+XF] em fade -> o último frame emenda no primeiro
    graph = (
        f"[0:v]{pre},scale={VW}:{VH}:force_original_aspect_ratio=increase:flags=lanczos,"
        f"crop={VW}:{VH},setsar=1,format=yuv420p,split[a][b];"
        f"[a]trim={start}:{start + XF},setpts=PTS-STARTPTS[head];"
        f"[b]trim={start + XF}:{start + XF + loop},setpts=PTS-STARTPTS[body];"
        f"[body][head]xfade=transition=fade:duration={XF}:offset={loop - XF}[lp];"
        f"[lp]pad={W}:{H}:{VX}:{VY}:white[p];"
        f"[p][1:v]overlay=0:0:shortest=1,format=yuv420p[v]"
    )
    return graph, loop


def encode(src: Path, overlay: Path, graph: str, loop: float, fps: float, out: Path, codec: str, crf: int) -> int:
    args = [FFMPEG, "-y", "-v", "error", "-i", str(src), "-loop", "1", "-framerate", f"{fps:g}", "-i", str(overlay),
            "-filter_complex", graph, "-map", "[v]", "-t", f"{loop}", "-an", "-map_metadata", "-1"]
    if codec == "vp9":
        args += ["-c:v", "libvpx-vp9", "-crf", str(crf), "-b:v", "0", "-row-mt", "1",
                 "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p"]
    else:
        args += ["-c:v", "libx264", "-crf", str(crf), "-preset", "slow", "-pix_fmt", "yuv420p",
                 "-profile:v", "high", "-movflags", "+faststart"]
    subprocess.run(args + [str(out)], check=True)
    return out.stat().st_size


def main() -> None:
    rows = [l.split("\t") for l in TSV.read_text(encoding="utf-8-sig").splitlines() if "\t" in l]
    wanted = set(sys.argv[1:])
    WORK.mkdir(parents=True, exist_ok=True)
    overlay = WORK / "frame-overlay.png"
    frame_overlay(overlay)
    for row in rows:
        slug, url = row[0].strip(), row[1].strip()
        mode = row[2].strip().lower() if len(row) > 2 else ""
        if wanted and slug not in wanted:
            continue
        src = WORK / f"{slug}.mp4"
        if not src.exists():
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as r:
                src.write_bytes(r.read())
        dur, fps, sw, sh = probe(src)
        fps = min(fps, 30)
        graph, loop = build_filter(dur, fps, mode)
        dest = ROOT / "public/projects" / slug
        dest.mkdir(parents=True, exist_ok=True)
        sizes = {}
        for codec, ext, crf, limit in (("vp9", "webm", 34, WEBM_MAX), ("h264", "mp4", 28, MP4_MAX)):
            out = dest / f"cover.{ext}"
            size = encode(src, overlay, graph, loop, fps, out, codec, crf)
            while size > limit and crf < 45:  # sobe CRF até caber no orçamento
                crf += 2
                size = encode(src, overlay, graph, loop, fps, out, codec, crf)
            sizes[ext] = f"{size / 1e6:.2f} MB (crf {crf})"
        webm, mp4 = dest / "cover.webm", dest / "cover.mp4"
        if webm.stat().st_size >= mp4.stat().st_size:  # webm sem ganho: fica só o mp4
            webm.unlink()
            sizes["webm"] += " -> descartado (maior que o mp4)"
        print(f"{slug}: src {sw}x{sh} {dur:.2f}s {fps:g}fps {mode or 'raw'} -> loop {loop:.2f}s | "
              + " | ".join(f"{k} {v}" for k, v in sizes.items()))


if __name__ == "__main__":
    main()
