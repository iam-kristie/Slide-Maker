#!/usr/bin/env node

// Slide Maker — Export slides as PNG + animated MP4
// Usage: node capture-slides.mjs <html-file> [options]
//
// Options:
//   --output <dir>       Export directory (default: ./exports)
//   --width <px>         Slide width (auto-detected from CSS, fallback 1080)
//   --height <px>        Slide height (auto-detected from CSS, fallback 1350)
//   --scale <factor>     Device scale factor (default: 2 for retina)
//   --slides <N|N,N,...> Export only specific slide numbers
//   --video <N>          Generate MP4 animation for slide N (requires ffmpeg)
//
// Examples:
//   node capture-slides.mjs slides.html
//   node capture-slides.mjs slides.html --output ./exports --video 1
//   node capture-slides.mjs slides.html --width 1920 --height 1080 --scale 3

import { createRequire } from 'module';
import path from 'path';
import { existsSync, mkdirSync, readdirSync, unlinkSync, rmdirSync } from 'fs';
import { execSync } from 'child_process';

// --- Find puppeteer-core ---
const require_ = createRequire(import.meta.url);
let puppeteer;

// Check node_modules in current directory first
const localCandidate = path.join(process.cwd(), 'node_modules/puppeteer-core');
if (existsSync(localCandidate)) {
  puppeteer = require_(localCandidate);
}

// Then check npx cache
if (!puppeteer) {
  const npxCache = path.join(process.env.HOME, '.npm/_npx');
  if (existsSync(npxCache)) {
    for (const dir of readdirSync(npxCache)) {
      const candidate = path.join(npxCache, dir, 'node_modules/puppeteer-core');
      if (existsSync(candidate)) {
        puppeteer = require_(candidate);
        break;
      }
    }
  }
}

if (!puppeteer) {
  console.error('puppeteer-core not found. Install it with:');
  console.error('  npm install puppeteer-core');
  console.error('  # or: npx pageres-cli --help  (installs as side effect)');
  process.exit(1);
}

// --- Find Chrome ---
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',                    // macOS
  '/usr/bin/google-chrome',                                                          // Linux
  '/usr/bin/google-chrome-stable',                                                   // Linux (alt)
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',                      // Windows
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',                // Windows (x86)
];

let chromePath = process.env.CHROME_PATH;
if (!chromePath) {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) {
      chromePath = candidate;
      break;
    }
  }
}
if (!chromePath) {
  console.error('Chrome not found. Set CHROME_PATH environment variable or install Chrome.');
  process.exit(1);
}

// --- Parse args ---
const args = process.argv.slice(2);
let htmlFile = null;
let outputDir = null;
let videoSlide = null;
let slidesToCapture = null;
let cliWidth = null;
let cliHeight = null;
let scaleFactor = 2;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputDir = path.resolve(args[++i]);
  } else if (args[i] === '--video' && args[i + 1]) {
    videoSlide = parseInt(args[++i], 10);
  } else if (args[i] === '--slides' && args[i + 1]) {
    slidesToCapture = args[++i].split(',').map(n => parseInt(n.trim(), 10));
  } else if (args[i] === '--width' && args[i + 1]) {
    cliWidth = parseInt(args[++i], 10);
  } else if (args[i] === '--height' && args[i + 1]) {
    cliHeight = parseInt(args[++i], 10);
  } else if (args[i] === '--scale' && args[i + 1]) {
    scaleFactor = parseFloat(args[++i]);
  } else if (!htmlFile) {
    htmlFile = path.resolve(args[i]);
  }
}

if (!htmlFile) {
  console.error('Usage: node capture-slides.mjs <html-file> [--output <dir>] [--width <px>] [--height <px>] [--scale <factor>] [--slides <N>] [--video <N>]');
  process.exit(1);
}

if (!outputDir) {
  outputDir = path.join(path.dirname(htmlFile), 'exports');
}
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// --- Launch browser ---
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
});

const page = await browser.newPage();

// Temporary viewport — will resize after detecting slide dimensions
await page.setViewport({ width: 1920, height: 1350, deviceScaleFactor: scaleFactor });

