# Kaahiye Passenger App — UI Implementation Report

Local Expo/React Native demo. No backend, no paid APIs, no real maps/GPS.
All data, maps, illustrations and auth flows are mocked locally.

## Current screen set (15)

1. Splash
2. Onboarding
3. Sign Up *(redesigned — mint hero + card layout)*
4. Sign In *(redesigned — mint hero + card layout)*
5. Location Permission
6. Home (Select Location)
7. Search Destination
8. Ride Details (Fare Estimate + **Select Vehicle** bottom sheet)
9. Finding Driver
10. Driver Assigned
11. Driver Messaging *(chat with driver)*
12. Active Ride
13. Trip Completed
14. Rate Driver
15. Ride History

> The separate **Choose a Ride** screen was removed on request. Vehicle selection now lives
> in the Ride Details bottom sheet, and `Confirm Ride` creates the ride with the selected
> vehicle fare and goes straight to `Finding Driver`.

## What changed in this round

### 1. Shared button system — one container style for every CTA
- `src/components/ui/ctaStyle.ts` — **the single source of truth**:
  ```ts
  export const CTA_HEIGHT = 56;
  export const CTA_RADIUS = 14;
  export const CTA_HORIZONTAL_PADDING = 16;
  export const CTA_BOTTOM_GAP = 16;
  export const CTA_TEXT_SIZE = 15;

  export const CTA_STYLE: ViewStyle = {
    width: '100%',                    // 100% of the parent — never stretched
    height: CTA_HEIGHT,               // 56 — identical on every device
    alignSelf: 'stretch',
    marginHorizontal: 0,              // identical horizontal margins
    paddingHorizontal: CTA_HORIZONTAL_PADDING, // identical padding
    borderRadius: CTA_RADIUS,         // 14 — identical radius
  };
  ```
- `src/components/ui/CTAButton.tsx` — the one reusable wrapper every primary button renders
  through (Sign In, Continue with Apple, Get Started, Allow Location, Sign Up, Confirm Ride,
  Driver Arriving, Done, Submit, Cancel Request, End Ride, sheet Cancel/Done):
  ```tsx
  export function CTAButton({ style, ...rest }: CTAButtonProps) {
    return <Button {...rest} style={[style, CTA_STYLE]} />;
  }
  ```
  Screen styles are applied **first** and `CTA_STYLE` **last**, so a screen can only ever add
  vertical spacing — never width, height, horizontal margins, padding or radius.
- `src/components/Button.tsx` — one component for every primary/secondary/outline/danger/ghost
  CTA. It has **no size scale any more** (the old `sm`/`md`/`lg` prop was removed): height is
  always `CTA_HEIGHT` and the label size always `CTA_TEXT_SIZE`, so there is no second scale a
  button could drift to. `CTA_STYLE` is applied last inside the component as well.
  - `alignSelf: 'stretch'` + `width: '100%'` → the button is exactly as wide as its container:
    full-width inside a column, cell-width inside a flex row.
  - The gradient fill uses `CTA_RADIUS` (14), so the fill and the border always agree.
  - Single-line titles with `adjustsFontSizeToFit` + `maxFontSizeMultiplier` → labels never clip.
  - Dev-only `onLayout` log — `[KaahiyeCTA] "<label>" width=… screen=…` — so the real button
    width on a physical device can be verified in the Metro console.
  - `UI_BUILD` (in `src/theme/index.ts`) is shown at the top of the Dev Panel, so you can tell
    which JS bundle a device is actually running.
- `src/components/ui/ButtonRow.tsx` — the row owns the geometry (equal `flex: 1` cells + 10pt
  gap) and the buttons simply fill their cell, so side-by-side actions can never end up with
  different widths (this is what the vehicle sheet **Cancel / Done** pair uses).
- `src/components/ui/IconButton.tsx` — shared circular icon button (`white` / `muted` /
  `primary` / `ghost`, sizes 34–48) for back arrows, map controls, Home menu/settings,
  message/call actions, recenter and chat send.
