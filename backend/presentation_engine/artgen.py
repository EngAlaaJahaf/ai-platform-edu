# -*- coding: utf-8 -*-
"""
مولّد خلفيات الشرائح المصوّرة (هجين):
- إن وُجد المفتاح OPENAI_API_KEY → استدعاء gpt-image-1 بنفس جودة Manus (بدون نص في الصورة).
- إن لم يوجد → مولّد إجرائي احتياطي بنفس هوية الألوان حتى يشتغل العرض كاملاً،
  ويُستبدل لاحقاً تلقائياً بالصور الحقيقية عند توفر المفتاح (إعادة تشغيل نفس الأمر).

الاستخدام:
    python artgen.py              # تلقائي: حقيقي إن وُجد مفتاح، وإلا احتياطي (لوحة academic في art/)
    python artgen.py --real       # فرض الاستدعاء الحقيقي
    python artgen.py --palette dark-tech            # خلفيات بهوية داكنة في art/dark-tech/
    python artgen.py --colors "#101828,#E3B341,#4CC2FF,#3A4A63" --outdir art/custom
    python artgen.py --list-palettes

الإعداد:
    setx OPENAI_API_KEY "sk-..."      # على مستوى المستخدم
    setx OPENAI_BASE_URL "..."        # اختياري: مزود متوافق مع OpenAI
"""
# T3.2: see module docstring — --palette/--colors/--outdir tint backgrounds
# with the active visual identity instead of the fixed academic palette.
import sys, os, json, base64, io, urllib.request, pathlib
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.abspath(__file__))

# T3.2 — لوحات الهوية للخلفيات (bg = الخلفية، primary/secondary = الأشكال، gray = محايد)
PALETTES = {
    "academic": {
        "bg": "#F8F7F2", "primary": "#20B2AA", "secondary": "#0F2D4A", "gray": "#C3CDD7",
    },
    "dark-tech": {
        "bg": "#0B1220", "primary": "#E3B341", "secondary": "#4CC2FF", "gray": "#3A4A63",
    },
}


