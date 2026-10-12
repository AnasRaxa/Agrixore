# Agrixore — Product Requirements (PRODUCT.md)

> **Status:** Draft v1.0 · **Owner:** Anas (solo developer, final-year BSCS FYP) · **Last updated:** 2026-10-08
>
> **Purpose of this file:** the single source of truth for **WHAT** Agrixore is and what it must do.
> `ARCHITECTURE.md` explains **HOW** it is built. `CLAUDE.md` holds the **rules** for AI coding tools.
> If these documents disagree, stop and ask the owner; do not guess.

**Legend used throughout**

| Tag | Meaning |
|---|---|
| ✅ Decided | Confirmed by the owner. Do not change without asking. |
| 🟡 Assumption | Reasonable default chosen by the planner. Confirm before relying on it. |
| ❓ Open | Not decided. Do **not** invent an answer; ask the owner or flag it. |
| `[P1]`–`[P4]` | Delivery phase (see section 5). |

---

## 1. Product summary

**Agrixore** is an **offline-first Progressive Web App (PWA)** that works as a pocket farming assistant for farmers in Pakistan. A farmer points the phone at a crop leaf and gets an instant on-device disease diagnosis with practical treatment steps. The app also gives local weather with irrigation advice and daily market (mandi) prices. It is available in **Urdu (primary, right-to-left)** and **English**.

Think of it as a knowledgeable farm assistant who lives in the farmer's phone, keeps working when the signal drops, and speaks the farmer's language.

| Item | Value |
|---|---|
| Name | Agrixore |
| Type | Installable PWA (Android Chrome is the primary target) |
| Region | Pakistan (Punjab is the first focus) 🟡 |
| Languages | Urdu (RTL, primary), English ✅ |
| First crops | Corn (maize), wheat, cotton ✅ |
| Design direction | Minimal, basic, natural ✅ |
| Context | Final Year Project (FYP), solo build, no hard deadline now ✅ |
| Inspiration | The "Fasal Mitra" app (India). Inspiration only: do not copy its code, text, branding or screenshots ✅ |

### 1.1 Problem

Smallholder farmers often cannot identify crop diseases early, may not know the right low-cost treatment, depend on guesswork for irrigation timing, and lack transparent market prices. Connectivity in rural areas is unreliable, and many apps assume constant internet, an English-literate user, and a high-end phone.

### 1.2 Goals

1. Diagnose common diseases of corn, wheat and cotton from a leaf photo, **fully offline**.
2. Give clear, low-cost, safe treatment guidance in the farmer's language.
3. Provide weather, a 7-day forecast, and simple irrigation advice with timely alerts.
4. Show daily mandi prices with trends and alerts.
5. Be usable by low-literacy users on low-end Android phones.
6. Be honest: show confidence, say "not sure" instead of guessing, never overclaim.

### 1.3 Non-goals (for now)

- No payments, marketplace, or buying/selling of produce.
- No user accounts or login for farmers in Phase 1–2 (anonymous device-based identity only).
- No native iOS/Android store apps (PWA only).
- Not a replacement for an agriculture expert. Advice is **advisory only**.
- No crops beyond corn, wheat, cotton until the first three are validated.
- No live video or chat features before Phase 4.

---

## 2. Users

### 2.1 Primary persona — "Smallholder farmer"
- Grows corn, wheat or cotton on a few acres, often rain-fed or canal/tubewell irrigated.
- Android phone, often low-end, limited storage, patchy mobile data.
- Speaks Urdu (or Punjabi/Saraiki); may have limited reading ability.
- Wants fast, simple, actionable answers: "What is wrong, what do I do, is it safe?"

### 2.2 Secondary persona — "Progressive farmer / young family member"
- Comfortable with smartphones and WhatsApp.
- Manages several fields, wants reminders, comparisons and records.

### 2.3 Operator persona — "Admin / agriculture expert" `[P3]`
- Reviews and edits disease content, publishes prices and alerts, reviews feedback photos.
- Uses a separate web admin dashboard.

---

## 3. Product principles

