---
name: Terra Solace
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d4'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ed'
  surface-container: '#f5ece7'
  surface-container-high: '#efe6e2'
  surface-container-highest: '#e9e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#51443e'
  inverse-surface: '#34302c'
  inverse-on-surface: '#f8efea'
  outline: '#83746d'
  outline-variant: '#d5c3ba'
  surface-tint: '#80543c'
  primary: '#71472f'
  on-primary: '#ffffff'
  primary-container: '#8c5e45'
  on-primary-container: '#ffe4d7'
  inverse-primary: '#f4ba9c'
  secondary: '#526350'
  on-secondary: '#ffffff'
  secondary-container: '#d5e8cf'
  on-secondary-container: '#586955'
  tertiary: '#644c34'
  on-tertiary: '#ffffff'
  tertiary-container: '#7e644b'
  on-tertiary-container: '#ffe5ce'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#f4ba9c'
  on-primary-fixed: '#311302'
  on-primary-fixed-variant: '#653d26'
  secondary-fixed: '#d5e8cf'
  secondary-fixed-dim: '#b9ccb4'
  on-secondary-fixed: '#101f10'
  on-secondary-fixed-variant: '#3a4b39'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#e1c1a2'
  on-tertiary-fixed: '#291805'
  on-tertiary-fixed-variant: '#59422b'
  background: '#fff8f5'
  on-background: '#1e1b18'
  surface-variant: '#e9e1dc'
typography:
  display:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  title-lg:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is anchored in a "High-End Resort Management" philosophy. It balances the serene, tactile experience of a premium physical space with the rigorous functionality required for operational software. The visual language is sophisticated and calm, aiming to reduce cognitive load for users managing complex tasks.

The style is **Organic Minimalism**. It leverages heavy whitespace, a naturalistic color palette, and soft layering. Unlike cold, corporate minimalism, this system uses warm tones and subtle textures to evoke an emotional response of professional reliability and understated luxury. The UI feels less like a "tool" and more like a curated "concierge interface."

## Colors

The palette is derived from natural elements—clay, stone, and flora.

- **Primary (Terracotta):** Used for primary actions and brand moments. It is warm and grounded.
- **Secondary (Sage):** Used for success states, secondary navigation, and botanical accents that signify growth or stability.
- **Tertiary (Warm Beige):** Used for subtle highlighting, progress bars, and soft compartmentalization.
- **Neutral (Mocha/Charcoal):** Not a true black, this deep brown-grey provides high legibility for text while remaining softer on the eyes.
- **Background & Surface:** Surfaces use a crisp white to stand out against a creamy, off-white background (`#F9F7F2`), creating a gentle layered effect without harsh contrast.

## Typography

This design system uses a high-contrast typographic pairing to signal both luxury and efficiency.

- **Headlines:** **Libre Caslon Text** provides an editorial, authoritative feel. Its classic proportions suggest a long-standing heritage and attention to detail.
- **Body & Data:** **Manrope** is used for all functional text. It is a modern, geometric sans-serif that remains highly legible in dense data environments.
- **Labels:** Small labels use Manrope with increased letter spacing and bold weights to ensure hierarchy is maintained in compact management views.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid with Generous Margins**. To maintain a high-end feel, the design avoids "cramming" information. 

- **Grid:** A 12-column grid for desktop with 24px gutters.
- **Rhythm:** All spacing (padding, margins) must be a multiple of 8px. 
- **White Space:** Use 48px or 64px gaps between major sections to allow the design to "breathe," mimicking the open-air architecture of a luxury resort.
- **Responsibility:** On mobile, margins shrink to 16px, and the 12-column grid collapses into a 4-column stack. Typography shifts to mobile-specific tokens to prevent clipping.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Ambient Shadows**.

- **Shadows:** Use extremely soft, long-range shadows with a slight warm tint (e.g., `rgba(140, 94, 69, 0.08)`). This avoids the "dirty" look of grey shadows and keeps the interface feeling sun-drenched and warm.
- **Borders:** Use subtle, low-contrast borders (`1px solid #EAE5D8`) to define boundaries without interrupting the visual flow.
- **Z-Axis:** 
  - Level 0: Background (`#F9F7F2`)
  - Level 1: Main content cards (White surface, 1px border, no shadow)
  - Level 2: Interactive elements/Modals (White surface, soft ambient shadow)

## Shapes

The shape language is **Soft and Precise**. 

We use a `0.25rem` (4px) base radius for standard inputs and buttons, and `0.75rem` (12px) for larger container cards. This subtle rounding is more professional and "architectural" than fully rounded pill shapes, maintaining a sense of structure while removing the aggressiveness of sharp corners.

## Components

- **Buttons:** Primary buttons use the Terracotta background with white text. Secondary buttons use a Sage outline. Hover states should involve a slight darkening of the hue rather than a dramatic color shift.
- **Inputs:** Fields use a 1px border in a warm grey. On focus, the border transitions to Terracotta with a very soft glow.
- **Cards:** Cards are the primary container. They should feature a white background against the off-white page background, using a subtle 1px border to define their shape.
- **Chips/Status:** Status indicators should use low-saturation versions of the functional colors (e.g., a very pale sage for "Active") to ensure they don't dominate the visual hierarchy.
- **Data Tables:** Tables should remove vertical borders entirely, using only soft horizontal separators to maintain an airy, clean look.
- **Navigation:** Vertical sidebars should use the Mocha neutral for the background with Sage as the active indicator, creating a strong contrast for the primary navigation hub.