# -*- coding: utf-8 -*-
"""
مولّد خلفيات الشرائح المصوّرة (هجين):
- إن وُجد المفتاح OPENAI_API_KEY → استدعاء gpt-image-1 بنفس جودة Manus (بدون نص في الصورة).
- إن لم يوجد → مولّد إجرائي احتياطي بنفس هوية الألوان حتى يشتغل العرض كاملاً،
  ويُستبدل لاحقاً تلقائياً بالصور الحقيقية عند توفر المفتاح (إعادة تشغيل نفس الأمر).

الاستخدام:
    python artgen.py              # تلقائي: حقيقي إن وُجد مفتاح، وإلا احتياطي
    python artgen.py --real       # فرض الاستدعاء الحقيقي

الإعداد:
    setx OPENAI_API_KEY "sk-..."      # على مستوى المستخدم
    setx OPENAI_BASE_URL "..."        # اختياري: مزود متوافق مع OpenAI
"""
import sys, os, json, base64, io, urllib.request, pathlib
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.abspath(__file__))

PROMPT_BASE = (
    "Flat vector line-art illustration in a clean corporate university style. "
    "Use ONLY the colors: warm ivory background #F8F7F2, dark navy #0F2D4A and teal #20B2AA (and light gray #E3E8EE). "
    "Keep at least 60% of the canvas as plain ivory #F8F7F2 so text can be overlaid on top. "
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


def fallback_art(key, brief):
    im = Image.new("RGB", (1280, 720), (248, 247, 242))
    d = ImageDraw.Draw(im)
    for y in range(720):
        t = y / 720
        d.line([(0, y), (1280, y)], fill=(248 - int(6 * t), 247 - int(8 * t), 242 - int(4 * t)))
    teal, navy, gray = (144, 206, 202), (80, 106, 136), (195, 205, 215)
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
            d.ellipse([x - r // 2, y - r // 2, x + r // 2, y + r // 2], outline=(248, 247, 242), width=2)
            if i < 6:
                d.line([(x + r + 12, y + 3), (x + r + 114, y + 3)], fill=gray, width=3)
    im.save(os.path.join(BASE, "art", f"bg_{key}.png"))


def main():
    real = "--real" in sys.argv
    os.makedirs(os.path.join(BASE, "art"), exist_ok=True)
    use_ai = bool(os.environ.get("OPENAI_API_KEY"))
    if real and not use_ai:
        raise SystemExit("المفتاح غير موجود ولا يمكن فرض الوضع الحقيقي.")
    for key, b in art_briefs().items():
        prompt = PROMPT_BASE + "\n" + b.get("brief", "") + "\n" + NO_TEXT + "\n" + RATIO
        out = os.path.join(BASE, "art", f"bg_{key}.png")
        if use_ai:
            crop16x9(call_openai(prompt)).save(out)
            print(" [AI]       ", key)
        else:
            fallback_art(key, b)
            print(" [fallback] ", key)
    print("اكتمل توليد الخلفيات في art/")
    if not use_ai:
        print("ملاحظة: الوضع الاحتياطي. لتوليد صور حقيقية اضبط OPENAI_API_KEY ثم: python artgen.py --real")


if __name__ == "__main__":
    main()