1. **Offline-first.** Every Phase 1 feature must remain useful with no internet. Online is an enhancement.
2. **Honest AI.** Always show confidence. Prefer "unsure, retake the photo" over a wrong answer. Never present output as a certain diagnosis.
3. **Safety before cleverness.** Chemical advice is shown only from expert-reviewed content, with safety information.
4. **Low-literacy friendly.** Large touch targets, icons with labels, short sentences, one main action per screen.
5. **Minimal, basic, natural.** Calm greens and earthy neutrals, generous spacing, few colors, no clutter or decorative animation.
6. **Local first.** Pakistani units (acre, kanal, maund), PKR, Pakistani crops, districts and growing calendars.
7. **Privacy by default.** Photos stay on the device unless the user explicitly opts in. Location is coarse (district) unless the user grants GPS.
8. **Light on resources.** Small download, small model, fast on low-end phones, respectful of mobile data.

---

## 4. Scope map (feature index)

Priority: **M** = must, **S** = should, **C** = could.

| ID | Feature | Phase | Pri |
|---|---|---|---|
| F-PLAT-01 | Installable PWA shell and offline support | P1 | M |
| F-PLAT-02 | Onboarding (language, crop, location) | P1 | M |
| F-PLAT-03 | Settings and data management | P1 | M |
| F-I18N-01 | Urdu (RTL) and English | P1 | M |
| F-DD-01…08 | Disease detection core | P1 | M |
| F-WX-01…05 | Weather, irrigation advice, in-app alerts | P1 | M |
| F-MD-01…05 | Mandi prices, cache, local price targets | P1 | M |
| F-SH-01 | Share result via WhatsApp / system share | P1 | S |
| F-FLD-01…03 | My Fields, crop calendar, stage-aware irrigation | P2 | M |
| F-WX-10 | Spray window advisor | P2 | S |
| F-CAL-01…02 | Fertilizer and pesticide calculators (local units) | P2 | S |
| F-DD-10…15 | Photo guidance, severity, affected-area highlight, follow-up tracking, safe-use info, pests and viruses | P2 | S |
| F-MD-10…13 | Price trend charts, nearby market comparison, support prices | P2 | S |
| F-UX-01…04 | Pre-recorded Urdu audio, low-literacy mode, sunlight mode, performance budget | P2 | S |
| F-PUSH-01…02 | Real push alerts (weather, price targets) | P3 | M |
| F-MD-20 | Automated mandi price pipeline | P3 | M |
| F-ADM-01 | Admin dashboard with content review workflow | P3 | M |
| F-OUT-01 | Outbreak map (opt-in, anonymized) | P3 | S |
| F-FB-01 | Feedback and retraining loop (opt-in) | P3 | S |
| F-OTA-01 | Over-the-air model and content updates | P3 | S |
| F-SYNC-01 | Background sync of queued actions | P3 | S |
| F-DD-20 | Cloud second-opinion model when online and unsure | P3 | C |
| F-AI-01 | "Ask Agrixore" assistant (grounded in the knowledge base) | P4 | C |
| F-TEL-01 | Expert teleconsulting | P4 | C |
| F-I18N-10 | Punjabi, Saraiki, Pashto | P4 | C |

---

## 5. Phases

| Phase | Theme | Exit criteria |
|---|---|---|
| **P1 — Core** | The four original features, offline-first | Installable PWA; offline scan works on a real phone; weather and mandi work with cache; Urdu/English complete |
| **P2 — Practical tools** | Make it feel personal and useful | Fields and calendar drive irrigation and calculators; follow-up tracking works; pests/viruses added |
| **P3 — Backend intelligence** | Server-powered features | Push alerts, automated prices, admin dashboard, outbreak map, feedback loop, OTA updates |
| **P4 — Extensions** | Assistant and people | Claude-powered assistant, teleconsulting, more languages |

For the FYP, **P1 and P2 are the evaluated scope**. P3 and P4 are a documented roadmap. Do not start a later phase until the current one meets its exit criteria, unless the owner asks.

---

## 6. Feature specifications

