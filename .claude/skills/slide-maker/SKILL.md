---
name: slide-maker
description: Turn a content brief (.md) into production-ready HTML slides and export as high-resolution PNG or animated MP4. Supports Instagram carousels, stories, PowerPoint, newsletters, posters, and custom dimensions. Use when the user wants to build slides, design a carousel, create a presentation, or says "make slides", "build carousel", "design slides".
argument-hint: "[path to content .md file] [preset: ig-carousel|ig-story|ppt-16x9|ppt-4x3|newsletter|a4-portrait|custom]"
---

# Slide Maker

Turn a content brief into production-ready HTML slides and export as PNG/MP4.

## Input

The user provides:
- A content brief (.md file) describing text, structure, and visual direction for each slide
- A preset name (or custom dimensions)
- Optionally: reference images in a `reference/` folder and assets (logos, icons, images) in an `assets/` folder

If `$ARGUMENTS` is provided, check if the first part is a file path (try to read it). The second part may be a preset name.

## Step 0: Read Visual Reference (Prerequisite)

**Before building any HTML**, check if a `reference/` folder exists in the content directory. If it does:

1. Read every image in the folder using the Read tool
2. Analyze the visual style: color palette, typography weight/style, layout density, card styles, spacing, decorative elements
3. Use these observations as the primary design direction for the HTML output

**This step is critical.** AI is highly effective at mimicking visual styles from reference images. Skipping this step produces generic-looking output.

If no reference folder exists, ask the user for visual direction or proceed with clean, modern defaults.

## Step 1: Determine Slide Spec

From the user's request, identify or ask for the slide format. Use the preset table below or accept custom dimensions.

### Presets

| Preset | Width | Height | Ratio | Safe Zone (T / L / R / B) |
|--------|-------|--------|-------|--------------------------|
| `ig-carousel` | 1080 | 1350 | 4:5 | 80 / 80 / 80 / 100 |
| `ig-story` | 1080 | 1920 | 9:16 | 80 / 80 / 80 / 200 |
| `ppt-16x9` | 1920 | 1080 | 16:9 | 60 / 60 / 60 / 60 |
| `ppt-4x3` | 1024 | 768 | 4:3 | 60 / 60 / 60 / 60 |
| `newsletter` | 600 | auto | — | 0 / 0 / 0 / 0 |
| `a4-portrait` | 2480 | 3508 | A4 @300dpi | 120 / 120 / 120 / 120 |
| `custom` | user-specified | user-specified | user-specified | user-specified |

For `newsletter` preset, each slide is a single-column block with variable height (no scroll-snap, no safe zone). For all other presets, slides use horizontal scroll-snap layout.

### Font Size Minimums

Font sizes scale proportionally to slide width. **Never use text smaller than the helper minimum.**

| Element | Minimum (% of slide width) | Example at 1080px |
|---------|---------------------------|-------------------|
| Headline | ≥ 4.5% | ≥ 49px |
| Body / table text | ≥ 2.4% | ≥ 26px |
| Helper (captions, sources) | ≥ 2.0% | ≥ 22px |

### Text Contrast

- Body text opacity ≥ 0.8 (lower values are invisible on mobile)
- Helper text can go down to 0.25 opacity
- Highlighted data (statistics, key numbers) should use 1.0 opacity or accent colors

## Step 2: Read Content and Assets

1. Read the content .md file — extract text, structure, and visual direction per slide
2. Check the `assets/` folder for any materials the user wants to include (logos, icons, watermarks, photos, templates)
3. Note all image paths for use in the HTML

## Step 3: Build HTML

Generate a single `slides.html` file in the same directory as the content .md.

### Layout Structure

For multi-slide formats (everything except newsletter):

