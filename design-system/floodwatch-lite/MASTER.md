# FloodWatch Lite — Design System & UI/UX Plan

Source of truth for the website's look and behaviour. Page-specific rules can go in `pages/<page>.md` and override this file.

- **Claude Design system** (tokens, 17 components, icons, brand book — Dark + Light): https://claude.ai/artifact/DhyT8Lm4tzVcFmWanVpKiE
- **Claude Design screens** (19 artboards, mobile 390 + desktop 1440): https://claude.ai/artifact/4p9L4PFryaLLLkgBjfMrXK
- Figma (Dark-only copy of the Claude Design system — all tokens + 27 components on "Design System", all 19 screens on "Screens", built from component instances, 2026-10-22):
  [FlootWatch-design](https://www.figma.com/design/RxQHYzvJHcAOOm2lEXvVHJ/FlootWatch-design)

> The Claude Design system supersedes a few dark values below for contrast: `border-strong` #6F97A6,
> `status-danger-text` #FCA5A5, `status-offline-text` #B8C4D2. Token names there are flat (`bg-canvas`,
> `status-danger-text`, …) and match the CSS custom properties the website should use.

---

## 1. Principles

1. **Safety first, fast to read.** Someone may be standing in rising water. The danger message, the nearest
   safe zone and the call buttons must be readable in under 3 seconds on a cheap phone in the rain.
2. **Never color alone.** Every status = **icon + word + color** (Normal / Warning / Danger / Offline).
3. **Dark first.** Dark UI over a dark map: less glare at night, longer battery, status colors stand out.
4. **Big targets.** Min touch target 44 × 44 px; urgent actions 56 px tall.
5. **Works on bad signal.** Hotlines cached offline; skeletons, not spinners; clear "offline / last updated" labels.
6. **Plain language.** "Water at 72 cm and rising", not "L=72.0 Δ+2.1".

Style: **Minimalism / Swiss** — flat surfaces, one accent, clear grid, no gradients or 3D except the map.

---

## 2. Color

Brand palette (team): `#1D3E53` `#254B62` `#476D7C` `#77ABB7`. Extended with darker navies for dark mode and
a separate **status** set (green / amber / red / slate), which is *not* brand color and is reserved for flood status.

> Figma Starter plan allows **1 mode per collection**, so Figma holds **Dark** only. The **Light** column below is the
> agreed mapping for later (add as a second mode on a paid plan, or a `[data-theme="light"]` block in CSS).

### Primitives

| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| navy/950 | `#0B1B26` | | red/600 | `#DC2626` |
| navy/900 | `#12293A` | | red/400 | `#F87171` |
| navy/800 | `#1D3E53` (brand) | | red/950 | `#3B1218` |
| navy/700 | `#254B62` (brand) | | amber/400 | `#FBBF24` |
| navy/600 | `#476D7C` (brand) | | amber/950 | `#3A2A0A` |
| teal/400 | `#77ABB7` (brand) | | green/400 | `#4ADE80` |
| teal/300 | `#9CC8D1` | | green/950 | `#0F2E1E` |
| teal/100 | `#D6E8EC` | | slate/500 | `#64748B` |
| teal/50 | `#EEF5F7` | | slate/400 | `#94A3B8` |
| ink/100 | `#F1F6F8` | | ink/300 | `#A9C4CC` |
| ink/400 | `#8FB3BD` | | white | `#FFFFFF` |

Light-mode extras: red/700 `#B91C1C`, red/50 `#FEF2F2`, amber/700 `#B45309`, amber/50 `#FFFBEB`,
green/700 `#15803D`, green/50 `#F0FDF4`, slate/600 `#475569`.

### Semantic tokens (CSS name = `--color-<token with / → ->`)

| Token | Dark | Light (later) | Use |
|---|---|---|---|
| bg/canvas | navy/950 | teal/50 | page background |
| bg/surface | navy/900 | white | nav bars, sheets, cards on canvas |
| bg/raised | navy/800 | white | cards on surface, inputs |
| bg/hover | navy/700 | teal/100 | hover / pressed |
| border/default | navy/700 | teal/100 | dividers |
| border/strong | navy/600 | navy/600 | input + secondary button outline |
| text/primary | ink/100 | navy/950 | body text, titles |
| text/secondary | ink/300 | navy/700 | supporting text |
| text/muted | ink/400 | navy/600 | metadata, inactive nav |
| text/on-accent | navy/950 | white | text on teal buttons |
| accent/default | teal/400 | navy/800 | primary button, links, selected |
| accent/hover | teal/300 | navy/700 | hover; small accent text on raised cards |
| accent/subtle | navy/700 | teal/100 | selected pill backgrounds |
| focus/ring | teal/300 | navy/600 | 2 px focus outline |
| status/{normal,warning,danger}/solid | green/400 · amber/400 · red/600 | green/700 · amber/700 · red/600 | banners, map pins |
| status/{…}/on | navy/950 · navy/950 · white | white | text/icons on solid |
| status/{…}/subtle | green/950 · amber/950 · red/950 | green/50 · amber/50 · red/50 | chip / row backgrounds |
| status/{…}/text | green/400 · amber/400 · red/400 | green/700 · amber/700 · red/700 | status words on dark |
| status/offline/solid · text | slate/500 · slate/400 | slate/500 · slate/600 | offline sensors |
| safe/solid · on | teal/400 · navy/950 | navy/800 · white | safe-zone pins |
| map/route | teal/300 | navy/800 | route line |
| overlay/scrim | navy/950 @ 72 % | navy/950 @ 40 % | behind sheets / modals |

