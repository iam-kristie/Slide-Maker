# Slide Maker — Agent Instructions

Turn a content brief (.md) into production-ready HTML slides and export as PNG/MP4.

For the full skill definition with all specs, read `.claude/skills/slide-maker/SKILL.md`.

## Quick Reference

### Presets

| Preset | Dimensions | Safe Zone (T/L/R/B) |
|--------|-----------|---------------------|
| ig-carousel | 1080x1350 | 80/80/80/100 |
| ig-story | 1080x1920 | 80/80/80/200 |
| ppt-16x9 | 1920x1080 | 60/60/60/60 |
| ppt-4x3 | 1024x768 | 60/60/60/60 |
| newsletter | 600xauto | 0/0/0/0 |
| a4-portrait | 2480x3508 | 120/120/120/120 |
| custom | user-specified | user-specified |

### Font Minimums (% of slide width)

- Headline: >= 4.5%
- Body: >= 2.4%
- Helper: >= 2.0%

### Workflow

1. **Read reference images** from `reference/` folder (if present) — match their visual style
2. **Read the content .md** and check `assets/` for logos, images, branding
3. **Build slides.html** — horizontal scroll-snap layout, one `.slide` div per slide, all styles inline
4. **Export** with `capture-slides.mjs`:
   ```
   node capture-slides.mjs slides.html --output ./exports --width 1080 --height 1350
   ```

### Design Principles

- This is **graphic design, not web development** — each slide should look like a designed poster
- Use expressive fonts from Google Fonts (not system defaults)
- One key point per slide, generous whitespace
- Leverage CSS: gradients, shadows, blur, border-radius, overlays
- Body text opacity >= 0.8; never use text smaller than the helper minimum

### Export Script Options

```
node capture-slides.mjs <html-file> [options]

  --output <dir>       Export directory (default: ./exports)
  --width <px>         Slide width (auto-detected from CSS, fallback 1080)
  --height <px>        Slide height (auto-detected from CSS, fallback 1350)
  --scale <factor>     Device scale factor (default: 2)
  --slides <N|N,N>     Export specific slides only
  --video <N>          Generate MP4 for slide N (requires ffmpeg)
```