### 6.1 Platform and shell `[P1]`

**F-PLAT-01 — Installable PWA, offline support**
- Web app manifest (name, short name, icons including maskable, theme color, `display: standalone`, `start_url`, `lang`, `dir`).
- Service worker precaches the app shell, fonts, icons, ML runtime and model.
- Install prompt offered at a sensible moment (after first successful scan), never on first load.
- Update flow: when a new version is available show a small "Update available" banner; update on user tap.
- Request persistent storage (`navigator.storage.persist()`) after install so scan history is not evicted.
- Acceptance: with airplane mode on, the installed app opens, switches language, scans a leaf, shows history, and shows cached weather and prices with "last updated".

**F-PLAT-02 — Onboarding** (max 3 short steps, skippable)
1. Choose language (Urdu / English).
2. Choose main crop(s): corn, wheat, cotton (multi-select).
3. Choose location: allow GPS **or** pick province → district manually.
- Acceptance: onboarding result is stored locally; all steps can be changed later in Settings; skipping leaves sensible defaults (Urdu if device language is Urdu, otherwise show picker; last-used crop; no location prompt until Weather is opened).

**F-PLAT-03 — Settings and data management**
- Language, crops, location, units, text size (Normal / Large / Extra large), theme (Light / Sunlight high-contrast), low-literacy mode `[P2]`.
- Storage usage view, "clear scan history", "clear all local data".
- About screen: app version, model version, content version, data sources, disclaimer, licenses.

### 6.2 Multilingual `[P1]` — F-I18N-01
- Languages: **Urdu (ur, RTL, primary)** and **English (en, LTR)**. ✅
- Every user-visible string comes from locale files. No hard-coded text in components.
- Switching language is instant, persists, and sets `lang` and `dir` on the document.
- Numerals: show Western digits by default for prices and measurements 🟡; make it a setting later.
- Disease content, calendar content and alert messages exist in both languages.
- Urdu copy uses simple everyday words, short sentences, and is reviewed by a native speaker before release.
- Acceptance: no layout breakage in RTL; no untranslated keys; icons that imply direction (arrows, back) are mirrored.

### 6.3 Disease detection `[P1]` — the flagship feature

**Flow:** Home → **Scan** → choose crop → capture or pick photo → on-device analysis → result report → save to history → share / follow-up.

**F-DD-01 Capture.** Take a photo with the camera (rear camera preferred) or choose from gallery. Works offline.

**F-DD-02 Crop selection.** Chips: Corn, Wheat, Cotton, and "Not sure". Default to the last used crop. A chosen crop restricts predictions to that crop's classes (higher accuracy). "Not sure" runs all classes and caps the displayed trust level (lower confidence by design).

**F-DD-03 Not-a-leaf rejection.** If the photo does not look like a plant leaf, say so clearly and ask for a new photo. Never guess. Implemented with a dedicated `not_a_leaf` class plus a confidence threshold.

**F-DD-04 On-device inference.** The model runs in the browser in a Web Worker. No image leaves the device. Targets 🟡 (to be measured on a real mid-range Android phone): model download ≤ ~10 MB, inference ≤ ~3 s after the model is loaded, UI never freezes.

**F-DD-05 Result states.**

| State | Condition (initial thresholds, tunable after calibration) | UI behavior |
|---|---|---|
| Confident | top confidence ≥ 0.80 | Show disease, confidence, full report |
| Possible | 0.50 ≤ confidence < 0.80 | "Possibly X" plus second-best guess; suggest retaking a clearer photo |
| Unsure | confidence < 0.50 | "We are not sure". Tips for a better photo; suggest asking an expert |
| Healthy | healthy class wins | Reassuring message and prevention tips |
| Not a leaf | `not_a_leaf` wins | "This does not look like a leaf" |
| Error | model failed to load or run | Friendly message, retry, never crash |

Threshold values live in a shared constants file and are finalized after calibration on a validation set.

