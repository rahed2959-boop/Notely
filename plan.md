# Notely implementation plan

## Scope

Notely is an Android-oriented, onboarding-free notes app for quickly capturing and revisiting ideas. Notes are stored locally on-device, so the core experience works offline and does not require account setup.

## Product implementation

- Use the fixed Expo Router / React Native / TypeScript starter and keep the existing runtime, app identifiers, server adapters, and native configuration intact.
- Use one primary `(tabs)` route as a focused notes workspace. Keep the interaction one-handed: a compact header, a search field near the top, horizontal filter chips, vertically stacked note cards, and a bottom-right floating action button.
- Store notes with AsyncStorage under a versioned key. Each note contains an id, title, body, tags, created/updated timestamps, and pinned/archived flags. Seed a small set of example notes on first launch so the interface is immediately understandable; subsequent edits persist locally.
- Derive visible notes from search text, selected status filter, selected tag, and pinned-first sorting. Keep archived notes available through the filter instead of deleting them.
- Use a controlled modal editor for creating and editing notes. The editor supports title, body, and comma-separated tags; save creates or updates the note and refreshes the list immediately.
- Provide pin/unpin and archive/restore controls on every card, and delete from the editor with native confirmation on Android plus a web-safe confirmation fallback for Preview.
- Keep the existing Expo server/API files untouched because this product's note data is local-first and does not need network persistence.

## Project structure

- `app/(tabs)/index.tsx`: primary workspace, list state, search/filter controls, note cards, and editor modal.
- `app/(tabs)/_layout.tsx`: single-screen tab configuration and bottom-bar behavior.
- `lib/notes.ts`: note model, storage key, initial notes, and serialization helpers.
- `plan.md` / `TODO.md`: approved design and delivery outcomes.
- `app.config.ts` and `assets/images/*`: retained Android packaging identifiers plus Notely launcher branding.

## Design direction

### Candidate styles

- **Warm editorial utility** (0.07): paper-like surfaces, ink typography, and a single amber accent for quick visual scanning.
- **Quiet mineral** (0.05): cool stone neutrals and restrained blue controls for a calm archive feel.
- **Playful index cards** (0.08): brighter category colors and more expressive card treatments for casual capture.

Chosen: **Warm editorial utility**.

### Design Movement

A contemporary editorial notebook translated into a compact Android utility: clear typographic hierarchy, tactile cards, and a warm highlight that makes actions feel physical without becoming decorative.

### Core Principles

1. Make the next useful action obvious: search, capture, or continue an existing note.
2. Keep content dense enough for scanning while preserving comfortable touch targets.
3. Use contrast and spacing instead of heavy chrome to separate states.
4. Let state changes feel immediate through small, purposeful transitions and optimistic local updates.

### Color Philosophy

Use warm paper (`#FBF8F1`) and deep ink (`#20242B`) as the quiet canvas. Amber (`#E8A629`) is the signature color for the add action, active filters, and tiny state markers. A muted sage is reserved for archived/restored feedback, while clay red is reserved for destructive actions. Dark mode keeps the same warm accent but moves the canvas to charcoal so the product retains its identity at night.

### Layout Paradigm

Use a vertical reading rail rather than a dashboard grid. The header establishes the notebook identity, controls sit in a single horizontal rhythm, and cards read like an index of entries. The floating add button is anchored to the lower-right thumb zone.

### Signature Elements

- A small amber “page tab” mark beside the Notely wordmark.
- Note cards with a subtle left rule that changes when a note is pinned.
- Filter chips that read like labeled index tabs rather than generic pills.

### Interaction Philosophy

Interactions should feel reversible and local: pin, archive, and restore happen directly on a card; editing opens without losing context; delete is the only action that asks for confirmation. Empty states explain the next action in plain language and never block the first note.

### Animation

Keep motion short and functional: cards use a 140ms opacity/translate transition when the visible result changes, the editor uses a soft scale/fade entrance, and the floating action button compresses subtly on press. Avoid looping motion and avoid motion that delays text entry.

### Typography System

Use the platform sans family for dependable Android rendering. The wordmark is semibold with slightly expanded tracking; screen titles are 28–30px and compact; note titles are 16px semibold; note previews are 14px with relaxed line height; metadata is 11–12px uppercase or medium weight.

### Brand Essence

Notely is the calm, local-first place for thoughts that should not get lost: **focused, warm, dependable**.

### Brand Voice

Headlines are direct and human; actions are verbs. Example lines: “Keep the good ideas close.” and “Nothing here yet — make the first note.”

### Wordmark & Logo

Use the wordmark “notely” in lowercase with a small amber page-tab mark: a rounded vertical tab with a single ink-colored fold line. Use the same mark in the square launcher icon without baked-in rounded corners.

### Signature Brand Color

Amber `#E8A629` is Notely’s ownable signature: warm enough to feel tactile, bright enough to identify the primary action, and distinct from the blue defaults of the starter.

## Delivery

Validate TypeScript and lint after implementation, run the fixed Expo Metro/API preview processes, verify both listeners, and save the finished source/configuration as the project checkpoint. Native APK/AAB generation remains a Dashboard build action from the accepted checkpoint; the source and Android configuration will be ready for that handoff.
