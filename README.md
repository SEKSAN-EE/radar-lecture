# Radar: How It Works, Where It Is Used, and My Research

90-minute lecture on radar for undergraduate students — principles (FMCW), architecture, radar types, applications (automotive, SAR, weather, GPR) and research results — as an HTML slide deck with 12 interactive 3D scenes (Three.js).

Author: Seksan Eiadkaew, iDEMT, King Mongkut's University of Technology North Bangkok

## Use

Open `index.html` in a browser (works offline from a local copy; no build step).

| Key | Action |
|---|---|
| ← / → , Space, PageUp/PageDown | previous / next slide |
| N | speaker notes |
| F | fullscreen |
| Home / End | first / last slide |

Deep links: `index.html#43` opens slide 43. In the 3D slides: drag to rotate, scroll to zoom, shift+drag to pan.

## 3D slides

Pulse radar · Range–Doppler surface · Angle estimation · Rotating radar · Phased-array beam · MIMO virtual array · Adaptive cruise control · SAR synthetic aperture · Weather-radar volume scan · GPR scan · Vital signs · Clutter and ghost targets in a city. All scenes use synthetic or simplified geometry for teaching.

## Layout

- `index.html` – the deck (slides are absolutely positioned on a 1280×720 canvas)
- `js/deck.js` – navigation; `js/common3d.js` – shared 3D helpers; `js/scenes/` – one file per 3D scene
- `lib/three.min.js` – Three.js r160 (MIT)
- `assets/` – images (WebP)

## Credits

Photos and images are from Wikimedia Commons, NASA, NOAA and ESA; attributions and licenses are listed on the "Image Credits" slides at the end of the deck. Figures from the author's own publications are used with the author's own permission. The FMCW principles follow the Texas Instruments course "Introduction to mmWave Sensing: FMCW Radars" (S. Rao); no TI slides are redistributed here.