def _hex_to_rgb(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _mix_rgb(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def resolve_palette(name=None, colors=None):
    """يعيد (palette_name, palette_dict). --colors بصيغة bg,primary,secondary,gray."""
    if colors:
        parts = [p.strip() for p in colors.split(",")]
        if len(parts) != 4 or any(not p.startswith("#") or len(p) != 7 for p in parts):
            raise SystemExit("صيغة --colors يجب أن تكون: bg,primary,secondary,gray بصيغة #RRGGBB (4 ألوان).")
        return (name or "custom"), {"bg": parts[0], "primary": parts[1], "secondary": parts[2], "gray": parts[3]}
    name = name or "academic"
    if name not in PALETTES:
        raise SystemExit(f"اللوحة '{name}' غير معروفة. المتاح: {', '.join(PALETTES)} أو استخدم --colors.")
    return name, dict(PALETTES[name])


def build_prompt(palette):
    return (
        "Flat vector line-art illustration in a clean corporate university style. "
        f"Use ONLY the colors: background {palette['bg']}, primary {palette['primary']} and secondary {palette['secondary']} (and neutral gray {palette['gray']}). "
        f"Keep at least 60% of the canvas as plain {palette['bg']} so text can be overlaid on top. "
        "Simple 2D forms, thin smooth strokes, soft flat shapes, generous negative space, no photo, no 3D, no photorealistic render. "
    )
NO_TEXT = ("ABSOLUTE CONSTRAINT: the image MUST contain NO text, NO words, NO letters, NO numbers, "
           "NO digits, NO logos, NO watermarks, NO signatures — illustration-only background.")
RATIO = "Wide landscape 16:9 composition, decorative elements only at the edges."


def art_briefs():
    return json.load(open(os.path.join(BASE, "art_briefs.json"), encoding="utf-8"))


def call_openai(prompt):
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise SystemExit("لا يوجد OPENAI_API_KEY — استخدم الوضع الاحتياطي أو اضبط المفتاح.")
    base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
    body = json.dumps({
        "model": "gpt-image-1", "prompt": prompt, "n": 1,
        "size": "1536x1024", "quality": "high",
    }).encode("utf-8")
    req = urllib.request.Request(base.rstrip("/") + "/images/generations", data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", "Bearer " + key)
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.loads(r.read().decode("utf-8"))
    item = data["data"][0]
    if "b64_json" in item:
        return base64.b64decode(item["b64_json"])
    if "url" in item:
        with urllib.request.urlopen(item["url"], timeout=120) as r:
            return r.read()
    raise RuntimeError("استجابة غير متوقعة من واجهة الصور: " + ",".join(item.keys()))


def crop16x9(raw):
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    w, h = im.size
    target = w / 16 * 9
    if h > target:
        im = im.crop((0, (h - target) / 2, w, (h + target) / 2))
    else:
        tw = h / 9 * 16
        im = im.crop(((w - tw) / 2, 0, (w + tw) / 2, h))
    return im.resize((1280, 720), Image.LANCZOS)


def fallback_art(key, brief, palette=None, out_dir=None):
    pal = palette or PALETTES["academic"]
    bg = _hex_to_rgb(pal["bg"])
    primary = _hex_to_rgb(pal["primary"])
    secondary = _hex_to_rgb(pal["secondary"])
    gray = _hex_to_rgb(pal["gray"])
    # تدرج رأسي لطيف: من لون الخلفية نحو نسخة أغمق قليلاً
    bg_end = _mix_rgb(bg, (0, 0, 0), 0.04)
    im = Image.new("RGB", (1280, 720), bg)
    d = ImageDraw.Draw(im)
    for y in range(720):
        t = y / 720
        d.line([(0, y), (1280, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(bg, bg_end)))
    teal, navy = primary, secondary
    def blob(cx, cy, r, col):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    def ring(cx, cy, r, col, w=2):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=w)
    blob(1050, 140, 300, teal)
    blob(90, 560, 220, gray)
    blob(1180, 640, 180, navy)
    blob(200, 120, 120, navy)
    typ = brief.get("type", "generic")
    if typ == "cover":
        blob(920, 300, 260, teal)
        ring(920, 300, 150, navy, 4)
        ring(920, 300, 212, teal, 2)
        blob(760, 420, 90, navy)
        ring(760, 420, 62, gray, 2)
    if typ == "competition":
        for i, (x0, c) in enumerate(((460, navy), (610, gray), (760, teal), (910, teal))):
            bar_h = 70 + i * 52
            d.rounded_rectangle([x0, 480 - bar_h, x0 + 86, 480], radius=10, fill=c)
        for yy in range(0, 560, 92):
            d.line([(320, yy), (1190, yy)], fill=(180, 190, 200))
    if typ == "timeline":
        for i in range(7):
            x = 180 + i * 145
            y = 380 + (0 if i % 2 == 0 else 40)
            r = 34
            col = teal if i % 2 == 0 else navy
            d.ellipse([x - r, y - r, x + r, y + r], fill=col)
            d.ellipse([x - r // 2, y - r // 2, x + r // 2, y + r // 2], outline=bg, width=2)
            if i < 6:
                d.line([(x + r + 12, y + 3), (x + r + 114, y + 3)], fill=gray, width=3)
    target_dir = out_dir or os.path.join(BASE, "art")
    os.makedirs(target_dir, exist_ok=True)
    im.save(os.path.join(target_dir, f"bg_{key}.png"))


def _cli_arg(name):
    if name in sys.argv:
        i = sys.argv.index(name)
        if i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith("--"):
            return sys.argv[i + 1]
    return None


def main():
    if "--list-palettes" in sys.argv:
        for name, pal in PALETTES.items():
            print(f" {name}: bg={pal['bg']} primary={pal['primary']} secondary={pal['secondary']} gray={pal['gray']}")
        return
    real = "--real" in sys.argv
    pal_name, palette = resolve_palette(_cli_arg("--palette"), _cli_arg("--colors"))
    out_dir = _cli_arg("--outdir") or (os.path.join(BASE, "art") if pal_name == "academic" else os.path.join(BASE, "art", pal_name))
    os.makedirs(out_dir, exist_ok=True)
    use_ai = bool(os.environ.get("OPENAI_API_KEY"))
    if real and not use_ai:
        raise SystemExit("المفتاح غير موجود ولا يمكن فرض الوضع الحقيقي.")
    prompt_base = build_prompt(palette)
    for key, b in art_briefs().items():
        prompt = prompt_base + "\n" + b.get("brief", "") + "\n" + NO_TEXT + "\n" + RATIO
        out = os.path.join(out_dir, f"bg_{key}.png")
        if use_ai:
            crop16x9(call_openai(prompt)).save(out)
            print(" [AI]       ", key)
        else:
            fallback_art(key, b, palette=palette, out_dir=out_dir)
            print(" [fallback] ", key)
    print(f"اكتمل توليد الخلفيات ({pal_name}) في {out_dir}")
    if not use_ai:
        print("ملاحظة: الوضع الاحتياطي. لتوليد صور حقيقية اضبط OPENAI_API_KEY ثم: python artgen.py --real")


if __name__ == "__main__":
    main()