```css
body {
  height: [SLIDE_HEIGHT]px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  display: flex;
}
.slide {
  width: [SLIDE_WIDTH]px;
  height: [SLIDE_HEIGHT]px;
  flex-shrink: 0;
  scroll-snap-align: start;
  position: relative;
  overflow: hidden;
}
.safe {
  position: absolute;
  top: [SAFE_TOP]px;
  left: [SAFE_LEFT]px;
  right: [SAFE_RIGHT]px;
  bottom: [SAFE_BOTTOM]px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

For newsletter format, use vertical layout with no scroll-snap.

### Visual Design Principles

This is **graphic design, not web development.** Each slide should look like a carefully designed poster.

**Typography:**
- Do NOT use default sans-serif or system fonts — they look like a webpage, not a design
- Choose expressive fonts from Google Fonts that match the content mood
- Mix font families for hierarchy (e.g., display font for headlines, clean sans for body)
- Suggestions: Outfit, Space Grotesk, Sora, Playfair Display, DM Sans, DM Serif Display, LXGW WenKai TC (for Chinese)

**Colors:**
- Derive palette from reference images (Step 0) or the content brief's visual direction
- No preset color schemes — choose based on the specific content and mood
- Ensure sufficient contrast (body text vs background)
- Use gradients, subtle textures, and glow effects for depth
- Maintain consistent color scheme across all slides

**Layout:**
- Center content both vertically and horizontally within the safe area
- Balance whitespace symmetrically (equal margins top/bottom, left/right)
- One key point per slide
- Max ~30 characters of text per slide (tables/data slides excepted)
- Keep content positioning consistent across slides

**Graphics:**
- Leverage CSS capabilities: gradients, border-radius, box-shadow, blur, transparency
- Use decorative elements (circles, lines, geometric shapes) for visual interest
- Logos and icons should use `object-fit: contain` (never crop non-square logos)
- Tables can use flexbox/grid card layouts instead of plain HTML `<table>`

### HTML Requirements

- All styles inline in a `<style>` tag (no external CSS files)
- Images use relative paths (e.g., `assets/logo.png`)
- Set `<meta name="viewport" content="width=[SLIDE_WIDTH]">` for correct Chrome rendering
- Use `@import url(...)` for Google Fonts

### Content Density

- Each slide: one main point
- Text: ≤ 30 Chinese characters or equivalent (tables excepted)
- Tables: 4–5 columns max, short text per cell
- Leave generous breathing room — don't fill every pixel

## Step 4: Export PNG / MP4

After generating HTML, run the export script:

```bash
node "[path-to-skill]/capture-slides.mjs" \
  "slides.html" \
  --output "./exports" \
  --width [SLIDE_WIDTH] \
  --height [SLIDE_HEIGHT]
```

**Parameters:**
- First argument: path to the HTML file
- `--output`: export directory (default: `./exports`)
- `--width` / `--height`: slide dimensions (default: auto-detect from `.slide` CSS, fallback 1080×1350)
- `--scale`: device scale factor (default: 2 for retina)
- `--slides N` or `--slides 1,3,7`: export only specific slides
- `--video N`: generate 4-second MP4 animation for slide N (requires ffmpeg)

**Output:**
- `slide-1.png` through `slide-N.png`: each slide at specified dimensions @ 2x
- `slide-N-animated.mp4`: 30fps video with frame-stepped CSS animation (if `--video` specified)

**Animation speed:** The script pauses CSS animations and steps through them frame-by-frame using negative `animation-delay`, ensuring the exported video matches browser playback speed exactly.

**Color accuracy:** The ffmpeg command uses full RGB color range (`-color_range pc`) to prevent washed-out colors in the MP4 compared to the PNG exports.

After exporting, spot-check a few PNGs using the Read tool to verify content is correct.

## Quality Checklist

After generating HTML and exporting:

1. ✅ Multi-slide layout uses horizontal scroll-snap (not vertical scrolling)?
2. ✅ All text is within the safe zone?
3. ✅ Font sizes meet the minimums for this preset?
4. ✅ Text contrast is sufficient (body ≥ 0.8 opacity)?
5. ✅ Each slide has only one main point?
6. ✅ Content is centered with symmetric whitespace?
7. ✅ Image paths are correct and logos display properly (not cropped)?
8. ✅ Visual style matches the reference images (if provided)?
9. ✅ Color palette is consistent across all slides?
10. ✅ Exported PNGs show different content per slide (file sizes vary)?
