/*
 * Schneesturm
 * -----------
 * Mond antippen → der Wind frischt auf, immer dichtere Flocken wehen schräg über den
 * Bildschirm, ein weißer Schleier legt sich über alles, bis man kaum noch durchschaut.
 * Nach rund 11 Sekunden klart es wieder auf. (Auslösen: siehe js/main.js)
 */
import { sturmwind } from './klang.js';

const DAUER = 11;       // Sekunden insgesamt
const AUFBAU = 3;       // Sekunden bis zur vollen Stärke
const ABBAU = 3;        // Sekunden zum Aufklaren
const PAUSE_MS = 1500;  // kurze Sperre, damit ein Doppeltipp nicht zweimal auslöst

/** Sturmstärke 0…1 zum Zeitpunkt t (Sekunden) */
function staerke(t) {
  if (t <= 0 || t >= DAUER) return 0;
  if (t < AUFBAU) { const x = t / AUFBAU; return x * x * (3 - 2 * x); }
  if (t > DAUER - ABBAU) { const x = (DAUER - t) / ABBAU; return x * x * (3 - 2 * x); }
  return 1;
}

/** Weiche, runde Flocke als kleines Bild (schneller als jedes Mal einen Verlauf zu malen) */
function flockenBild(radius) {
  const c = document.createElement('canvas');
  c.width = c.height = radius * 2;
  const g = c.getContext('2d');
  const v = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
  v.addColorStop(0, 'rgba(255,255,255,1)');
  v.addColorStop(0.45, 'rgba(255,255,255,.85)');
  v.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = v;
  g.fillRect(0, 0, radius * 2, radius * 2);
  return c;
}

export function starteSchneesturm({ reduziert = false, istBlockiert = () => false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'sturm-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const g = canvas.getContext('2d');
  const bilder = [flockenBild(8), flockenBild(16), flockenBild(32)];

  let breite = 0, hoehe = 0, dpr = 1;
  function groesse() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    breite = innerWidth;
    hoehe = innerHeight;
    canvas.width = Math.round(breite * dpr);
    canvas.height = Math.round(hoehe * dpr);
  }

  let aktiv = false, beginn = 0, letzterSturm = -Infinity, flocken = [];

  function neueFlocke(irgendwo) {
    const nah = Math.random();
    const art = nah < 0.62 ? 0 : nah < 0.92 ? 1 : 2; // klein, mittel, nah & groß
    const groesseF = [2 + Math.random() * 2.5, 4 + Math.random() * 4, 9 + Math.random() * 14][art];
    const tempo = [1, 1.5, 2.3][art];
    return {
      x: irgendwo ? Math.random() * breite : -40 - Math.random() * breite * 0.3,
      y: irgendwo ? Math.random() * hoehe : Math.random() * hoehe * 1.1 - hoehe * 0.15,
      r: groesseF,
      bild: bilder[art],
      vx: (420 + Math.random() * 380) * tempo,
      vy: (90 + Math.random() * 170) * tempo,
      wirbel: Math.random() * Math.PI * 2,
      a: art === 2 ? 0.55 : 0.75 + Math.random() * 0.25,
    };
  }

  function bild(jetzt) {
    if (!aktiv) return;
    const t = (jetzt - beginn) / 1000;
    if (t >= DAUER) { beenden(); return; }
    const s = staerke(t);
    const dt = Math.min(0.05, (jetzt - (bild.letzt || jetzt)) / 1000);
    bild.letzt = jetzt;

    // Anzahl der Flocken folgt der Stärke
    const ziel = Math.round((reduziert ? 60 : 700) * s * Math.min(1.4, (breite * hoehe) / (390 * 844)));
    while (flocken.length < ziel) flocken.push(neueFlocke(false));

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, breite, hoehe);
    // Weißer Schleier: in der Mitte etwas dichter, wie Schneegestöber vor der Linse
    const boe = 0.94 + 0.06 * Math.sin(t * 2.1);
    const schleier = g.createRadialGradient(breite / 2, hoehe * 0.45, 0, breite / 2, hoehe * 0.45, Math.max(breite, hoehe) * 0.75);
    schleier.addColorStop(0, `rgba(242,246,252,${(0.95 * s * boe).toFixed(3)})`);
    schleier.addColorStop(1, `rgba(228,235,247,${(0.9 * s * boe).toFixed(3)})`);
    g.fillStyle = schleier;
    g.fillRect(0, 0, breite, hoehe);

    // Flocken bewegen und malen
    const wind = 0.75 + 0.35 * Math.sin(t * 1.7) * Math.sin(t * 0.6 + 2);
    for (let i = flocken.length - 1; i >= 0; i--) {
      const f = flocken[i];
      f.wirbel += dt * 3;
      f.x += (reduziert ? f.vx * 0.25 : f.vx * wind) * dt;
      f.y += (f.vy + Math.sin(f.wirbel) * 60) * dt;
      if (f.x > breite + 60 || f.y > hoehe + 60) {
        if (flocken.length > ziel) { flocken.splice(i, 1); continue; }
        Object.assign(f, neueFlocke(false));
      }
      g.globalAlpha = f.a * Math.min(1, s * 1.6);
      g.drawImage(f.bild, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    }
    g.globalAlpha = 1;
    requestAnimationFrame(bild);
  }

  function beenden() {
    aktiv = false;
    flocken = [];
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove('an');
    document.body.classList.remove('schneesturm');
  }

  /** Sturm starten (wenn nicht gerade einer läuft oder eine Karte offen ist) */
  function ausloesen() {
    const jetzt = performance.now();
    if (aktiv || istBlockiert() || jetzt - letzterSturm < PAUSE_MS) return false;
    aktiv = true;
    letzterSturm = jetzt;
    beginn = jetzt;
    bild.letzt = 0;
    groesse();
    flocken = Array.from({ length: 30 }, () => neueFlocke(true));
    canvas.classList.add('an');
    document.body.classList.add('schneesturm');
    sturmwind(DAUER, staerke);
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([60, 80, 40]);
    requestAnimationFrame(bild);
    return true;
  }

  window.addEventListener('resize', () => { if (aktiv) groesse(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && aktiv) beenden(); });

  return { ausloesen, get aktiv() { return aktiv; } };
}
