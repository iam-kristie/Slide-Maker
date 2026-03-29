# Slide Maker

**Turn any content brief into beautiful slides using your coding agent.**

Write your content in Markdown. Drop in reference images for visual style. Let your AI coding agent build production-ready HTML slides and export them as high-resolution PNGs or animated MP4 video.

Works for Instagram carousels, IG stories, PowerPoint slides, newsletters, posters, and more.

## Works With

This skill uses the [Agent Skills](https://agentskills.io) open standard and is compatible with:

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Cursor](https://cursor.sh)
- [Codex CLI](https://github.com/openai/codex)
- [Antigravity](https://antigravity.dev)
- [Kiro](https://kiro.dev)
- [Windsurf](https://windsurf.com)
- [GitHub Copilot](https://github.com/features/copilot)

Any agent that reads `SKILL.md`, `AGENTS.md`, or `.claude/skills/` will pick up the instructions automatically.

## Prerequisites

- A coding agent (see above)
- Google Chrome (for screenshot export)
- Node.js 18+ (for the export script)
- [Optional] ffmpeg (for animated MP4 video export)

The export script uses `puppeteer-core` to drive Chrome. Install it once:

```bash
npm install puppeteer-core
# or, as a side effect of:
npx pageres-cli --help
```

## Installation

Copy the skill into your project's agent skills folder:

```bash
# Clone the repo (or download it)
git clone https://github.com/iam-kristie/Slide-Maker.git

# For Claude Code:
cp -r Slide-Maker/skills/slide-maker/ your-project/.claude/skills/slide-maker/

# For Cursor:
cp -r Slide-Maker/skills/slide-maker/ your-project/.cursor/rules/slide-maker/

# For Antigravity:
cp -r Slide-Maker/skills/slide-maker/ your-project/.agents/skills/slide-maker/

# Or simply open this repo directly in your coding agent
```

The skill consists of just 2 files:

```
skills/
└── slide-maker/
    ├── SKILL.md              # Skill definition (instructions for the AI)
    └── capture-slides.mjs    # Export script (PNG + MP4)
```

## Quick Start

### 1. Prepare your content

Create a folder for your slide project:

```
my-slides/
├── content.md       # Your content brief (text, structure, visual direction)
├── reference/       # Drop reference images here for visual style matching
│   ├── style1.png
│   └── style2.png
└── assets/          # Your logos, icons, images
    └── logo.png
```

Your `content.md` should describe:
- The text content for each slide
- Visual direction (mood, colors, style)
- Any specific layout preferences

### 2. Run the skill

Tell your coding agent:

> Build slides from content.md using the ig-carousel preset

The agent will:
1. Read your reference images to match the visual style
2. Read your content brief
3. Generate a `slides.html` file with all slides

### 3. Export

The agent will automatically export using the capture script:

```bash
node skills/slide-maker/capture-slides.mjs slides.html --output ./exports
```

Your exports appear in the `exports/` folder:
- `slide-1.png`, `slide-2.png`, ... (high-res PNGs at 2x scale)
- `slide-N-animated.mp4` (if you requested video)

## Slide Presets

| Preset | Dimensions | Aspect Ratio | Safe Zone (T/L/R/B) | Use Case |
|--------|-----------|-------------|---------------------|----------|
| `ig-carousel` | 1080 x 1350 | 4:5 | 80/80/80/100 | Instagram feed posts |
| `ig-story` | 1080 x 1920 | 9:16 | 80/80/80/200 | Instagram/TikTok stories |
| `ppt-16x9` | 1920 x 1080 | 16:9 | 60/60/60/60 | Widescreen presentations |
| `ppt-4x3` | 1024 x 768 | 4:3 | 60/60/60/60 | Classic presentations |
| `newsletter` | 600 x auto | — | none | Email newsletters |
| `a4-portrait` | 2480 x 3508 | A4 @300dpi | 120/120/120/120 | Print documents |
| `custom` | you decide | you decide | you decide | Anything else |

Safe zones ensure content stays clear of platform UI overlays (Instagram buttons, story indicators, etc.) or print margins.

## Folder Structure

This repo:
```
Slide-Maker/
├── skills/
│   └── slide-maker/
│       ├── SKILL.md               # Full skill definition (Agent Skills format)
│       └── capture-slides.mjs     # PNG/MP4 export script
├── AGENTS.md                      # Quick reference for all coding agents
├── README.md
└── assets/                        # Your template materials (logos, etc.)
```

Your slide project (inside this repo or your own project):
```
my-slides/
├── content.md                     # Your content brief
├── reference/                     # Visual style references
├── assets/                        # Your images, logos, icons
├── slides.html                    # Generated output
└── exports/                       # Exported PNGs and MP4s
    ├── slide-1.png
    ├── slide-2.png
    └── ...
```

## Exporting

### CLI Usage

```bash
node capture-slides.mjs <html-file> [options]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--output <dir>` | `./exports` | Export directory |
| `--width <px>` | auto-detect | Slide width in pixels |
| `--height <px>` | auto-detect | Slide height in pixels |
| `--scale <factor>` | `2` | Device scale factor (2 = retina/2x resolution) |
| `--slides <N\|N,N,...>` | all | Export only specific slide numbers |
| `--video <N>` | none | Generate MP4 animation for slide N |

### Examples

```bash
# Export all slides as PNG
node capture-slides.mjs slides.html

# Export to a specific folder
node capture-slides.mjs slides.html --output ./my-exports

# Export only slides 1 and 3
node capture-slides.mjs slides.html --slides 1,3

# Export with video for the cover slide
node capture-slides.mjs slides.html --video 1

# PowerPoint dimensions at 3x scale
node capture-slides.mjs slides.html --width 1920 --height 1080 --scale 3
```

The script auto-detects slide dimensions from the `.slide` CSS in your HTML. Use `--width` and `--height` only if auto-detection doesn't work for your setup.

## Customization

### Adding Your Own Presets

Edit the preset table in `SKILL.md` to add new dimensions. For example, to add a LinkedIn banner preset:

```
| linkedin-banner | 1584 | 396 | 4:1 | 40 / 40 / 40 / 40 |
```

### Branding

Place your branding assets in the `assets/` folder:
- Logos, watermarks, profile images
- Brand-specific icons or decorative elements
- The skill will automatically check `assets/` and incorporate what it finds

### Templates

To create reusable templates:
1. Build a set of slides you like
2. Save the HTML as a template
3. Reference it in your content brief: "Use the style from template.html"

### Reference Images

The most effective way to control visual output is through reference images:
1. Screenshot slides you admire (from other creators, Canva, etc.)
2. Place them in the `reference/` folder
3. The agent will match the color palette, typography, and layout density

## License

MIT