**F-DD-06 Report content** (from the knowledge base, in the selected language):
1. Disease name (Urdu and English), crop, confidence level (percentage plus a plain-word label).
2. What it is and how it spreads (short).
3. Symptoms to confirm by looking at the plant.
4. Prevention.
5. Treatment, **in this order:** cultural practices → organic / biological → chemical (last resort).
6. Safety notes (protective gear, waiting period before harvest, keep away from bees and water sources) next to every chemical option.
7. "When to call an expert".
8. Review badge: **Reviewed by expert** or **Draft: not yet reviewed**.
9. Disclaimer: advisory only.
- Chemicals are written as **generic active ingredients, not brand names**. Dosage is shown only for content marked `reviewed`. 🟡

**F-DD-07 History.** Every scan is saved locally: thumbnail, crop, result, confidence, date, model version. List screen with open, delete, and filter by crop. Storage is capped and old full-size images are trimmed first, keeping thumbnails.

**F-DD-08 Result sharing.** See F-SH-01.

**Phase 2 additions**
- **F-DD-10 Photo guidance:** before analysis, detect blur, darkness and glare; say "move closer / too dark / hold steady".
- **F-DD-11 Severity:** mild / moderate / severe estimate with severity-specific advice. Needs labeled data; ship only if validated.
- **F-DD-12 Affected-area highlight:** show which part of the leaf drove the prediction (heatmap overlay) to build trust.
- **F-DD-13 Follow-up tracking:** after a diagnosis, offer a reminder in 5–7 days; re-scan and show side-by-side comparison: "Improving / Same / Worse".
- **F-DD-14 Safe-use information:** a standard safety block shown for every chemical option.
- **F-DD-15 Pests and viruses:** extend beyond leaf diseases. Examples to evaluate: cotton leaf curl virus and whitefly damage. Adds classes and needs extra data.

**Phase 3 addition**
- **F-DD-20 Cloud second opinion:** when online and the on-device result is Possible/Unsure, offer "Double-check online". A larger model on the Node server returns a second result. Must be clearly labeled as a second opinion. Needs explicit user tap each time (photo upload consent).

**Candidate disease catalog** ❓ *(final list is decided only after a dataset audit; do not hard-code classes beyond what the shipped model manifest declares)*

| Crop | Candidate classes |
|---|---|
| Corn (maize) | gray leaf spot, common rust, northern leaf blight, healthy |
| Wheat | yellow (stripe) rust, brown (leaf) rust, powdery mildew, septoria leaf blotch, healthy |
| Cotton | cotton leaf curl virus, bacterial blight, Alternaria leaf spot, healthy |
| All | `not_a_leaf` |

### 6.4 Weather and irrigation `[P1]`

**F-WX-01 Current conditions.** Temperature, humidity, wind speed, short condition label with icon, "last updated" timestamp.

**F-WX-02 7-day forecast.** Per day: min/max temperature, rain probability, expected rain amount.

**F-WX-03 Location.** Use GPS if allowed, else the chosen district. Support saving multiple locations `[P2 with Fields]`.

**F-WX-04 Irrigation advice (rule-based).** One plain sentence at the top, for example "Rain expected tomorrow: skip watering today" or "No rain expected: irrigate as usual". Initial rules (all thresholds are config constants, to be reviewed with an agronomist ❓):
- Rain probability high or expected rainfall meaningful in the next 24–48 h → advise skipping or delaying irrigation.
- Very hot day → advise irrigating in the early morning or evening.
- Otherwise → "irrigate as usual".

**F-WX-05 In-app alerts** (no push in P1). On opening Weather/Home, compute alerts from the cached forecast and show a banner for **heavy rain, frost, heatwave**. Defaults to review ❓: frost if forecast minimum ≤ 2 °C; heatwave if forecast maximum ≥ 40 °C; heavy rain by daily rainfall threshold. Messages are in both languages.

**Offline:** the last successful forecast is shown with its age. If older than 24 h, show a "may be out of date" warning.

**F-WX-10 Spray window advisor `[P2]`.** "Good time to spray today: wind is low, no rain for the next few hours." Based on hourly wind and rain.

### 6.5 Mandi prices `[P1]`