- Measured on the rendered app at 390pt — every primary CTA shares the same 20pt inset and
  therefore the exact same width, height and radius:

  | Button | x | Width | Right gap | Height | Radius |
  |---|---|---|---|---|---|
  | Sign In | 20 | 350 | 20 | 56 | 14 |
  | Continue with Apple | 20 | 350 | 20 | 56 | 14 |
  | Sign Up | 20 | 350 | 20 | 56 | 14 |
  | Allow Location | 20 | 350 | 20 | 56 | 14 |
  | Confirm Ride (Ride Details) | 20 | 350 | 20 | 56 | 14 |
  | Cancel Request (Finding Driver) | 20 | 350 | 20 | 56 | 14 |
  | End Ride (Active Ride) | 20 | 350 | 20 | 56 | 14 |
  | Done (Trip Completed) | 20 | 350 | 20 | 56 | 14 |
  | Submit (Rate Driver) | 20 | 350 | 20 | 56 | 14 |
  | Vehicle sheet Cancel / Done | 20 / 200 | 170 / 170 | 20 | 56 | 14 |

  Verified at 393×852, 390×844, 375×667, 412×780 and 360×780: buttons stay centered (equal
  left/right gaps), never change height, never overflow and never clip.
  Single source of truth: `src/components/ui/ctaStyle.ts` (gutter: `layout.screenPadding`).

### 2. Sign In screen (redesigned)
- Soft mint → white vertical gradient header.
- Kaahiye logo, wordmark and tagline **“Rides for a Better Tomorrow”**.
- Local city illustration: mint skyline, white sedan, motorbike and dotted route.
- “Welcome Back” + “Sign in to your account and get moving.”
- White rounded (20px) card with subtle shadow containing:
  - Email or Phone + Password fields with leading icons and password visibility toggle.
  - Remember Me checkbox (green when checked) and green **Forgot Password?** link.
  - Full-width emerald **Sign In** button with right-arrow icon.
  - “or” divider and outlined **Continue with Apple** button.
- “Don’t have an account? **Sign Up**” footer.
- Mint skyline + dotted-route footer illustration (absolutely positioned so it never pushes
  the bottom link off screen).
- Compact vertical rhythm so nothing important hides below the fold: the hero shrinks
  responsively (`74pt` on short phones, up to `124pt` on tall ones), fields use a 50pt compact
  height, and the bottom link is fully visible without scrolling on 390×844, 370×800 and
  375×667 (Sign In); Sign Up needs a ~15pt scroll only on the 667pt-tall iPhone SE.
- Keyboard avoidance + safe-area handling; content capped at 520pt and centred on tablets.

### 3. Sign Up screen (matched to the same UI)
- Same mint hero, brand block, illustration and card treatment.
- Full Name, Email, Phone Number, Password fields with icons + password toggle.
- Terms/Privacy checkbox, emerald **Sign Up** button with right arrow.
- “Already have an account? **Sign In**” footer.

### 4. Ride Details — Select Vehicle
- New **Select Vehicle** card directly below Destination.
  - Empty state: car icon + “Select Vehicle / Choose a ride type for your trip”.
  - Selected state: vehicle illustration, name, `$fare · ETA`, and a blue **Change** action.
- Tapping opens a bottom-sheet modal (`slide` animation) over the dimmed map/panel with:
  - Drag handle, “Select Vehicle” title and helper text.
  - Four compact options: **Motorbike $2.80 · 6 min**, **Comfort $8.20 · 14 min**,
    **XL $10.80 · 15 min**, **Premium $12.50 · 10 min**, each with image, passenger/bag
    capacity, ETA, price and selection indicator (green `#00A884` highlight + check).
  - **Cancel** closes without saving; **Done** saves and returns to Ride Details.
- Estimated Fare updates to the selected vehicle and **Confirm Ride** shows the selected
  fare/ETA. Confirm is **disabled until a vehicle is selected**.
- Confirming creates the ride with that vehicle’s fare and continues to Finding Driver; the
  selected vehicle + fare persist through Driver Assigned → Active Ride → Trip Completed.

## CTA iterations (superseded — kept for history)

Earlier rounds tried, in order: an explicit pixel-width "full-bleed" CTA (clipped inside the
auth card), then `AUTH_CTA_STYLE` with `borderRadius: 12` and a responsive height scale
(54 → 46pt). **Both have been fully removed.** The current, only spec is the fixed
56pt / radius 14 `CTA_STYLE` described in the next sections — treat any 12pt-radius or
responsive-height numbers below this line as historical, not current.

## Green primary buttons — one reusable spec (56pt / radius 14)