const fileUrl = `file://${htmlFile}`;
await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000)); // wait for fonts

// --- Auto-detect slide dimensions from CSS ---
const detectedDims = await page.evaluate(() => {
  const slide = document.querySelector('.slide');
  if (!slide) return null;
  const cs = getComputedStyle(slide);
  return {
    width: parseInt(cs.width, 10),
    height: parseInt(cs.height, 10),
  };
});

const SLIDE_WIDTH = cliWidth || (detectedDims?.width) || 1080;
const SLIDE_HEIGHT = cliHeight || (detectedDims?.height) || 1350;

console.log(`Slide dimensions: ${SLIDE_WIDTH} × ${SLIDE_HEIGHT} @ ${scaleFactor}x`);

// Resize viewport to fit all slides
await page.setViewport({ width: SLIDE_WIDTH * 10, height: SLIDE_HEIGHT, deviceScaleFactor: scaleFactor });
await new Promise(r => setTimeout(r, 500));

// Count slides
const slideCount = await page.evaluate(() => document.querySelectorAll('.slide').length);
console.log(`Found ${slideCount} slides`);

// --- Capture each slide as PNG using element screenshot ---
const slideHandles = await page.$$('.slide');

for (let i = 0; i < slideHandles.length; i++) {
  const slideNum = i + 1;
  if (slidesToCapture && !slidesToCapture.includes(slideNum)) continue;
  const outPath = path.join(outputDir, `slide-${slideNum}.png`);
  await slideHandles[i].screenshot({ path: outPath, type: 'png' });
  console.log(`✓ slide-${slideNum}.png`);
}

// --- Capture video for animated slide ---
if (videoSlide && videoSlide >= 1 && videoSlide <= slideCount) {
  const slideIndex = videoSlide - 1;
  const framesDir = path.join(outputDir, '_frames');
  if (!existsSync(framesDir)) mkdirSync(framesDir, { recursive: true });

  // Pause all animations and step through manually for frame-perfect control
  await page.evaluate((idx) => {
    const slide = document.querySelectorAll('.slide')[idx];
    slide.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.animationDuration && cs.animationDuration !== '0s') {
        el.style.animationPlayState = 'paused';
      }
    });
  }, slideIndex);

  const fps = 30;
  const duration = 4;
  const totalFrames = fps * duration;
  const frameDurationMs = 1000 / fps;

  console.log(`\nCapturing ${totalFrames} frames for slide ${videoSlide} video (frame-stepped)...`);

  for (let f = 0; f < totalFrames; f++) {
    const timeMs = f * frameDurationMs;
    await page.evaluate((idx, t) => {
      const slide = document.querySelectorAll('.slide')[idx];
      slide.querySelectorAll('*').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.animationDuration && cs.animationDuration !== '0s') {
          el.style.animationDelay = `-${t}ms`;
        }
      });
    }, slideIndex, timeMs);

    const slideEl = (await page.$$('.slide'))[slideIndex];
    const framePath = path.join(framesDir, `frame-${String(f).padStart(4, '0')}.png`);
    await slideEl.screenshot({ path: framePath, type: 'png' });

    if ((f + 1) % 30 === 0) console.log(`  ${f + 1}/${totalFrames} frames`);
  }

  // Stitch with ffmpeg (full color range to prevent washed-out colors)
  const videoPath = path.join(outputDir, `slide-${videoSlide}-animated.mp4`);
  try {
    execSync(
      `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame-%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -color_range pc -colorspace bt709 -color_primaries bt709 -color_trc iec61966-2-1 -vf "scale=in_range=full:out_range=full" "${videoPath}"`,
      { stdio: 'pipe' }
    );
    console.log(`✓ slide-${videoSlide}-animated.mp4`);
  } catch (err) {
    console.error(`✗ ffmpeg failed: ${err.message}`);
    console.log('  Frames saved in _frames/ — you can stitch manually');
  }

  // Clean up frames
  try {
    for (const f of readdirSync(framesDir)) unlinkSync(path.join(framesDir, f));
    rmdirSync(framesDir);
  } catch { /* ignore */ }
}

await browser.close();
console.log(`\nDone! Exports saved to ${outputDir}`);