**F-MD-01 Price list.** Filter by commodity, province, district; each row shows market name, location, min / modal (typical) / max price, and **market date**. Prices are in **PKR per 40 kg (maund)** unless a commodity uses another unit, and the unit is always displayed. 🟡

**F-MD-02 Commodities.** Start with wheat, rice, maize, cotton, onion, potato, tomato 🟡; list is configurable.

**F-MD-03 Offline cache.** Last fetched prices are stored with the fetch time; always show "prices as of <market date>, fetched <time>".

**F-MD-04 Local price targets.** User sets "alert me when wheat reaches X in district Y". In P1 targets are stored locally and checked on every refresh when the app is opened. True background push comes in P3.

**F-MD-05 Data source status.** ❓ **Unresolved and high risk.** No verified open Pakistani mandi price API is confirmed. A one-week spike must evaluate official or public sources (for example provincial agriculture marketing portals) for availability, format and terms of use. Until resolved:
- P1 uses a **seeded/admin-entered dataset** behind the same API shape, clearly marked with its date. Admin entry now exists: see `docs/ADMIN_AND_API.md`.
- Never fabricate prices. Never show seeded data as "live".

**Phase 2:** F-MD-10 trend charts (7 / 30 days), F-MD-11 nearby market comparison, F-MD-12 government support prices (only once a verified source exists), F-MD-13 commodity favorites.
**Phase 3:** F-MD-20 automated daily ingestion pipeline.

### 6.6 Sharing `[P1]` — F-SH-01
- "Share" on a result creates an image (and/or short text) with crop, disease, confidence, top advice, and Agrixore attribution; shared via the Web Share API (with files where supported), falling back to a WhatsApp link with text and a download.
- The shared image never includes GPS or EXIF data.

### 6.7 My Fields and crop calendar `[P2]`

**F-FLD-01 My Fields.** A field has: name, crop, optional variety, sowing date, area (value + unit: acre / kanal / marla), location (district, optional coarse coordinates), optional irrigation source (canal / tubewell / rain-fed), optional soil note. Stored locally. Multiple fields supported.

**F-FLD-02 Crop calendar.** From crop + sowing date, compute the growth stage and show the next recommended tasks (irrigation, fertilizer, spraying, scouting) in the selected language. Calendar content is regional and **must be sourced from official agriculture guidance and expert-reviewed** ❓; never invent agronomic timings.

**F-FLD-03 Stage-aware irrigation.** Combine growth stage, recent and forecast rain, and evapotranspiration to say "water today / skip / water in N days". Falls back to P1 rules when a field is missing data.

### 6.8 Calculators `[P2]` — F-CAL-01/02
- **Fertilizer calculator:** amount of common fertilizers for a given area and crop stage, using recommended rates from official guidance ❓ (rates are data, not hard-coded logic; review status shown).
- **Pesticide mix calculator:** product amount per spray tank and per acre, with user-entered tank size and presets 🟡.
- Units: acre, kanal, marla; kg, maund; liter. See the glossary for conversions.
- Always show a safety reminder and "follow the product label".

### 6.9 UX accessibility features `[P2]`
- **F-UX-01 Pre-recorded Urdu audio** for key advice (more reliable offline than text-to-speech; speech synthesis for Urdu varies by device, so test before relying on it).
- **F-UX-02 Low-literacy mode:** larger icons, fewer words, one action per screen.
- **F-UX-03 Sunlight mode:** high-contrast theme for outdoor use.
- **F-UX-04 Performance budget:** see ARCHITECTURE.md; verified with Lighthouse and real low-end devices.