Every green (primary) button uses the same reusable `Button` component with one shared style,
`CTA_STYLE` in `src/components/ui/ctaStyle.ts`, applied inside the component **last** so no
screen can override it:

```ts
export const CTA_HEIGHT = 56;
export const CTA_RADIUS = 14;
export const CTA_HORIZONTAL_PADDING = 16;
export const CTA_BOTTOM_GAP = 16;

export const CTA_STYLE: ViewStyle = {
  width: '100%',                    // fills the parent container
  height: CTA_HEIGHT,               // 56 — identical on every screen size
  alignSelf: 'stretch',
  marginHorizontal: 0,              // identical horizontal margins
  paddingHorizontal: CTA_HORIZONTAL_PADDING, // identical padding
  borderRadius: CTA_RADIUS,         // 14
};
```

* Height is fixed at **56** (the responsive `screenHeight` scaling was removed), so the button
  is byte-for-byte identical on iPhone SE, iPhone 13/14/15, Android 360/370/412 etc.
* Width stays fluid: `100%` of the parent, i.e. `screen − 40` in the app's 20pt gutter layout.
* The gradient fill uses the same `CTA_RADIUS` (14) so the fill and the border never disagree.
* Text is centred white on the green gradient (`justifyContent`/`alignItems: 'center'`).
* Onboarding's "Get Started" moved from the darker `forest` variant to the same `primary`
  green as "Sign In", so all green CTAs share one background.
* Bottom safe-area spacing: footers use `CTA_BOTTOM_GAP` (16) inside a `SafeAreaView` with the
  bottom edge; floating cards/sheets use `Math.max(insets.bottom, …) + gap`, so no CTA can sit
  under the home indicator.

Applied to: Get Started, Sign In, Sign Up, Allow Location, Confirm Ride, Driver Arriving,
Done (trip completed), Submit (rating), plus the non-green full-width CTAs (Cancel Request,
End Ride, sheet Cancel/Done) and Continue with Apple, so every CTA shares the same box.

Audit — every CTA on 393 / 390 / 375 / 412 / 360pt screens:

| Check | Result |
|---|---|
| width | `screen − 40` (353 / 350 / 335 / 372 / 320) |
| height | **56** everywhere |
| x / right gap | 20 / 20 everywhere |
| border radius | **14px** everywhere |
| text | centred, white on green |
| overflow | none (inside card/footer bounds) |
| totals | **55/55 OK — `ALL_CTAS_UNIFIED_PASS`** |

## Sign In screen — the two CTAs are pixel-identical

Both buttons on Sign In (and every primary button in the app) now render through **one
reusable component**, `CTAButton` (`src/components/ui/CTAButton.tsx`):

```tsx
export function CTAButton({ style, ...rest }: CTAButtonProps) {
  // screen style first (vertical spacing only), shared CTA_STYLE last
  return <Button {...rest} size="lg" style={[style, CTA_STYLE]} />;
}
```

`CTA_STYLE` owns the entire box — `width: '100%'`, `height: 56`, `borderRadius: 14`,
`marginHorizontal: 0`, `paddingHorizontal: 16` — and it is applied after the screen style, so
a screen can only add vertical spacing. The green button has no extra padding, width
restriction or radius of its own; colors, icons, labels and handlers are unchanged.

Measured on the rendered Sign In screen at six device widths:

| Device | Sign In (x / w / h / r) | Continue with Apple (x / w / h / r) |
|---|---|---|
| iPhone 393pt | 20 / 353 / 56 / 14 | 20 / 353 / 56 / 14 |
| iPhone 390pt | 20 / 350 / 56 / 14 | 20 / 350 / 56 / 14 |
| iPhone SE 375pt | 20 / 335 / 56 / 14 | 20 / 335 / 56 / 14 |
| Android 412pt | 20 / 372 / 56 / 14 | 20 / 372 / 56 / 14 |
| Android 370pt | 20 / 330 / 56 / 14 | 20 / 330 / 56 / 14 |
| Android 360pt | 20 / 320 / 56 / 14 | 20 / 320 / 56 / 14 |

`sameX / sameW / sameH / sameRadius / inBounds` → **all true on every device**
(`SIGNIN_CTA_PASS`). The same geometry is used by Get Started, Allow Location, Sign Up,
Confirm Ride, Driver Arriving, Done, Submit, Cancel Request, End Ride and the vehicle-sheet
pair (55/55 checks — `ALL_CTAS_UNIFIED_PASS`).