Checked contrast (dark): text/primary on canvas 16.1:1 · text/secondary 9.6:1 · text/muted 7.8:1 ·
teal/400 on canvas 6.9:1 (on navy/800 only 4.4:1 → use teal/300 for small text there) ·
red/600 + white 4.8:1 · amber/400 + navy 10.5:1 · green/400 + navy 10.1:1. **Never** put `#77ABB7` text on white (2.5:1).

---

## 3. Typography

Google Fonts: **Lexend** (headings, numbers — designed for reading ease) + **Source Sans 3** (body/UI).

| Style | Font | Size / line | Use |
|---|---|---|---|
| Display/Number | Lexend SemiBold | 40 / 48, -1 % | gauge value, minutes-to-overflow |
| Heading/H1 | Lexend SemiBold | 28 / 36 | page titles |
| Heading/H2 | Lexend SemiBold | 22 / 28 | section titles |
| Heading/H3 | Lexend Medium | 18 / 24 | card titles, banner title |
| Overline | Lexend Medium | 12 / 16, +8 %, UPPER | stat labels |
| Body/L | Source Sans 3 Regular | 18 / 28 | About page, long text |
| Body/M | Source Sans 3 Regular | 16 / 24 | default body |
| Body/M Strong | Source Sans 3 SemiBold | 16 / 24 | emphasis |
| Body/S | Source Sans 3 Regular | 14 / 20 | secondary lines |
| Label/Button | Source Sans 3 SemiBold | 16 / 24 | buttons, nav |
| Label/S | Source Sans 3 SemiBold | 14 / 20 | chips, tabs |
| Caption | Source Sans 3 Regular | 12 / 16 | timestamps only |

---

## 4. Spacing, radius, elevation

