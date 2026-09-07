# AI Presentation Generator — Visual Identity / Templates / Slide-range Plan

## Goal
Transform the presentation generator from 2 fixed themes into a full **visual-identity system**:
- **Custom AI-generated themes** (not tied to 2 fixed templates)
- **Template gallery** with preview cards (built-in + user templates) to pick before generating
- **Template CRUD**: create, import (JSON + PPTX identity extraction), export (JSON)
- **Template-generation-prompt section**: user describes an identity → AI produces a theme
- **Auto-generate template by topic**
- **Slide-count range** selector

Scope decision (user-confirmed): all features now; PPTX support = **extract visual identity** (colors/fonts) from an uploaded `.pptx`, not full native layout editing.

---

## Core architectural insight

The render engine (`backend/presentation_engine/engine.py`) builds each slide as HTML rendered to a 2560×1440 PNG, then assembles PNGs into PPTX/PDF. The visual identity lives **entirely inside a CSS string** per theme, and template *renderer functions* are keyed by `theme_name`:

```python
THEMES = {"academic": ACAD, "dark-tech": DARK}
def render_slide(d, css, theme_name):
    fn = THEMES[theme_name]["templates"][d["template"]]
```

**Decision:** Custom themes are **derived identities** — they **reuse the base theme's template renderer set** (`academic` or `dark-tech`) but **override CSS variables** (colors/fonts/accent). This is safe (we never render arbitrary AI-generated HTML template functions) and maps perfectly to the existing CSS-variable design (`.slide { --navy; --teal; --bg; ... }` for academic, `--main` + accent classes for dark).

The deck JSON `theme` field becomes either:
- a **string** (legacy `"academic"` / `"dark-tech"`, or a saved-template id) → resolved to a stored blueprint
- a **full theme object**: `{ base, colors, fonts, accent }` (used when creating ad-hoc / generated themes)

---

## Data model — new `templates` table (mirrors `prompts` pattern)