### 6.10 Server-powered features `[P3]`
- **F-PUSH-01/02 Push alerts:** weather (rain, frost, heat) and price-target alerts delivered as web push. Requires opt-in. On iOS, web push only works when the PWA is added to the Home Screen.
- **F-ADM-01 Admin dashboard:** manage disease content with draft → reviewed workflow, manage commodities and prices, send broadcast alerts, publish model versions, review feedback photos.
- **F-OUT-01 Outbreak map:** opt-in anonymized scan counts per district, crop and disease, shown only when a minimum count is reached (k-anonymity) so individuals cannot be identified.
- **F-FB-01 Feedback loop:** "this result was wrong" with the correct label; with explicit consent the photo is uploaded, location/EXIF stripped, and queued for expert review before entering any training set.
- **F-OTA-01 Over-the-air updates:** new model and content versions are downloaded in the background, verified by checksum, and swapped in without breaking an ongoing scan.
- **F-SYNC-01 Background sync:** queued opt-in uploads and alert preferences sync when the connection returns.

### 6.11 Extensions `[P4]`
- **F-AI-01 Ask Agrixore:** Claude-powered assistant, Urdu and English, answering only from the reviewed knowledge base plus the user's field context; says "I don't know" and refers to an expert when outside it.
- **F-TEL-01 Teleconsulting:** share a scan with an agriculture expert and chat or call. Needs real-time infrastructure and moderation; defer.
- **F-I18N-10 More languages:** Punjabi, Saraiki, Pashto.

---

## 7. Screens and navigation

Bottom navigation (4 items, large targets): **Home · Scan · Weather · Mandi**. Header: history, settings, language toggle.

| Screen | Phase | Notes |
|---|---|---|
| Home | P1 | Greeting, big "Scan a crop leaf" button, shortcuts (Weather, Mandi, My Fields), any active alert banner, "Works offline" indicator |
| Scan | P1 | Crop chips, camera/gallery buttons |
| Result | P1 | Report per F-DD-06, share, save, follow-up |
| History | P1 | List of past scans |
| Weather | P1 | Current + 7-day + irrigation advice + alerts |
| Mandi | P1 | Filters + price list + price targets |
| Settings | P1 | See F-PLAT-03 |
| Onboarding | P1 | 3 steps |
| My Fields / Field detail | P2 | Fields, calendar, tasks |
| Calculators | P2 | Fertilizer, pesticide |
| Price trends | P2 | Charts |
| Outbreak map | P3 | Opt-in |
| Admin (separate app) | P3 | Not part of the farmer PWA |

---

## 8. Design direction ✅ minimal, basic, natural

- **Mood:** calm, trustworthy, close to nature. Plenty of white space. No stock-photo clutter.
- **Color:** a primary leaf green, a lighter green tint for cards, warm off-white background, one warm accent (amber) for warnings, a clear red only for danger. Define as design tokens; verify contrast (WCAG AA) in light and sunlight modes. Exact hex values ❓ to be chosen when the UI is built.
- **Typography:** one Latin font and one Urdu font, **self-hosted** (works offline). Urdu font ❓: Naskh style is more legible at small sizes; Nastaliq is traditional but taller and heavier. Implement via a CSS variable so it can be swapped easily.
- **Components:** rounded cards, a prominent primary button, simple line icons with labels, chips for crop choice, one clear focal action per screen.
- **Touch targets:** minimum 48×48 px; body text at least 16 px; supports a text size setting.
- **Motion:** minimal; respect `prefers-reduced-motion`.
- **Layout:** mobile-first (target width ~360 px), usable up to tablet. Use logical CSS properties so RTL works by default.
- **Inspiration screens** (reference only): Home with a large scan button and shortcuts; scan screen with crop chips and a result strip with confidence; weather with a one-line irrigation tip; mandi list with modal/min/max and market date; scan history list. Build original visuals and copy.

---

## 9. Content and knowledge base rules

- Disease, prevention and treatment content lives in `content/` as structured JSON (schema in ARCHITECTURE.md), versioned in Git, in **both languages**.
- Each entry has `reviewStatus: "draft" | "reviewed"`, `reviewedBy`, `reviewedAt`, and `sources`.
- **AI-drafted agronomic or chemical text is always `draft`** until a qualified person reviews it. Chemical dosage is never shown for drafts.
- Prefer sources such as Pakistani agricultural research and extension bodies and the provincial agriculture department ❓ (to be identified and recorded per entry).
- Never invent diseases, dosages, prices, dates, calendars or statistics.

---

## 10. Data sources and status