## Verification

### Run the shared-style proof yourself

```bash
npm run audit:cta     # dependency-free: 25 checks, exits 1 on any drift
```

It verifies the CTA tokens (56 / 14 / 16), that `CTA_STYLE` is applied **last**, that no second
size scale exists, that all **14 CTAButton usages** across the screens avoid width/height/
margin/padding/radius overrides, that both Sign In buttons render through `CTAButton`, and that
Get Started / Allow Location / Sign In / Continue with Apple / Sign Up / Confirm Ride /
Driver Arriving / Done / Submit are all present. Output ends with `CTA_AUDIT_PASS`.

### Confirmed on a real iPhone (Metro logs, 393pt-wide device)

Old bundle (before this fix) — inconsistent, one button overflowing its card:
```
[KaahiyeCTA] "Sign In"             width=353 screen=393
[KaahiyeCTA] "Continue with Apple" width=353 screen=393
[KaahiyeCTA] "Get Started"         width=353 screen=393
```

Current bundle (`UI_BUILD = cta-responsive-v5`) — every CTA prints the same width:
```
[KaahiyeCTA] "Get Started"         width=353 screen=393
[KaahiyeCTA] "Sign In"             width=353 screen=393
[KaahiyeCTA] "Continue with Apple" width=353 screen=393
[KaahiyeCTA] "Cancel"              width=172 screen=393   → (353 − 10) ÷ 2 ✓
[KaahiyeCTA] "Done"                width=171 screen=393   → equal half of the row ✓
```

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ clean |
| `eslint .` | ✅ clean |
| `npm test` | ✅ **30/30 passing** (3 suites — includes the new `tests/ctaStyle.test.ts` spec lock) |
| Expo dev server (web preview) | ✅ all screens rendered for screenshots |

### Four independent audits on the rendered app