`backend/database.py`:
```sql
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'system',   -- 'system' = built-in
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    base TEXT NOT NULL DEFAULT 'academic',      -- 'academic' | 'dark-tech'
    colors_json TEXT NOT NULL DEFAULT '{}',      -- {navy,teal,bg,bg2,card,gray,line} or {main, bgDark, surface, text}
    fonts_json TEXT NOT NULL DEFAULT '{}',        -- {fh, fb} font names
    accent TEXT DEFAULT 'gold',                   -- dark accent class
    preview_b64 TEXT,                             -- optional small preview PNG (data URI)
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
DB helpers: `list_templates(user_id, include_system=True)`, `save_template(...)`, `delete_template(id)` (only non-default), `get_template(id)`.

Built-in seed rows on startup (in `init_db`): the two existing themes as `templates` entries (`academic`, `dark-tech`) so the gallery is populated by default.

---

## Backend changes

### 1. `backend/services/presentation_service.py`
- **`DECK_SYSTEM_PROMPT`**: make slide-count dynamic. Replace hardcoded `"عدد الشرائح: من 8 إلى 15"` with a formatted `{min_slides}-{max_slides}` interpolated at call time.
- Add helper **`_theme_instruction(theme)`**: if `theme` is an object/blueprint, append a "الهوية البصرية" instruction block describing the generated colors/fonts so the AI can pick accents; else append label of the base theme.
- **`generate_deck` / `generate_deck_with_source` / `create`**: accept `min_slides=8, max_slides=15` and a `theme` that may be a string **or** dict. Thread through to the prompt.
- **`normalize_deck(raw, theme)`**: relax the 2-value whitelist;
  - if `theme` is a dict → keep it intact on the deck (`deck["theme"] = theme`), and use its `base` to pick the allowed template set (`TEMPLATES_ACADEMIC` or `TEMPLATES_DARK`).
  - if `theme` is a string that matches a saved template / builtin → keep string.
  - else fallback to `academic`.
- **`normalize_deck` truncation**: change `slides_in[:15]` → `slides_in[:max_slides]` (param).
- **New `build_theme_object(...)`**: converts a colors/fonts dict + base into the deck `theme` object.
- **`render_deck`**: pass the deck's theme object through (no change needed if engine reads it).

### 2. `backend/presentation_engine/engine.py`
- New function **`resolve_theme(deck)`**:
  - read `deck.get("theme")`.
  - if dict → use `base` to select renderer set, then **build a CSS override string** from `colors`/`fonts`.
  - if string → look up `THEMES` (builtin) as today; missing → `academic`.
- **CSS override builder** `build_theme_css(base_css, colors, fonts)`:
  - Appends a second `<style>` block (or returns a small override string) like:
    ```css
    .slide{--navy:#__;--teal:#__;--bg:#__;--bg2:#__;--card:#__;--gray:#__;--line:#__;--fh:'__';--fb:'__'}
    ```
    for academic base, or `--main` + accent + `--bg` overrides for dark base.
  - Font override: remap font names — only `Cairo Fe`/`Changa Fe` are bundled. Accept any user/PPTX font name but **fall back** to the bundled fonts (safe). Keep it simple: allow choosing between the two bundled fonts or default.
- **`main()`**: replace `theme = THEMES.get(deck.get("theme"))` with `theme, css_override = resolve_theme(deck)`; pass combined CSS to `build_html`. Keep crashing only if base is unknown.
- **per-slide accent**: allow `d.get("accent")` already works in dark templates — nothing needed.

### 3. `backend/presentation_engine/artgen.py` (optional, low-priority)
Custom themes won't regenerate the 15 background PNGs (they're academic-palette). Keep the existing art, but make the **overlay tint** in `engine.py` `.hasart` follow the theme bg color if overridable. Minimum viable: leave art static; note as enhancement.

### 4. `backend/routes/api.py` — endpoints
Reuse header/auth/rate-limit conventions (`_pres_headers`, `_get_current_user`, `_check_rate_limit`).

- Extend **`PresentationGenerateRequest`**:
  ```python
  theme: Optional[Union[str, Dict]] = "academic"     # string id OR blueprint object
  slide_min: Optional[int] = 8
  slide_max: Optional[int] = 15
  ```
  Thread `req.slide_min`/`req.slide_max` into `create`.

- New endpoints:
  - `GET  /api/presentation-templates` → `{ templates: [...] }` (user + system)
  - `POST /api/presentation-templates` → create/update a template `{title, description, base, colors, fonts, accent}` → `{template}`
  - `DELETE /api/presentation-templates/{id}` → only non-default
  - `POST /api/presentation-templates/generate` → **template-generation prompt**:
    body `{ identity_goal }`; calls new `AIService.generate_template_theme()` (meta-prompt → JSON blueprint `{base, colors, fonts, accent, title, description}`); returns parsed blueprint (not saved unless user saves).
  - `POST /api/presentation-templates/from-pptx` → multipart upload of a `.pptx`; backend extracts colors+fonts (see §5) → returns a blueprint.
  - `POST /api/presentation-templates/auto` → auto-generate by topic: body `{ topic }` → calls AI to produce a theme blueprint.

### 5. PPTX identity extraction — `backend/services/pptx_theme_extractor.py` (new)
Uses `python-pptx` (already a dependency via engine).
- Open `.pptx` via `gzip` of `ppt/theme/theme1.xml` directly (or `python-pptx` iterating).
- Parse `a:clrScheme` → extract the 12 color slots (`dk1, lt1, dk2, lt2, accent1..accent6`). Map to our CSS vars: pick `dk2/accent1` as navy/teal equivalents heuristically.
- Parse `a:fontScheme` → majorFont (`fh`) and minorFont (`fb`).
- If multiple accents, choose best contrast → set `accent`.
- Detect dark vs light base by `lt1/dk1` luminance.
- Return `{ base, colors: {...mapped...}, fonts: {fh, fb}, accent }` blueprint + a generated preview color swatch card.
- Rejection: not a valid OOXML zip / no theme → 400 with clean message.

> Note: font names from user PPTX may not be bundled; engine falls back to bundled Cairo/Changa — acceptable for v1, documented.

### 6. `backend/services/ai_service.py` — new `generate_template_theme`
Mirror `generate_custom_prompt` (meta-prompt + `json_mode=True` + fence-strip + `json.loads` + fallback):
```
system: "أنت مصمم هويات بصرية للعروض التقديمية... أعد JSON:
{ name, base: 'academic'|'dark-tech', colors:{...}, fonts:{...}, accent:'gold',
  description } "
user: "صف الهوية البصرية المطلوبة: {identity_goal}"
```
Return the blueprint dict; on AI failure return a deterministic fallback from keywords (dark→dark base with accent, else academic with a color).

### 7. Auto-generate by topic
Same `generate_template_theme` but the user prompt is `"موضوع العرض: {topic} — صمّم هوية بصرية مناسبة معربة مناسبة للموضوع"`. One backend endpoint.

---

## Frontend changes

### `frontend/src/services/api.js`
Add:
- `fetchTemplates()` → `GET /api/presentation-templates`
- `saveTemplate(payload)` / `deleteTemplate(id)`
- `generateTemplateTheme(identityGoal)` → `POST .../generatedthemes/generate`
- `autoTemplate(topic)` → `POST .../auto`
- `importTemplateFromPptx(file)` → FormData upload to `.../from-pptx`
- Extend `generatePresentation({ ..., theme, slideMin, slideMax })` to send `slide_min`, `slide_max`, and `theme` (string **or** object).

### `frontend/src/components/PresentationView.jsx`
- **State additions**: `templates[]`, `selectedTemplateId`, `slideMin`, `slideMax`, `templateModalOpen`, `extractedIdentity` (from PPTX), plus template-generation form state.
- **Replace the 2 fixed `THEMES` buttons** with:
  - A **template gallery grid** of preview cards (built-in + user templates). Each card shows a color-swatch preview (reuse `swatches` or render mini palette from `colors`), name, description, "استخدام" select. Selecting sets `selectedTemplateId` and (for the generate flow) resolves to a theme string or object.
  - A toolbar: **"حسب الموضوع (تلقائي)"**, **"توليد هوية بوصف"** (opens template-generation modal), **"استيراد من PowerPoint"** (file input), **"قالب جديد يدوياً"**.
- **Template-generation modal** (`TemplateModal.jsx`, new): 3 tabs — Visitor/Manual (form: name, base, palette colors, accent, description), Generate-with-AI (textarea identity description → `generateTemplateTheme`), Auto-by-topic (topic → `autoTemplate`). Shows resulting preview swatches; "حفظ كقالب" and "استخدام الآن".
- **PPTX import**: file input → `importTemplateFromPptx` → shows extracted identity preview → "حفظ كقالب" / "استخدام".
- **Export**: per-template "تصدير JSON" button → Blob download of `{base, colors, fonts, accent, title, description}`.
- **Slide-count range UI**: in the تهيئة section, two number inputs or a dual range `slideMin`–`slideMax` (labels عدد الشرائح الأدنى/الأقصى). Pass to `handleGenerate`.
- **`themeLabel` fix**: derive editor subtitle from `deckJson.theme` (persist correct identity after opening a saved deck).

### New `frontend/src/components/TemplateModal.jsx`
Reusable modal (styles mirror ApiKeyModal/PromptManagerModal). Contains the gallery→generate/edit/AI flows.

---

## Files to modify/create
**Modify:**
- `backend/database.py` — `templates` table + helpers + seed built-ins
- `backend/services/presentation_service.py` — dynamic prompt, theme-object support, slide range
- `backend/presentation_engine/engine.py` — `resolve_theme` + CSS override
- `backend/routes/api.py` — extended generate req + template endpoints
- `backend/services/ai_service.py` — `generate_template_theme`
- `frontend/src/services/api.js` — new API fns
- `frontend/src/components/PresentationView.jsx` — gallery, range, wiring

**Create:**
- `backend/services/pptx_theme_extractor.py`
- `frontend/src/components/TemplateModal.jsx`

---

## Verification (E2E)
1. **Backend start** (uvicorn) + `GET /api/presentation-templates` returns the 2 built-ins.
2. **Generate with slide range**: POST `/generate` with `slide_min=5,slide_max=9` → verify deck has 5–9 slides (mock AI not required to hit exact, but cap works; verify `_normalize` truncates at max).
3. **Custom theme object**: POST `/generate` with `theme={base:'academic',colors:{navy:'#112233',teal:'#33aabb',bg:'#fafafa'}}` → deck JSON retains the object; run `engine.py` on the deck → renders PNGs with new colors (open preview.html / sample slide PNG).
4. **Template CRUD**: create template via POST → appears in GET → delete works; non-default only.
5. **Template generation prompt**: POST generate with `identity_goal='أزرق داكن فخم بلمسات ذهبية'` → returns blueprint with `base:'dark-tech'`, accent gold/blue.
6. **Auto by topic**: POST auto with topic → returns a suitable blueprint.
7. **PPTX extraction**: craft/upload a small `.pptx` (colored theme) → returns `{colors, fonts, base}`; then use it to generate + render.
8. **Frontend**: build (`npm run build`), then browser (agent-browser headed): open presentations tab → gallery visible with preview cards → select a card → set slide range → generate → open editor shows identity → render → slides reflect theme colors.
9. **Regression**: existing `academic` / `dark-tech` string themes still render identically.

## Risks / notes
- **PPTX theme.xml parsing** is heuristic (color-mapping to CSS vars). Keep it best-effort with a clean fallback to academic.
- **Fonts**: only `Cairo`/`Changa` bundled; foreign fonts fall back. Document in UI hint.
- **Background art** stays static academic artwork; custom tints not fully per-theme in v1.
- No DB schema migration tool beyond `CREATE TABLE IF NOT EXISTS` in `init_db` — add table there.
