# -*- coding: utf-8 -*-
"""
خدمة مولّد العروض التقديمية (Presentation Service)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- توليد deck JSON كامل من وصف نصي عبر AI (json_mode).
- معالجة/إصلاح الرد حتى يرضي محرك الـ HTML.
- رندر الشريحة إلى PNG → PPTX → PDF عبر presentation_engine.

الاستخدام من المسارات:
    PresentationService.generate_deck(text, theme, provider, api_key, base_url, model)
    PresentationService.render_deck(deck_id, user_id, deck, title)
"""
import json
import os
import re
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

BASE_DIR = Path(__file__).resolve().parent.parent          # backend/
ENGINE_DIR = BASE_DIR / "presentation_engine"
PRESENTATIONS_DIR = BASE_DIR / "presentations"
PRESENTATIONS_DIR.mkdir(exist_ok=True, parents=True)

from backend.services.ai_service import AIService
from backend.database import (
    save_presentation,
    get_presentation,
    update_presentation_status,
    delete_presentation,
    get_document,
)
from backend.config import GEMINI_API_KEY, DEFAULT_MODEL

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
]

# ── القوائم البيضاء (مطابقة لمحرك HTML) ──
ICONS = [
    "building", "laptop", "phone", "qr", "bell", "cloud", "gear", "headset",
    "shield", "alert", "clock", "target", "check", "users", "trend", "eye",
    "flag", "money", "rocket", "doc", "mail", "star", "layers", "calendar",
    "pin", "lock", "chat", "pencil", "handshake",
]
ARTS = [
    "cover", "campus", "problem", "solution", "product", "value", "vision",
    "market", "competition", "advantage", "pricing", "journey", "ops",
    "finance", "closing",
]
TEMPLATES_ACADEMIC = ["cover", "content", "twocol", "stats", "table", "chart", "timeline", "closing", "quote"]
TEMPLATES_DARK = ["cover", "content", "twocol", "stats", "table", "steps", "closing", "quote"]

AR_DEFAULT_SLIDE_ORDER = "cover؛ خلفية المشكلة؛ الحل؛ المنتج؛ القيمة؛ الرؤية؛ السوق؛ المنافسون؛ التميز؛ نموذج الإيرادات؛ رحلة العميل؛ التشغيل؛ الخطة المالية؛ closing"