| Audit | What it proves | Result |
|---|---|---|
| `check-signin-pair.js` | Sign In (green) vs Continue with Apple: x, width, height, radius at 393 / 390 / 375 / 412 / 360pt | **identical on every width** → `SIGNIN_PAIR_IDENTICAL_PASS` |
| `check-deep.js` | *Computed* styles of both buttons (width, height, padding, margins, radius, box-sizing) + the gradient rect the green button paints | same box, same radius, `box-sizing: border-box`, gradient rect covers the full 353×56 box → `DEEP_CTA_IDENTITY_PASS` |
| `pixel-audit.js` | **Pixel-level**: the actual painted pixels of both buttons in a screenshot (green gradient extent vs the Apple button's stroke extent) | same rectangle on iPhone 13, iPhone SE and Android 360 — e.g. `x=20, w=350, h=56` for both → `PIXEL_IDENTITY_PASS` |
| `source-guard.js` | Static rules: `CTA_STYLE` applied **last** in `Button`, a single height source, no legacy size scale, and **14 CTAButton usages across 11 screens — none override width / height / margin / padding / radius** | `SOURCE_GUARD_PASS` |

Plus the whole-app sweeps: `ALL_CTAS_UNIFIED_PASS` (55/55 CTA measurements across 5 device
widths) and `ALL_CTAS_IN_VIEWPORT` (no CTA is ever clipped by the viewport, smallest gap 29pt
on an iPhone SE).

Current bundle tag: **`UI_BUILD = cta-shared-v10`** (shown at the top of the Dev Panel).

Automated interaction test (Playwright, iPhone 13 viewport) covers:
- Confirm Ride is disabled before a vehicle is chosen (`confirmDisabledBefore = true`).
- After Done, the saved vehicle + updated fare are shown on Ride Details
  (`savedVehicleShown = 1`, fare updates to the selected vehicle).
- Confirm Ride navigates to `/finding-driver`.
- Driver Messaging opens from Driver Assigned and Active Ride; a sent message appears in the
  thread and persists after navigating away and back.
- Cancel on the vehicle sheet keeps the previously saved selection (verified with Premium →
  Cancel, Comfort retained).

### Screenshots
- Before: `visual-review/current/`
- After: `visual-review/after-final/`
  - `01-splash` … `15-ride-history`
  - `04-sign-in`, `03-sign-up` (redesigned auth screens)
  - `08-fare-estimate` (no vehicle selected → Confirm disabled)
  - `08b-vehicle-sheet` (modal open, dimmed map)
  - `08c-vehicle-sheet-selected` (green selection)
  - `08d-fare-vehicle-saved` (vehicle card + updated fare)
  - `11b-driver-messaging-typing`, `11c-driver-messaging-reply`
  - Multi-device auth proof: `sign-in-iPhone13.png`, `sign-up-iPhone13.png`,
    `sign-in-Android370.png`, `sign-up-Android370.png`, `sign-in-iPhoneSE.png`,
    `sign-up-iPhoneSE.png`

## Known limitations (reported honestly)
- The city hero, vehicles, logo, driver portrait and map are **local SVG recreations**, not
  the original photographic assets. They match composition, palette and proportions but are
  not pixel-identical to raster reference art.
- The map is a stylised vector city grid (roads/blocks/parks/route/markers), not real map
  tiles — required by the “no map API” constraint.
- Screenshots are captured in a browser at a 390×844 viewport with a simulated iPhone safe
  area (47/34pt). Native iOS/Android use real safe-area insets, so the only visual diff is
  in the status-bar/home-indicator strips.
- Vehicle selection starts empty by design: `Confirm Ride` stays disabled until a vehicle is
  picked, which prevents an accidental default fare. Set a default in
  `src/store/rideStore.ts` if you would rather pre-select Motorbike.

- `expo-doctor` passes 19/20; the only failure is the machine-level CocoaPods check
  (irrelevant for Expo Go).

## Driver Waiting screen — redesign (Uber-style live tracking)

`src/screens/DriverAssignedScreen.tsx` was replaced (not duplicated) with the waiting
screen from the reference: map + floating white sheet, live approach tracking and a full
cancellation flow. Navigation and the booking state machine are unchanged.

### Vehicle-aware by design
- The sheet and map read `useRideStore().selectedRideOption` — the vehicle picked on Ride
  Details — and resolve it through `src/mock/assignedVehicle.ts`.
  - **Motorbike booking** → top-down green motorbike marker, motorbike glyph in both ETA
    pills, motorbike illustration, `Honda CB 150R · Black`, plate `ABC 1234`.
  - **Car / SUV / Premium booking** → top-down car marker, car glyph, the assigned driver's
    real mock vehicle (`Toyota Corolla · White`, `ABC 1234`, etc.).
  - Nothing is hardcoded per screen: a bike booking can never render a car and vice-versa.
- The three progress stages (`Driver assigned → On the way → Arriving soon`) light up from
  the same tracking progress that drives the marker, the ETA and the distance.

### Live tracking (mock GPS, real geometry)
- `src/utils/mapRoute.ts` now owns `buildRoute`, `locateOnPath`, `headingAt`, `angleDelta`
  and `easeAngle`; `MockMap` and the waiting screen share them, so the vehicle can only ever
  move along the road polyline (no jumps, no off-road positions).
- `MockMap` gained three additive props — `approach`, `vehicle` and `pickupLabel` — which draw
  the travelled (soft) + remaining (bright blue) route, the rotating vehicle marker and the
  “Your pickup” pill. All existing map screens keep their previous rendering.
- The vehicle heading is eased between segments, so turns rotate smoothly; ETA/distance count
  down from `2 min / 0.4 mi` to `1 min / 0.1 mi`.
- On arrival the ride continues automatically (`simulateDriverArriving → … → startRide`) and
  navigates to the existing Ride Tracking screen.

### Cancellation
- `Cancel Ride` (and the back arrow) open a spring-animated sheet with five reasons, the live
  cancellation fee (`No fee` before the halfway point, `$2.50` after) and
  `Keep Ride` / `Confirm Cancellation`. Confirming cancels the ride, resets the store and
  returns to Home.

### Theme, animation & accessibility
- Every new surface is themed (map, sheet, pills, cards, cancel sheet) and adapts to Dark
  Mode; the sheet keeps the shared `shadows.bottomSheet` lift.
- Spring sheet entrance, spring card/vehicle updates, animated progress nodes, and reduced
  motion support (slower ticks, no springs) via the theme’s `reducedMotion` flag.

**New files:** `src/utils/mapRoute.ts`, `src/mock/assignedVehicle.ts`
**Known limitations:** the map camera is a static full-screen render (route and markers are
always in frame instead of panning), and driver coordinates are mock values ready to be
swapped for live GPS positions.

