/*
 * Lichterkette in Bögen über der Überschrift, mit Zugschnur an der Seite.
 * Ziehen oder Antippen schaltet an/aus, die Schnur federt nach, leises „Klick“.
 */
import { speicher } from './speicher.js';
import { klick } from './klang.js';

const FARBEN = [
  ['#ff6f61', '#8c3b35'], // an, aus
  ['#ffd261', '#8a7440'],
  ['#86d4ff', '#4a6b80'],
  ['#a5ea86', '#4f6f45'],
  ['#ff9fd2', '#85506d'],
];

export function starteLichterkette(kopf, { reduziert = false } = {}) {
  const huelle = document.createElement('div');
  huelle.className = 'lichterkette';
  huelle.setAttribute('aria-hidden', 'true');
  kopf.prepend(huelle);

  // --- Kette zeichnen (passt sich der Breite an) ----------------------------
  function zeichnen() {
    const w = Math.max(200, huelle.clientWidth);
    const boegen = Math.max(2, Math.round(w / 140));
    const bw = w / boegen;
    const durchhang = Math.min(30, bw * 0.22);
    const y0 = 4;
    let draht = '', birnen = '', haken = '';
    let nr = 0;
    for (let i = 0; i < boegen; i++) {
      const x0 = i * bw, x1 = (i + 1) * bw, cx = (x0 + x1) / 2, cy = y0 + durchhang * 2;
      draht += `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y0} `;
      haken += `<circle cx="${x1}" cy="${y0}" r="2.4" fill="#6b4630"/>`;
      const anzahl = 5;
      for (let k = 1; k <= anzahl; k++) {
        const t = k / (anzahl + 1);
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y0;
        const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
        const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y0 - cy);
        const winkel = (Math.atan2(dy, dx) * 180) / Math.PI;
        const f = nr % FARBEN.length;
        birnen += `<g class="birne" style="--an:${FARBEN[f][0]};--aus:${FARBEN[f][1]};--v:${((nr * 0.61) % 3).toFixed(2)}s" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${winkel.toFixed(1)})">
          <circle class="birne-schein" cx="0" cy="9" r="13" fill="url(#birnenschein-${f})"/>
          <rect x="-2.3" y="0" width="4.6" height="3.8" rx="1" fill="#2f5a3e"/>
          <path class="birne-glas" d="M-3.4 3.6 C-4.8 7 -3.8 11 0 13.8 C3.8 11 4.8 7 3.4 3.6 Z"/>
          <ellipse cx="-1.2" cy="6.6" rx=".9" ry="1.8" fill="#fff" opacity=".55"/>
        </g>`;
        nr++;
      }
    }
    const hoehe = y0 + durchhang + 22;
    huelle.innerHTML = `<svg viewBox="0 0 ${w} ${hoehe}" width="${w}" height="${hoehe}">
      <defs>${FARBEN.map(([f], i) => `<radialGradient id="birnenschein-${i}"><stop offset="0" stop-color="${f}" stop-opacity=".85"/><stop offset=".35" stop-color="${f}" stop-opacity=".35"/><stop offset="1" stop-color="${f}" stop-opacity="0"/></radialGradient>`).join('')}</defs>
      <path d="${draht}" fill="none" stroke="#2c3b2a" stroke-width="1.6"/>
      ${haken}${birnen}</svg>`;
  }

  // --- Zugschnur ------------------------------------------------------------
  const schnur = document.createElement('div');
  schnur.className = 'zugschnur';
  schnur.setAttribute('role', 'switch');
  schnur.tabIndex = 0;
  schnur.innerHTML = `<svg viewBox="0 0 44 140" aria-hidden="true">
    <g class="schnur-schwung">
      <path class="schnur-faden" d="M22 0 L22 78" stroke="#e9dcc4" stroke-width="1.6" fill="none"/>
      <g class="schnur-griff" transform="translate(0 78)">
        <path d="M22 0 L22 4" stroke="#e9dcc4" stroke-width="1.6"/>
        <ellipse cx="22" cy="12" rx="7.5" ry="9" fill="#c98b54" stroke="#5a3322" stroke-width="1.4"/>
        <ellipse cx="19.5" cy="9" rx="2.2" ry="3" fill="#f0c48f" opacity=".8"/>
        <path d="M18 21 L17 30 M22 21 L22 31 M26 21 L27 30" stroke="#c8463a" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;
  kopf.append(schnur);
  const faden = schnur.querySelector('.schnur-faden');
  const griff = schnur.querySelector('.schnur-griff');
  const schwung = schnur.querySelector('.schnur-schwung');

  const GRUNDLAENGE = 78;
  function setzeZug(zug, winkel = 0) {
    faden.setAttribute('d', `M22 0 L22 ${GRUNDLAENGE + zug}`);
    griff.setAttribute('transform', `translate(0 ${GRUNDLAENGE + zug})`);
    schwung.setAttribute('transform', `rotate(${winkel} 22 0)`);
  }

  // Zustand
  let an = speicher.get('licht', true);
  function anzeigen() {
    huelle.classList.toggle('an', an);
    schnur.setAttribute('aria-checked', String(an));
    schnur.setAttribute('aria-label', an ? 'Lichterkette ausschalten' : 'Lichterkette einschalten');
    document.body.classList.toggle('lichter-an', an);
  }
  function umschalten() {
    an = !an;
    speicher.set('licht', an);
    klick();
    anzeigen();
  }

  // Nachfedern nach dem Loslassen (gedämpfte Schwingung)
  let federId = 0;
  function federn(startZug) {
    const id = ++federId;
    const beginn = performance.now();
    const schritt = (jetzt) => {
      if (id !== federId) return;
      const t = (jetzt - beginn) / 1000;
      const zug = startZug * Math.exp(-5 * t) * Math.cos(17 * t);
      const winkel = (reduziert ? 0 : 5) * Math.exp(-2.6 * t) * Math.sin(8 * t);
      setzeZug(zug, winkel);
      if (t < 2.2) requestAnimationFrame(schritt);
      else setzeZug(0, 0);
    };
    requestAnimationFrame(schritt);
  }

  let start = null, zug = 0;
  schnur.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    federId++;
    start = e.clientY;
    zug = 0;
    schnur.setPointerCapture(e.pointerId);
  });
  schnur.addEventListener('pointermove', (e) => {
    if (start === null) return;
    zug = Math.max(0, Math.min(40, e.clientY - start));
    setzeZug(zug);
  });
  const loslassen = () => {
    if (start === null) return;
    start = null;
    umschalten();
    // Antippen ohne Ziehen: kleiner Ruck nach unten, dann nachfedern
    federn(Math.max(zug, 16));
  };
  schnur.addEventListener('pointerup', loslassen);
  schnur.addEventListener('pointercancel', () => { start = null; federn(zug); });
  schnur.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); umschalten(); federn(16); }
  });

  zeichnen();
  anzeigen();
  new ResizeObserver(() => zeichnen()).observe(huelle);
}