DECK_SYSTEM_PROMPT = """أنت استراتيجي محتوى عروض تقديمية (Business/Pitch Deck) محترف، تعمل في شركة تصميم عروض عربية رائدة.
مهمتك: تحويل وصفٍ حر للمشروع إلى ملف JSON صالح بالكامل يمثل عرضاً تقديمياً بجودة استشارية.

## المخرجات
أخرج JSON فقط، بلا أي كلام أو مقدمة أو شرطات، بهذا الهيكل:
{
  "name": "اسم المشروع",
  "theme": "academic",
  "slides": [ ... ]
}

## قوالب الشرائح المتاحة وحقولها
1. cover (الشريحة الأولى): {"template":"cover","kicker":"خطأ شريط العنوان","title":"اسم المشروع","subtitle":"وصف قصير بندٍ واحد","lead":"فقرة تعريفية 1-2 سطر","chips":["كلمة","كلمة"],"team":["اسم1","اسم2"],"takeaway":"خلاصة في سطر","art":"cover"}
2. content (بطاقات أو نقاط): {"template":"content","kicker":"...","title":"...","lead":"...","cards":[{"icon":"clock","t":"عنوان","d":"شرح سطر"}],"takeaway":"..."}  أو  {"template":"content","kicker":"...","title":"...","bullets":[{"icon":"eye","t":"عنوان","d":"شرح سطر"}]}
3. twocol (عمودان): {"template":"twocol","kicker":"...","title":"...","col1_t":"عنوان العمود1","col1_i":"rocket","col1":["نقطة","نقطة"],"col2_t":"عنوان العمود2","col2_i":"building","col2":["نقطة","نقطة"],"note":"...","takeaway":"..."}
4. stats (أرقام إحصائية): {"template":"stats","kicker":"...","title":"...","stats":[{"v":"80%","l":"وصف الرقم"}],"note":"...","takeaway":"..."}
5. chart (أعمدة أفقية مقارنة): {"template":"chart","kicker":"...","title":"...","lead":"...","bars":[{"l":"اسم","v":90,"p":"90%","cls":""},{"l":"منافس","v":60,"p":"60%","cls":"gray"}],"note":"...","takeaway":"..."}
6. timeline (خط زمني): {"template":"timeline","kicker":"...","title":"...","lead":"...","steps":[{"t":"المرحلة","d":"شرح"}],"takeaway":"..."}
7. table (جدول): {"template":"table","kicker":"...","title":"...","headers":["عمود","عمود"],"rows":[["خ1","خ2"],["..."]],"note":"...","takeaway":"..."}
8. closing (الشريحة الأخيرة): {"template":"closing","kicker":"الخاتمة","title":"شكراً لكم","message":"جملة ختامية بأسلوب مؤثر — استثمر في ...","chips":["كلمة","كلمة"]}
9. quote (اقتباس): {"template":"quote","kicker":"اقتباس ملهم","quote":"نص الاقتباس الحرفي","author":"اسم القائل","takeaway":"..."}

## الحقول الإجبارية
- كل شريحة يجب أن تحمل "takeaway" (خلاصة في سطر) و "num" (رقم تسلسلي بصيغة "01").
- كل شريحة (عدا closing) قد تحمل "art" من القائمة المحددة أدناه.

## القيم المسموحة
- الأيقونات (icon) فقط من: clock, alert, lock, target, rocket, building, layers, star, users, trend, eye, flag, money, gear, headset, shield, check, calendar, pin, chat, pencil, doc, mail, handshake
- خلفيات (art) فقط من: cover, campus, problem, solution, product, value, vision, market, competition, advantage, pricing, journey, ops, finance, closing

## قواعد الجودة
- كل المحتوى بالعربية الفصحى الموجزة. الجمل قصيرة وقوية.
- اتبع هذا الترتيب القياسي إن أمكن: cover؛ المقدمة؛ المشكلة؛ الحل؛ المنتج؛ القيمة المقترحة؛ الرؤية؛ السوق؛ المنافسون؛ التميز؛ التسعير؛ رحلة العميل؛ التشغيل؛ المالية؛ الخاتمة.
- عدد الشرائح: {SLIDE_RANGE_INSTRUCTION}.
- لا تختلق أرقاماً غير موجودة في وصف المستخدم؛ إن غاب رقم استخدم وصفاً نوعياً.
- "takeaway" لكل شريحة تلخص ما تريد أن يحفظه المشاهد.
- لا تكتب أي نص خارج JSON إطلاقاً."""

DARK_SLIDE_MAPPING = {"chart": "content", "timeline": "steps"}


class PresentationError(Exception):
    pass


def _default_deck_name(text: str) -> str:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for line in lines:
        m = re.search(r'[\u0600-\u06FF]{2,}', line)
        if m:
            return m.group(0)[:30]
    return "عرض تقديمي"