- Spacing (4 px grid): `space/1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 · `8` 32 · `10` 40 · `12` 48 · `16` 64.
  Mobile gutter 16, desktop gutter 24, card padding 16.
- Radius: `sm` 6 · `md` 10 (buttons, inputs) · `lg` 16 (cards, banners, sheets) · `xl` 24 · `full` (chips, pills).
- Elevation: **Raised** `0 2 8 rgba(0,0,0,.30)` (floating map controls) · **Overlay** `0 8 24 rgba(0,0,0,.45), 0 2 6 rgba(0,0,0,.25)` (banners, sheets, popups).
- Motion: 150–250 ms ease-out; sheets slide 250 ms; respect `prefers-reduced-motion` (no banner pulse).

Icons: **Lucide** (`lucide-react` in code), 2 px stroke, 16 / 20 / 24 px. Icon-only buttons need `aria-label`.

---

## 5. Components

| Component | Variants / props | Figma | Status |
|---|---|---|---|
| Icon/* | 31 Lucide icons | 30:2 | ✅ built |
| Button | Variant = Primary · Secondary · Ghost · Danger; Size = M (44) · L (56); Label, Show icon, Icon swap | 31:34 | ✅ |
| IconButton | Style = Surface · Ghost; Icon swap | 31:51 | ✅ |
| StatusChip | Status = Normal · Warning · Danger · Offline | 31:79 | ✅ |
| DangerBanner | Level = Danger · Approaching · Caution | 33:72 | ✅ |
| NavItem + BottomNav | State = Active · Inactive; 5 items | 33:87 · 33:88 | ✅ |
| TopNavLink + TopNav | State = Active · Inactive | 33:139 · 33:140 | ✅ |
| Input | State = Default · Focus · Error | 33:177 | ✅ |
| SegmentItem + SegmentedControl | Selected · Unselected; 1h/6h/24h/7d | 33:182 · 33:183 | ✅ |
| SafeZoneCard | State = Open · Closed · InDanger | 59:297 | ✅ |
| HotlineCard | Status = Verified · Unverified | 59:340 | ✅ |
| StatCard | Tone = Default · Warning · Danger; Label/Value/Hint text props | 56:124 | ✅ |
| AlertRow | from → to chips, time, level | 56:144 | ✅ |
| MapPin | Type = Normal · Warning · Danger · Offline · Safe zone · User | 56:209 | ✅ |
| Legend | 5 rows | 56:161 | ✅ |
| MapPopup | sensor popup | 59:365 | ✅ |
| RouteSheet | "Show warning" boolean | 59:414 | ✅ |
| WaterGauge | Status = Normal · Warning · Danger | 56:266 | ✅ |
| MapModesPanel | — | — | ⏳ not in the artifact either |

---

## 6. Layout & navigation

| Breakpoint | Width | Navigation |
|---|---|---|
| Mobile | 360–767 (design at **390**) | **BottomNav**: Map · Safe zones · Hotlines · Alerts · More (About, Admin login) |
| Tablet | 768–1023 | BottomNav, two-column lists |
| Desktop | ≥ 1024 (design at **1440**) | **TopNav** 64 px; Map page uses a 400 px left side panel |

- Default map style in the app: **Mapbox dark-v11** (matches the UI). Satellite currently blocked on the Mapbox account.
- Map overlays never cover the danger banner; bottom sheet max 60 % height on mobile.
- Safe areas: bottom nav adds `env(safe-area-inset-bottom)`.

---

## 7. Screens (each in Mobile 390 + Desktop 1440)

### Map `/` — the home screen
- **Mobile:** full-bleed dark map under the top status strip ("Live · 3 sensors · updated 4 s ago"); floating right
  column of IconButtons (Map modes, Locate, Zoom); Legend chip bottom-left (tap to expand); big Primary-L
  **"Nearest safe zone"** button above BottomNav.
- **Desktop:** TopNav; left **400 px panel**: search-free list of sensors (StatusChip + level + minutes-to-overflow),
  then nearest safe zones; map fills the rest; Map modes popover top-right.
- **States:**
  - *Danger:* DangerBanner (Danger) at top, map recenters on user, red zone pulses, button becomes "Route to safety".
  - *Route:* bottom sheet (mobile) / side panel (desktop) — zone name, distance · time, Walk/Drive SegmentedControl,
    turn list, warning row if `safe=false`; route line teal-300 with navy casing; dashed red if unsafe.
  - *Map modes:* sheet with base style radio (Street, Satellite, Dark, 3D Terrain) + overlay toggles.
  - *Sensor popup:* name, barangay, StatusChip, level, minutes-to-overflow, "Details →".
  - *Offline / no GPS / Firebase down:* inline notice, never a blank map.

### Sensor `/sensor/:id`
- Header: back, name, barangay, StatusChip, "Live · 4 s ago".
- Status banner (solid color + plain sentence).
- Mobile: WaterGauge left + 2×2 StatCards (Minutes to overflow — biggest, Rise rate, Water temp, 1 h max);
  Desktop: gauge + 4 stat cards in a row.
- History: SegmentedControl 1h/6h/24h/7d, Export CSV (Ghost), Chart.js line with Yellow/Red/Danger lines.
- Alert log: AlertRows.

### Safe Zones `/safe-zones`
- "Sorted by distance from you" / location prompt card.
- SafeZoneCards: name, type icon, capacity, distance, Open/Closed chip, Call (Secondary) + Navigate (Primary).
- Zones inside a red area show a Danger chip "Flooded — do not go" and no Navigate.
- Desktop: 2-column grid + mini map on the right.

### Hotlines `/hotlines`
- "Works offline" note; offline banner when showing the cached list.
- Groups: National · City / Municipality · Barangay. HotlineCard: name, area, **big Call button** (tel:).
  Unverified numbers show "Number not yet verified" and no button.
- Desktop: 3-column grid.

### Alerts `/alerts`
- Filter chips: All · Turned red · Turned yellow · Back to green.
- Mobile: AlertRow cards; Desktop: table (time, sensor, change, level).

### About `/about`
- Problem + cited local flood event, How it works (echo time-of-flight diagram, formula), alert colors,
  minutes-to-overflow explainer, hardware + cost, privacy note, team. Body/L, max width 720.

### Admin `/admin` + Login `/login`
- Login: centered card, Input (email, password), Primary-L "Log in", note "For barangay DRRM officers only".
- Admin: tabs Sensors · Safe zones · Hotlines. Desktop: list left, form + MapPicker right.
  Mobile: list → full-screen edit form with map picker on top.

---

## 8. Pre-delivery checklist

- [ ] Status shown with icon + word + color everywhere
- [ ] Contrast ≥ 4.5:1 for text (see §2)
- [ ] Touch targets ≥ 44 px, 8 px apart
- [ ] Visible focus ring (`focus/ring`, 2 px)
- [ ] `prefers-reduced-motion` disables pulses
- [ ] Danger banner uses `role="alert"`; route sheet `aria-live="polite"`
- [ ] Tested at 375, 768, 1024, 1440
- [ ] No emoji as icons — Lucide only
