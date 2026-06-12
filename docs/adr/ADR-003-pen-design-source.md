# ADR-003 — design/shalom.pen is the authoritative UI design source

**Status:** Accepted
**Date:** 2026-06-12

## Context

The UX bar for Shalom is explicitly high: calm, excellent, progressively disclosed, never overwhelming. Saturdaze uses a static HTML/CSS mock app (`docs/mocks/`) plus a Playwright pixel-diff harness as its visual baseline. Shalom's owner also has Pencil (.pen design files) and a ui-audit workflow that compares the running frontend against a .pen file.

## Decision

Design every screen in `design/shalom.pen` before implementing it. The .pen file is the single authoritative design source; visual fidelity is verified by running ui-audit against it. Playwright e2e stays behavior-focused (Page Object Model); no `docs/mocks/` static app and no pixel-diff baseline harness.

Visual identity ("dawn calm"): MD3 seed cedar teal `#2D5F5D`, secondary warm sand `#C8A57B`, tertiary shalom gold `#B8924A` reserved for completion moments; Fraunces serif for scripture/display, Figtree for body; warm off-white surfaces; pre-sunrise dawn theme.

## Consequences

- One design artifact to maintain instead of two (Pencil + mocks).
- Design fidelity checks are tool-assisted (ui-audit) rather than pixel-diff snapshots; less brittle, slightly less automatic.
- The .pen file must be kept current when designs change — it is not documentation, it is the spec.
