// ── Starfield canvas ──
const canvas = document.getElementById('stars-canvas');
const ctx    = canvas.getContext('2d');
let W, H, stars = [];

function initStars() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  stars = Array.from({ length: 180 }, () => ({
    x:   Math.random() * W,
    y:   Math.random() * H,
    r:   Math.random() * 1.6 + 0.2,
    a:   Math.random(),
    da:  (Math.random() * 0.4 + 0.1) * (Math.random() < 0.5 ? 1 : -1) * 0.005,
    vx:  (Math.random() - 0.5) * 0.06,
    vy:  (Math.random() - 0.5) * 0.06,
    hue: Math.random() < 0.3 ? 280 : Math.random() < 0.5 ? 210 : 0,
  }));
}

function drawStars() {
  ctx.clearRect(0, 0, W, H);
  stars.forEach(s => {
    s.a += s.da;
    if (s.a > 1 || s.a < 0) s.da *= -1;
    s.x = (s.x + s.vx + W) % W;
    s.y = (s.y + s.vy + H) % H;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.hue === 0
      ? `rgba(255,255,255,${s.a})`
      : `hsla(${s.hue},80%,85%,${s.a})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', initStars);
initStars();
drawStars();

// ── Navbar scroll effect ──
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  nav.style.background = window.scrollY > 20
    ? 'rgba(4,3,15,0.92)'
    : 'rgba(4,3,15,0.72)';
});

// ── CV Voice Playback ──
const WIKI_API = 'https://genshin-impact.fandom.com/api.php';
let currentAudio = null;
let currentBtn   = null;

async function getWikiAudioUrl(filename) {
  const url =
    `${WIKI_API}?action=query&titles=File:${encodeURIComponent(filename)}` +
    `&prop=imageinfo&iiprop=url&format=json&origin=*`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Wiki API error: ${resp.status} for ${url}`);
  const data  = await resp.json();
  const pages = Object.values(data.query.pages);
  const info  = pages[0]?.imageinfo?.[0]?.url;
  if (!info) throw new Error(`Audio URL not found for file: ${filename}`);
  return info;
}

async function playCV(btn, voiceFile) {
  // Toggle off if the same button is playing
  if (currentBtn === btn && currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    currentBtn = null;
    btn.classList.remove('playing');
    btn.textContent = '▶';
    return;
  }

  // Stop any previously playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
    if (currentBtn) {
      currentBtn.classList.remove('playing');
      currentBtn.textContent = '▶';
      currentBtn = null;
    }
  }

  btn.classList.add('loading');
  btn.textContent = '…';

  try {
    const audioUrl = await getWikiAudioUrl(voiceFile);
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    currentBtn   = btn;

    btn.classList.remove('loading');
    btn.classList.add('playing');
    btn.textContent = '⏸';

    audio.play();

    audio.onended = () => {
      btn.classList.remove('playing');
      btn.textContent = '▶';
      currentAudio = null;
      currentBtn   = null;
    };
    audio.onerror = () => {
      btn.classList.remove('playing', 'loading');
      btn.textContent = '✕';
      setTimeout(() => { btn.textContent = '▶'; }, 2000);
      currentAudio = null;
      currentBtn   = null;
    };
  } catch (e) {
    console.warn('CV playback failed:', e);
    btn.classList.remove('loading', 'playing');
    btn.textContent = '✕';
    setTimeout(() => { btn.textContent = '▶'; }, 2000);
  }
}
