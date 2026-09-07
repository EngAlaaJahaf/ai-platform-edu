"""Extract a visual-identity blueprint (colors + fonts + light/dark) from a .pptx theme.

V1 scope: derive a template blueprint that the presentation engine can consume as a
custom theme. We parse the OOXML theme (ppt/theme/theme1.xml) for the color scheme
(a:clrScheme) and font scheme (a:fontScheme), then map to our CSS color tokens.
This is heuristic / best-effort; unknown/invalid files raise ValueError with clean msg.
"""
import io
import re
import zipfile
import xml.etree.ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}

# OOXML clrScheme slot names -> role in our palette
_SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3",
          "accent4", "accent5", "accent6", "hlink", "folHlink"]

_ACAD_TOKENS = ["navy", "teal", "bg", "bg2", "card", "gray", "line"]
_DARK_TOKENS = ["main", "bgDark", "surface", "text"]

_DARK_ACCENTS = ["gold", "sky", "purple", "teal", "rose"]


def _hex_from(el):
    """Extract a #RRGGBB hex string from a color element (srgbClr / sysClr)."""
    if el is None:
        return None
    srgb = el.find("a:srgbClr", NS)
    if srgb is not None:
        v = srgb.get("val")
        if v and re.fullmatch(r"[0-9A-Fa-f]{6}", v):
            return "#" + v.upper()
    sysc = el.find("a:sysClr", NS)
    if sysc is not None:
        v = sysc.get("lastClr") or sysc.get("val")
        if v and re.fullmatch(r"[0-9A-Fa-f]{6}", v):
            return "#" + v.upper()
    return None


def _rgb(hex_color):
    if not hex_color or not hex_color.startswith("#") or len(hex_color) != 7:
        return (255, 255, 255)
    return tuple(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))


def _luminance(rgb):
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]


def _contrast(a, b):
    la = _luminance(_rgb(a)) + 5
    lb = _luminance(_rgb(b)) + 5
    lo, hi = (la, lb) if la < lb else (lb, la)
    return (hi + 5) / (lo + 5)


def extract_pptx_theme(pptx_bytes: bytes) -> dict:
    """Parse a .pptx (bytes) -> {'base','colors','fonts','accent','name','description'}."""
    try:
        zf = zipfile.ZipFile(io.BytesIO(pptx_bytes))
    except zipfile.BadZipFile:
        raise ValueError("الملف ليس ملف PowerPoint صالح (.pptx)")

    # Locate theme part (usually ppt/theme/theme1.xml)
    theme_name = next((n for n in zf.namelist()
                       if re.search(r"ppt/theme/theme\d+\.xml$", n)), None)
    if not theme_name:
        raise ValueError("لم يُعثر على سمة ألوان داخل ملف PowerPoint")

    try:
        root = ET.fromstring(zf.read(theme_name))
    except ET.ParseError:
        raise ValueError("تعذّر قراءة سمة ملف PowerPoint")

    # --- Color scheme ---
    clrScheme = root.find(".//a:clrScheme", NS)
    slots = {}
    if clrScheme is not None:
        for child in clrScheme:
            tag = child.tag.split("}")[-1]
            if tag in _SLOTS:
                slots[tag] = _hex_from(child) or slots.get(tag)

    # --- Font scheme ---
    major = minor = None
    fontScheme = root.find(".//a:fontScheme", NS)
    if fontScheme is not None:
        mj = fontScheme.find("a:majorFont", NS)
        if mj is not None:
            latin = mj.find("a:latin", NS)
            major = latin.get("typeface") if latin is not None else None
        mn = fontScheme.find("a:minorFont", NS)
        if mn is not None:
            latin = mn.find("a:latin", NS)
            minor = latin.get("typeface") if latin is not None else None

    # --- Determine light vs dark base ---
    dk1 = slots.get("dk1") or "#000000"
    lt1 = slots.get("lt1") or "#FFFFFF"
    # Most themes: dark text (dk1) on light bg -> academic; light text on dark bg -> dark-tech.
    base = "dark-tech" if _luminance(_rgb(dk1)) > 128 else "academic"

    # --- Map slots to our tokens ---
    if base == "dark-tech":
        main = slots.get("accent1") or slots.get("accent2") or "#4cc2ff"
        colors = {
            "main": main,
            "bgDark": slots.get("lt1") or "#0b1220",
            "surface": _lighten(_rgb(slots.get("lt1") or "#0b1220")) if slots.get("lt1") else "#121c33",
            "text": slots.get("lt1") or "#e8edf5",
        }
        # pick the accent that contrasts best against the surface
        accent = "gold"
        best = -1
        for a in _DARK_ACCENTS:
            cand = {"gold": "#e3b341", "sky": "#4cc2ff", "purple": "#9b6bff",
                    "teal": "#3fd6c4", "rose": "#ff7a90"}[a]
            c = _contrast(cand, colors["surface"])
            if c > best:
                best, accent = c, a
    else:
        navy = slots.get("dk2") or slots.get("dk1") or "#0F2D4A"
        teal = slots.get("accent1") or slots.get("accent2") or "#20B2AA"
        colors = {
            "navy": navy,
            "teal": teal,
            "bg": slots.get("lt2") or slots.get("lt1") or "#F8F7F2",
            "bg2": _mix(slots.get("lt2") or "#F8F7F2"),  # slight tint is hard; use lt1ish
            "card": "#FFFFFF",
            "gray": "",  # derived below
            "line": "#E3E8EE",
        }
        colors["gray"] = _gray_from(colors["bg"])
        accent = "navy"

    fonts = {
        "fh": _font_name(major) or "Changa Fe",
        "fb": _font_name(minor) or "Cairo Fe",
    }

    return {
        "name": "قالب مستورد من PowerPoint",
        "description": f"استُخرجت الهوية تلقائياً من ملف PowerPoint ({base == 'dark-tech' and 'داكنة' or 'فاتحة'})",
        "base": base,
        "colors": colors,
        "fonts": fonts,
        "accent": accent,
    }


def _font_name(name):
    if not name:
        return None
    # map common Microsoft fonts to our bundled fonts when close
    n = name.strip()
    if n.lower().startswith("calibri") or n.lower().startswith("candara"):
        return "Cairo Fe"
    if n.lower().startswith("segoe"):
        return "Cairo Fe"
    if n.lower().startswith("arial") or n.lower().startswith("tahoma"):
        return "Cairo Fe"
    return n


def _gray_from(bg_hex):
    r, g, b = _rgb(bg_hex)
    lum = _luminance((r, g, b))
    if lum > 128:
        return "#5A6E7F"
    return "#9FA9BE"


def _lighten(rgb):
    return "#%02X%02X%02X" % tuple(min(255, int(c * 0.25 + 255 * 0.75)) for c in rgb)


def _mix(hex_color, toward="#FFFFFF", amount=0.85):
    r, g, b = _rgb(hex_color)
    tr, tg, tb = _rgb(toward)
    return "#%02X%02X%02X" % (
        int(r * amount + tr * (1 - amount)),
        int(g * amount + tg * (1 - amount)),
        int(b * amount + tb * (1 - amount)),
    )
