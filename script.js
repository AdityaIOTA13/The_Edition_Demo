'use strict';

/* ── Image map ────────────────────────────────────────── */
const IMAGES = {
  A: {
    Bareshell: '360 Images/A_Bareshell.png',
    '01': '360 Images/A_01.png',
    '02': '360 Images/A_02.png',
    '03': '360 Images/A_03.png',
  },
  B: {
    Bareshell: '360 Images/B_Bareshell.png',
    '01': '360 Images/B_01.png',
    '02': '360 Images/B_02.png',
    '03': '360 Images/B_03.png',
  },
  C: {
    Bareshell: '360 Images/C_Bareshell.png',
    '01': '360 Images/C_01.png',
    '02': '360 Images/C_02.png',
    '03': '360 Images/C_03.png',
  },
  D: {
    Bareshell: '360 Images/D_Bareshell.png',
    '01': '360 Images/D_01.png',
    '02': '360 Images/D_02.png',
    '03': '360 Images/D_03.png',
  },
  E: {
    Bareshell: '360 Images/E_Bareshell.png',
    '01': '360 Images/E_01.png',
    '02': '360 Images/E_02.png',
    '03': '360 Images/E_03.png',
  },
};

const VIEWPOINTS = ['A', 'B', 'C', 'D', 'E'];

/* ── State ────────────────────────────────────────────── */
let currentVP    = 'A';
let currentStyle = 'Bareshell';
let viewer       = null;
let isTransitioning = false;

/* ── DOM refs ─────────────────────────────────────────── */
const loadingOverlay  = document.getElementById('loading-overlay');
const fadeOverlay     = document.getElementById('fade-overlay');
const minimapBody     = document.getElementById('minimap-body');
const minimapToggle   = document.getElementById('minimap-toggle');

/* ── Pannellum initialisation ─────────────────────────── */
function initViewer(imagePath) {
  viewer = pannellum.viewer('panorama', {
    type: 'equirectangular',
    panorama: imagePath,
    autoLoad: true,
    showControls: true,
    showZoomCtrl: false,
    showFullscreenCtrl: false,
    keyboardZoom: false,
    mouseZoom: true,
    friction: 0.15,
    hfov: 100,
    minHfov: 50,
    maxHfov: 120,
    compass: false,
  });

  viewer.on('load', () => {
    hideLoading();
  });

  viewer.on('error', (err) => {
    console.error('Pannellum error:', err);
    hideLoading();
  });
}

/* ── Load / transition ────────────────────────────────── */
function loadPanorama(vp, style, preserveDirection) {
  if (isTransitioning) return;
  isTransitioning = true;

  const imagePath = IMAGES[vp][style];

  // Capture current pitch/yaw to restore after load
  let pitch = 0, yaw = 0;
  if (preserveDirection && viewer) {
    try { pitch = viewer.getPitch(); yaw = viewer.getYaw(); } catch(e) {}
  }

  showLoading();
  fadeIn(() => {
    // Destroy old viewer
    if (viewer) {
      try { viewer.destroy(); } catch(e) {}
      viewer = null;
    }

    // Blank the container so old frame doesn't flash
    const container = document.getElementById('panorama');
    container.innerHTML = '';

    // Init new viewer
    viewer = pannellum.viewer('panorama', {
      type: 'equirectangular',
      panorama: imagePath,
      autoLoad: true,
      showControls: true,
      showZoomCtrl: false,
      showFullscreenCtrl: false,
      keyboardZoom: false,
      mouseZoom: true,
      friction: 0.15,
      hfov: 100,
      minHfov: 50,
      maxHfov: 120,
      compass: false,
      pitch: preserveDirection ? pitch : 0,
      yaw:   preserveDirection ? yaw   : 0,
    });

    viewer.on('load', () => {
      hideLoading();
      fadeOut();
      isTransitioning = false;
    });

    viewer.on('error', (err) => {
      console.error('Pannellum error:', err);
      hideLoading();
      fadeOut();
      isTransitioning = false;
    });
  });
}

/* ── Loading helpers ──────────────────────────────────── */
function showLoading() {
  loadingOverlay.classList.add('visible');
}
function hideLoading() {
  loadingOverlay.classList.remove('visible');
}

/* ── Fade helpers ─────────────────────────────────────── */
function fadeIn(callback) {
  fadeOverlay.classList.remove('fade-out');
  fadeOverlay.classList.add('fade-in');
  // Wait for CSS transition (250ms) then call back
  setTimeout(callback, 260);
}
function fadeOut() {
  fadeOverlay.classList.remove('fade-in');
  fadeOverlay.classList.add('fade-out');
}

/* ── UI state sync ────────────────────────────────────── */
function updateUI() {
  // Viewpoint buttons (bottom bar)
  document.querySelectorAll('.vp-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.vp === currentVP);
  });

  // Style buttons
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === currentStyle);
  });

  // Minimap dots
  document.querySelectorAll('.vp-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.vp === currentVP);
  });
}

/* ── Switch viewpoint ─────────────────────────────────── */
function switchViewpoint(vp, preserveStyle) {
  if (vp === currentVP) return;
  currentVP = vp;
  updateUI();
  loadPanorama(currentVP, currentStyle, false);
}

/* ── Switch style ─────────────────────────────────────── */
function switchStyle(style) {
  if (style === currentStyle) return;
  currentStyle = style;
  updateUI();
  loadPanorama(currentVP, currentStyle, true); // preserve direction
}

/* ── Event listeners ──────────────────────────────────── */

// Bottom bar — viewpoint buttons
document.querySelectorAll('.vp-btn').forEach(btn => {
  btn.addEventListener('click', () => switchViewpoint(btn.dataset.vp));
});

// Bottom bar — style buttons
document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => switchStyle(btn.dataset.style));
});

// Prev / next
document.getElementById('prev-vp').addEventListener('click', () => {
  const idx = VIEWPOINTS.indexOf(currentVP);
  switchViewpoint(VIEWPOINTS[(idx - 1 + VIEWPOINTS.length) % VIEWPOINTS.length]);
});
document.getElementById('next-vp').addEventListener('click', () => {
  const idx = VIEWPOINTS.indexOf(currentVP);
  switchViewpoint(VIEWPOINTS[(idx + 1) % VIEWPOINTS.length]);
});

// Minimap dots
document.querySelectorAll('.vp-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    switchViewpoint(dot.dataset.vp);
  });
});

// Minimap collapse / expand
minimapToggle.addEventListener('click', () => {
  const collapsed = minimapBody.classList.toggle('collapsed');
  minimapToggle.textContent = collapsed ? '+' : '−';
});

/* ── Keyboard navigation ──────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const idx = VIEWPOINTS.indexOf(currentVP);
  if (e.key === 'ArrowLeft') {
    switchViewpoint(VIEWPOINTS[(idx - 1 + VIEWPOINTS.length) % VIEWPOINTS.length]);
  } else if (e.key === 'ArrowRight') {
    switchViewpoint(VIEWPOINTS[(idx + 1) % VIEWPOINTS.length]);
  }
});

/* ── Initialise ───────────────────────────────────────── */
updateUI();
showLoading();
initViewer(IMAGES[currentVP][currentStyle]);