| Data | Source | Status |
|---|---|---|
| Weather and forecast | Open-Meteo API (no key, free for non-commercial use; check terms before any commercial use) | 🟡 chosen, verify terms |
| Mandi prices | Interim: typed in by hand in the admin dashboard. Automated source still unknown; spike required (see F-MD-05) | 🟡 interim, ❓ automation open |
| Corn images | PlantVillage-style public dataset | 🟡 verify license |
| Wheat and cotton images | ❓ To be found (Kaggle, Mendeley and similar) plus own field photos | ❓ Open |
| Crop calendars, fertilizer rates | ❓ Official agriculture guidance, expert-reviewed | ❓ Open |
| District list and coordinates | ❓ Needs a verified list for Pakistan | ❓ Open |

Always record each dataset's license, source URL and citation in `ml/DATASETS.md`.

---

## 11. Success metrics and evaluation plan

**ML (report all in the FYP):** per-class precision, recall, F1; confusion matrix; overall accuracy; calibration (is "90 % confident" right about 90 % of the time?); accuracy on a **separate field-photo test set** (lab images overstate real performance); model size; on-device latency on a real low-end phone.

**Product:**
- Offline test: the full P1 flow works in airplane mode.
- Lighthouse PWA audit passes; installable.
- Usability test with at least 3–5 real farmers or agriculture students; record task success and feedback.
- Urdu quality review by a native speaker; content review by an agriculture expert.
- Performance: loads on a throttled 3G profile in an acceptable time; initial JS size within the budget in ARCHITECTURE.md.

---

## 12. Risks and open decisions

| # | Risk / decision | Mitigation |
|---|---|---|
| 1 | Wheat and cotton datasets may be thin or poorly licensed | Audit first; collect own field photos; ship only validated classes and say so |
| 2 | Lab-image accuracy will not match real fields | Separate field test set; calibrate confidence; "unsure" state |
| 3 | No verified mandi data source | Spike; admin-entered fallback; never mislabel seeded data as live |
| 4 | Treatment content could cause harm if wrong | Expert review gate; draft badge; no dosage for drafts; safety block |
| 5 | Scope is large for one developer | Strict phases; P1/P2 are the evaluated scope |
| 6 | iOS limits on push and storage eviction | Document; request persistent storage; push only for installed PWAs |
| 7 | Urdu TTS quality varies by device | Use pre-recorded audio for key advice |
| 8 | Privacy of photos and location | Opt-in only, coarse location, EXIF stripped, k-anonymity |

**Open decisions for the owner:** hosting providers; AI coding tool (Claude Code recommended); Urdu font; color palette; mandi source; final disease class list; expert reviewer (supervisor or extension contact).

---

## 13. Glossary and local units

| Term | Meaning |
|---|---|
| Mandi | Wholesale agricultural market |
| Maund | 40 kg (metric maund) 🟡 |
| Seer | 1/40 maund = 1 kg 🟡 |
| Acre | 43,560 sq ft |
| Kanal | 5,445 sq ft; 8 kanal = 1 acre |
| Marla | 272.25 sq ft; 20 marla = 1 kanal |
| Modal price | The most common traded price in a market on a given day |
| PKR | Pakistani rupee |
| PWA | Progressive Web App: a web app that can be installed and work offline |
| Service worker | Background script that caches files and handles offline use and push |
| ONNX | Open model format used to run the trained model in the browser |
| EXIF | Metadata in photos (can include GPS location) |

Regional definitions of marla and kanal vary; keep conversion constants in one shared file and confirm the standard with the owner. 🟡

---

## 14. Legal, ethical and attribution

- Show a clear **advisory-only disclaimer** in the app (About, and on every treatment report).
- Respect all dataset and API licenses; keep attributions in the About screen and in `ml/DATASETS.md`.
- Fasal Mitra (GitHub and Play Store) is **inspiration only**. Do not copy its code, text, branding, icons or screenshots. If any open-source code is reused, honor its license and credit the authors.
- Collect the minimum data; no accounts in P1–P2; explain clearly what is stored and where.