class PresentationService:
    # ── توليد deck عبر AI ──
    @classmethod
    def _resolve_identity(cls, theme) -> tuple:
        """theme = 'academic'|'dark-tech' (legacy) OR dict {id,'base',colors,fonts,accent,doc_id,...}.
        Returns (base_theme:str, identity:dict|None)."""
        if isinstance(theme, dict):
            base = theme.get("base") or theme.get("base_theme") or "academic"
            base = base if base in ("academic", "dark-tech") else "academic"
            return base, theme
        base = theme if theme in ("academic", "dark-tech") else "academic"
        return base, None

    @classmethod
    def _deck_prompt(cls, theme, slide_min: int, slide_max: int) -> str:
        system_prompt = DECK_SYSTEM_PROMPT.replace(
            "{SLIDE_RANGE_INSTRUCTION}", f"من {slide_min} إلى {slide_max}"
        )
        base, _ = cls._resolve_identity(theme)
        if base == "dark-tech":
            system_prompt = system_prompt.replace(
                "chart (أعمدة أفقية مقارنة)", "steps (خطوات متتالية): {\"template\":\"steps\",\"title\":\"...\",\"steps\":[{\"t\":\"...\",\"d\":\"...\"}]}"
            )
            system_prompt += (
                "\n\nملاحظة الهوية الداكنة: استخدم القوالب cover/content/twocol/stats/table/steps/closing فقط. "
                "لا تستخدم chart أو timeline إطلاقاً."
            )
        return system_prompt

    @classmethod
    def generate_deck(
        cls,
        text: str,
        theme: str = "academic",
        provider: str = "gemini",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        slide_min: int = 8,
        slide_max: int = 15,
    ) -> Dict[str, Any]:
        if not text or not text.strip():
            raise PresentationError("الوصف فارغ. اكتب وصفاً للمشروع أولاً.")
        base, identity = cls._resolve_identity(theme)
        slide_min = max(5, int(slide_min or 8))
        slide_max = min(30, max(slide_min, int(slide_max or 15)))

        system_prompt = cls._deck_prompt(theme, slide_min, slide_max)
        identity_label = "academic"
        if identity:
            identity_label = identity.get("name") or identity.get("base") or "academic"
        elif base == "dark-tech":
            identity_label = "dark-tech"

        user_prompt = (
            f"الهوية البصرية: {identity_label}\n"
            f"وصف المشروع:\n{text}\n\n"
            "ولّد deck JSON كاملاً وفق التعليمات."
        )

        try:
            raw = AIService.execute_chat_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                provider=provider,
                api_key=api_key,
                base_url=base_url,
                model=model,
                json_mode=True,
                temperature=0.6,
            )
        except Exception as e:
            raise PresentationError(f"فشل استدعاء الذكاء الاصطناعي: {e}")
        if not raw or not raw.strip():
            raise PresentationError("الذكاء الاصطناعي أعاد رداً فارغاً.")

        deck = cls._parse_json(raw)
        deck = cls.normalize_deck(deck, theme, slide_max=slide_max)
        deck["name"] = (deck.get("name") or _default_deck_name(text))[:60]
        deck["theme"] = identity if identity is not None else base
        deck["brand"] = deck["name"]
        return deck

    # ── استخراج نص المستند (ملف كامل أو نطاق صفحات) ──
    @classmethod
    def extract_doc_text(cls, doc_id: str, user_id: str, start_page: Optional[int] = None,
                         end_page: Optional[int] = None) -> str:
        """يستخرج نص مستند مرفوع سابقاً؛ الكل أو نطاق صفحات فقط (حسب page_number في الـ chunks)."""
        doc = get_document(doc_id, user_id)
        if not doc:
            raise PresentationError("المستند غير موجود في مكتبتك أو لا تملك صلاحية الوصول إليه.")

        if start_page is None and end_page is None:
            return doc.get("full_text") or ""

        chunks = doc.get("chunks") or []
        if not chunks:
            return doc.get("full_text") or ""

        start_page = max(0, int(start_page or 1))
        end_page = max(start_page, int(end_page or start_page))
        total_pages = int(doc.get("pages_count") or 0)
        if total_pages and start_page > total_pages:
            raise PresentationError(f"النطاق المحدد يبدأ من صفحة {start_page} بينما المستند يضم {total_pages} صفحات فقط.")
        if end_page > total_pages:
            end_page = total_pages

        parts = []
        for c in chunks:
            pg = int(c.get("page_number") or 1)
            if start_page <= pg <= end_page:
                t = str(c.get("text") or "").strip()
                if t:
                    parts.append(t)
        return "\n\n".join(parts)

    @classmethod
    def create(cls, user_id: str, text: str, theme="academic", **ai_kwargs) -> Dict[str, Any]:
        """توليد deck + حفظ في قاعدة البيانات + كتابة deck.json.
        يمكن تمرير doc_id/start_page/end_page داخل **ai_kwargs لبناء المحتوى من مستند بدلاً من النص الحر.
        theme يمكن أن يكون نصاً (legacy) أو كائناً (هوية بصرية)."""
        doc_id = ai_kwargs.pop("doc_id", None)
        start_page = ai_kwargs.pop("start_page", None)
        end_page = ai_kwargs.pop("end_page", None)
        slide_min = ai_kwargs.get("slide_min")
        slide_max = ai_kwargs.get("slide_max")
        source = "نص حر"
        if doc_id:
            content = cls.extract_doc_text(doc_id, user_id, start_page, end_page)
            if not content or not content.strip():
                raise PresentationError("تعذّر استخراج نص من المستند المحدد. تأكد من أن المستند يحتوي نصاً قابلاً للقراءة.")
            if start_page is None and end_page is None:
                source = "المستند الكامل"
            else:
                source = f"الصفحات {start_page or 1}-{end_page or 'النهاية'}"
            # مزيج: إن وُجد نص حر إضافي يُرفق للسياق
            if text and text.strip() and len(text.strip()) < 800:
                content = f"تعليمات/تفاصيل إضافية من المستخدم:\n{text.strip()}\n\n---\n\n{content}"
        else:
            content = text.strip()
            if not content:
                raise PresentationError("يرجى إدخال وصف النص، أو اختيار مستند كمصدر للعرض.")

        deck = cls.generate_deck_with_source(content, source, theme=theme, **ai_kwargs)
        deck_id = f"prs_{uuid.uuid4().hex[:10]}"
        title = deck["name"]
        user_dir = PRESENTATIONS_DIR / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        deck_path = user_dir / f"{deck_id}.json"
        with open(deck_path, "w", encoding="utf-8") as f:
            json.dump(deck, f, ensure_ascii=False, indent=2)
        base, _ = cls._resolve_identity(theme)
        save_presentation(deck_id, user_id, title, base, "draft", str(deck_path))
        return {"deck_id": deck_id, "title": title, "theme": deck.get("theme", base),
                "deck": deck, "source": source, "slide_min": slide_min, "slide_max": slide_max}

    @classmethod
    def generate_deck_with_source(cls, content: str, source: str, theme="academic",
                                  provider: Optional[str] = None, api_key: Optional[str] = "",
                                  base_url: Optional[str] = None, model: Optional[str] = None,
                                  slide_min: int = 8, slide_max: int = 15) -> Dict[str, Any]:
        """مثل generate_deck لكن يمرر مصدر المحتوى للـ AI مع تنويه صفحة البداية عند نطاق صفحات."""
        effective_provider = provider or "gemini"
        effective_api_key = api_key or GEMINI_API_KEY
        effective_model = model or DEFAULT_MODEL
        slide_min = max(5, int(slide_min or 8))
        slide_max = min(30, max(slide_min, int(slide_max or 15)))
        # تحديد الصفحات من السطر الأول إن كانت generator قد أضافت علامة (نطاق صفحات)
        page_hint = ""
        m = re.search(r"الصفحات (\d+)-(\d+)", source)
        if m:
            page_hint = f"ملاحظة: العرض مبني على الصفحات {m.group(1)}–{m.group(2)} فقط من الملف المصدر، تجاهل ما خارجها.\n"
        system_prompt = cls._deck_prompt(theme, slide_min, slide_max) + "\n\n" + page_hint
        try:
            raw = AIService.execute_chat_completion(
                system_prompt=system_prompt,
                user_prompt=content,
                provider=effective_provider,
                api_key=effective_api_key,
                base_url=base_url,
                model=effective_model,
                json_mode=True,
                temperature=0.6,
            )
        except Exception as e:
            raise PresentationError(f"فشل استدعاء الذكاء الاصطناعي: {e}")
        if not raw or not raw.strip():
            raise PresentationError("الذكاء الاصطناعي أعاد رداً فارغاً.")
        deck = cls._parse_json(raw)
        base, identity = cls._resolve_identity(theme)
        deck = cls.normalize_deck(deck, theme, slide_max=slide_max)
        deck["name"] = (deck.get("name") or _default_deck_name(content))[:60]
        deck["theme"] = identity if identity is not None else base
        deck["brand"] = deck["name"]
        return deck

    # ── معالجة JSON ──
    @staticmethod
    def _parse_json(raw: str) -> Dict[str, Any]:
        raw = raw.strip()
        raw = re.sub(r"^```(json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            m = re.search(r"\{[\s\S]*\}", raw)
            if m:
                try:
                    return json.loads(m.group(0))
                except json.JSONDecodeError:
                    pass
            raise PresentationError("الذكاء الاصطناعي لم يُرجع JSON صالحاً. أعد المحاولة.")

    @classmethod
    def normalize_deck(cls, raw: Dict[str, Any], theme="academic", slide_max: int = 15) -> Dict[str, Any]:
        base, identity = cls._resolve_identity(theme)
        allowed = TEMPLATES_ACADEMIC if base == "academic" else TEMPLATES_DARK
        deck = {
            "name": str(raw.get("name") or "عرض تقديمي")[:60],
            "theme": identity if identity is not None else base,
            "brand": str(raw.get("brand") or raw.get("name") or "عرض تقديمي")[:60],
            "slides": [],
        }
        slides_in = raw.get("slides")
        if not isinstance(slides_in, list) or not slides_in:
            raise PresentationError("العرض لا يحتوي على شرائح صالحة.")
        slides_in = slides_in[:max(1, int(slide_max or 15))]
        for i, s in enumerate(slides_in, 1):
            if not isinstance(s, dict):
                continue
            tmpl = str(s.get("template") or "content")
            if tmpl not in allowed:
                tmpl = "steps" if tmpl in ("chart", "timeline") and base == "dark-tech" else \
                       ("content" if tmpl == "steps" else "content")
            slide = cls._normalize_slide(s, tmpl, i)
            if slide:
                deck["slides"].append(slide)
        if not deck["slides"]:
            raise PresentationError("فشلت معالجة الشرائح.")
        return deck

    @classmethod
    def _normalize_slide(cls, s: Dict[str, Any], tmpl: str, idx: int) -> Optional[Dict[str, Any]]:
        def st(key: str, fallback: str = "") -> str:
            v = s.get(key)
            return str(v).strip() if v is not None else fallback

        def icons(k: str) -> str:
            v = st(k, "check")
            return v if v in ICONS else "check"

        def slist(key: str) -> List[str]:
            v = s.get(key)
            if isinstance(v, list):
                return [str(x).strip() for x in v if str(x).strip()][:8]
            return []

        slide = {
            "template": tmpl,
            "kicker": st("kicker", "العرض"),
            "title": st("title", f"شريحة {idx}"),
            "takeaway": st("takeaway", ""),
            "num": f"{idx:02d}",
        }
        art = st("art")
        if art in ARTS:
            slide["art"] = art

        if tmpl == "cover":
            slide.update({
                "subtitle": st("subtitle", ""),
                "lead": st("lead", st("title")),
                "chips": slist("chips") or ["2025", "مشروع", "عرض تقديمي"],
                "team": slist("team") or ["فريق المشروع"],
            })
        elif tmpl == "content":
            cards = s.get("cards")
            bullets = s.get("bullets")
            if isinstance(cards, list) and cards:
                slide["cards"] = [
                    {"icon": icons_from(c, "icon"), "t": str(c.get("t") or "عنصر"), "d": str(c.get("d") or "")}
                    for c in cards[:6] if isinstance(c, dict)
                ]
            elif isinstance(bullets, list) and bullets:
                slide["bullets"] = [
                    {"icon": icons_from(c, "icon"), "t": str(c.get("t") or "عنصر"), "d": str(c.get("d") or "")}
                    for c in bullets[:6] if isinstance(c, dict)
                ]
            lead = st("lead", "")
            if lead:
                slide["lead"] = lead
        elif tmpl == "twocol":
            slide.update({
                "col1_t": st("col1_t", "العمود الأول"),
                "col1_i": icons("col1_i"),
                "col1": slist("col1") or ["نقطة"],
                "col2_t": st("col2_t", "العمود الثاني"),
                "col2_i": icons("col2_i"),
                "col2": slist("col2") or ["نقطة"],
            })
            note = st("note", "")
            if note:
                slide["note"] = note
        elif tmpl == "stats":
            stats = s.get("stats")
            slide["stats"] = []
            if isinstance(stats, list):
                for stt in stats[:4]:
                    if isinstance(stt, dict):
                        slide["stats"].append({
                            "v": str(stt.get("v") or "-"),
                            "l": str(stt.get("l") or ""),
                        })
            if not slide["stats"]:
                slide["stats"] = [{"v": "-", "l": "قيمة"}]
            note = st("note", "")
            if note:
                slide["note"] = note
            chips = slist("chips")
            if chips:
                slide["chips"] = chips
        elif tmpl == "chart":
            bars = s.get("bars")
            slide["bars"] = []
            if isinstance(bars, list):
                for b in bars[:6]:
                    if isinstance(b, dict):
                        slide["bars"].append({
                            "l": str(b.get("l") or "بديل"),
                            "v": max(0, min(100, int(b.get("v") or 0))),
                            "p": str(b.get("p") or f"{int(b.get('v') or 0)}%"),
                            "cls": str(b.get("cls") or ""),
                        })
            if not slide["bars"]:
                slide["bars"] = [{"l": "حلنا", "v": 90, "p": "90%", "cls": ""}]
            lead = st("lead", "")
            if lead:
                slide["lead"] = lead
            note = st("note", "")
            if note:
                slide["note"] = note
        elif tmpl in ("timeline", "steps"):
            steps = s.get("steps")
            slide["steps"] = []
            if isinstance(steps, list):
                for pth in steps[:7]:
                    if isinstance(pth, dict):
                        slide["steps"].append({
                            "t": str(pth.get("t") or "مرحلة"),
                            "d": str(pth.get("d") or ""),
                        })
            if not slide["steps"]:
                slide["steps"] = [{"t": "البداية", "d": ""}]
            lead = st("lead", "")
            if lead:
                slide["lead"] = lead
            note = st("note", "")
            if note:
                slide["note"] = note
        elif tmpl == "table":
            headers = s.get("headers")
            rows = s.get("rows")
            slide["headers"] = [str(h) for h in headers][:6] if isinstance(headers, list) else ["العمود"]
            slide["rows"] = []
            if isinstance(rows, list):
                for r in rows[:8]:
                    if isinstance(r, list):
                        slide["rows"].append([str(c) for c in r][:6])
            note = st("note", "")
            if note:
                slide["note"] = note
        elif tmpl == "closing":
            slide.update({
                "title": st("title", "شكراً لكم"),
                "message": st("message", f"استثمر في هذا المشروع اليوم — {st('title')}."),
                "chips": slist("chips") or ["فريق متخصص", "سوق ينتظر", "نموذج مالي"],
            })
        elif tmpl == "quote":
            slide.update({
                "quote": st("quote", "العلم في الصغر كالنقش على الحجر."),
                "author": st("author", ""),
            })
        return slide

    # ── الرندر ──
    @staticmethod
    def _find_chrome() -> str:
        for c in CHROME_CANDIDATES:
            if os.path.isfile(c):
                return c
        try:
            import shutil as _sh
            r = _sh.which("chrome") or _sh.which("chromium") or _sh.which("google-chrome")
            if r:
                return r
        except Exception:
            pass
        raise PresentationError(
            "متصفح Chrome غير متوفر على الخادم — الرندر يتطلب Chrome (طريقة headless) لتصوير الشرائح."
        )

    @classmethod
    def render_deck(
        cls,
        deck_id: str,
        user_id: str,
        deck: Dict[str, Any],
        title: str,
    ) -> str:
        cls._find_chrome()
        user_dir = PRESENTATIONS_DIR / str(user_id)
        deck_dir = user_dir / str(deck_id)
        deck_dir.mkdir(parents=True, exist_ok=True)

        # 1) كتابة deck JSON
        deck_json = deck_dir / "deck.json"
        with open(deck_json, "w", encoding="utf-8") as f:
            json.dump(deck, f, ensure_ascii=False, indent=2)

        # 2) نسخ الخطوط إلى workdir (المحرك يقرأها بـ ../../fonts/)
        fonts_src = ENGINE_DIR / "fonts"
        fonts_dst = deck_dir / "fonts"
        if fonts_src.is_dir():
            shutil.rmtree(fonts_dst, ignore_errors=True)
            shutil.copytree(fonts_src, fonts_dst)

        # 2b) ضمان وجود خلفيات art (توليدها مرة واحدة إن غابت)
        art_dir = ENGINE_DIR / "art"
        if not (art_dir / "bg_cover.png").is_file():
            try:
                subprocess.run([sys.executable, str(ENGINE_DIR / "artgen.py")],
                               cwd=str(ENGINE_DIR), capture_output=True, timeout=180)
            except Exception:
                pass

        # 3) تشغيل المحرك
        cmd = [
            sys.executable,
            str(ENGINE_DIR / "engine.py"),
            str(deck_json),
            "--out", "presentation",
        ]
        env = dict(os.environ)
        env["PPT_STUDIO_WORKDIR"] = str(deck_dir)
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, encoding="utf-8", errors="replace",
                env=env, timeout=360,
            )
        except subprocess.TimeoutExpired:
            update_presentation_status(deck_id, "error", error="انتهت مهلة الرندر (360 ث).")
            raise PresentationError("انتهت مهلة توليد العرض (قد تكون الصور كبيرة).")
        except Exception as e:
            update_presentation_status(deck_id, "error", error=str(e))
            raise PresentationError(f"فشل تشغيل المحرك: {e}")

        if result.returncode != 0:
            update_presentation_status(deck_id, "error", error=(result.stderr or result.stdout)[-400:])
            raise PresentationError("فشل الرندر في المحرك:\n" + (result.stderr or result.stdout)[-400:])

        # 4) التحقق من النواتج
        pptx_p = deck_dir / "presentation.pptx"
        pdf_p = deck_dir / "presentation.pdf"
        if not pptx_p.is_file() or not pdf_p.is_file():
            update_presentation_status(deck_id, "error", error="لم تولَّد ملفات المخرجات.")
            raise PresentationError("فشل توليد ملفات المخرجات.")

        slide_count = len(deck.get("slides", []))
        update_presentation_status(deck_id, "rendered", slide_count=slide_count, result_dir=str(deck_dir))
        return str(deck_dir)

    @classmethod
    def update_deck_json(cls, deck_id: str, user_id: str, deck: Dict[str, Any]) -> Dict[str, Any]:
        row = get_presentation(deck_id, user_id)
        if not row:
            raise PresentationError("العرض غير موجود.")
        incoming_theme = deck.get("theme")
        # احتفظ بهوية بصرية مخصّصة إن وُجدت في الـ deck المُرسل، وإلا فاستخدم هوية العرض كما هي محفوظة
        keep_identity = isinstance(incoming_theme, dict)
        norm_theme = incoming_theme if keep_identity else (row.get("theme") or "academic")
        deck = cls.normalize_deck(deck, norm_theme)
        deck["name"] = str(deck.get("name") or row.get("title") or "عرض تقديمي")[:60]
        deck["theme"] = incoming_theme if keep_identity else (row.get("theme") or "academic")
        deck["brand"] = deck["name"]
        deck_path = Path(row["deck_path"]) if row.get("deck_path") else PRESENTATIONS_DIR / str(user_id) / f"{deck_id}.json"
        deck_path.parent.mkdir(parents=True, exist_ok=True)
        with open(deck_path, "w", encoding="utf-8") as f:
            json.dump(deck, f, ensure_ascii=False, indent=2)
        update_presentation_status(deck_id, "draft", slide_count=len(deck["slides"]))
        return {"deck_id": deck_id, "title": deck["name"], "deck": deck}

    @classmethod
    def load(cls, deck_id: str, user_id: str) -> Dict[str, Any]:
        row = get_presentation(deck_id, user_id)
        if not row:
            raise PresentationError("العرض غير موجود أو لا تملك صلاحية الوصول إليه.")
        return row

    @classmethod
    def remove(cls, deck_id: str, user_id: str) -> bool:
        info = delete_presentation(deck_id, user_id)
        if not info:
            return False
        # تحرير القرص: deck json + مجلد النتائج
        for p in [info.get("deck_path"), info.get("result_dir")]:
            if p and os.path.exists(p):
                try:
                    if os.path.isdir(p):
                        shutil.rmtree(p, ignore_errors=True)
                    else:
                        os.remove(p)
                except Exception:
                    pass
        return True

    # ── أدوات مساعدة للمسارات ──
    @staticmethod
    def user_dir(user_id: str) -> Path:
        return PRESENTATIONS_DIR / str(user_id)


def icons_from(c: Dict[str, Any], key: str) -> str:
    v = str(c.get(key) or "check")
    return v if v in ICONS else "check"