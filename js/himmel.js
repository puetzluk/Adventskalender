/*
 * Nachthimmel auf einem Canvas: funkelnde Sterne, ruhiger Schneefall
 * (verschiedene Flockengrößen), gelegentlich eine Sternschnuppe und Funken.
 * Pausiert automatisch, wenn der Tab nicht sichtbar ist.
 */

const zufall = (a, b) => a + Math.random() * (b - a);

export function starteHimmel(canvas, { reduziert = false, mondElement = null } = {}) {
  const ctx = canvas.getContext('2d');
  let breite = 0, hoehe = 0, dpr = 1;
  let sterne = [], flocken = [], schnuppen = [], funken = [];
  let pausiert = false, laeuft = false, letzteZeit = 0, naechsteSchnuppe = 0;
  const flockenBilder = new Map();

  // Vorgerenderte, weiche Schneeflocke (schneller als jedes Mal einen Verlauf zu zeichnen)
  function flockenBild(r) {
    const schluessel = Math.round(r * 2);
    if (flockenBilder.has(schluessel)) return flockenBilder.get(schluessel);
    const groesse = Math.ceil(r * 2 * 1.6 * dpr) + 2;
    const c = document.createElement('canvas');
    c.width = c.height = groesse;
    const g = c.getContext('2d');
    const m = groesse / 2;
    const verlauf = g.createRadialGradient(m, m, 0, m, m, m);
    verlauf.addColorStop(0, 'rgba(255,255,255,1)');
    verlauf.addColorStop(0.45, 'rgba(250,252,255,0.9)');
    verlauf.addColorStop(1, 'rgba(240,246,255,0)');
    g.fillStyle = verlauf;
    g.fillRect(0, 0, groesse, groesse);
    flockenBilder.set(schluessel, c);
    return c;
  }

  function mondBereich() {
    if (!mondElement) return null;
    const r = mondElement.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width * 0.32 };
  }

  function neueFlocke(irgendwo) {
    const ebene = Math.random();
    const r = ebene < 0.5 ? zufall(0.7, 1.3) : ebene < 0.85 ? zufall(1.5, 2.3) : zufall(2.6, 3.6);
    const tempo = (reduziert ? 0.55 : 1) * (8 + r * 9) * zufall(0.85, 1.15);
    return {
      x: zufall(0, breite), y: irgendwo ? zufall(0, hoehe) : zufall(-20, -4),
      r, tempo, alpha: r < 1.4 ? zufall(0.45, 0.65) : r < 2.4 ? zufall(0.65, 0.85) : zufall(0.8, 0.95),
      phase: zufall(0, Math.PI * 2), schwanken: zufall(0.4, 1.1), weite: zufall(6, 18),
    };
  }

  function groesseAnpassen() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    breite = canvas.clientWidth;
    hoehe = canvas.clientHeight;
    canvas.width = Math.round(breite * dpr);
    canvas.height = Math.round(hoehe * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    flockenBilder.clear();

    const flaeche = breite * hoehe;
    const mond = mondBereich();
    sterne = [];
    const anzahlSterne = Math.round(flaeche / 3600);
    for (let i = 0; i < anzahlSterne; i++) {
      const x = zufall(0, breite), y = hoehe * 0.62 * Math.random() ** 1.35; // oben etwas dichter
      if (mond && Math.hypot(x - mond.x, y - mond.y) < mond.r * 2.2) continue;
      const gross = Math.random() < 0.09;
      sterne.push({
        x, y, r: gross ? zufall(1.3, 1.8) : zufall(0.45, 1.15), gross,
        phase: zufall(0, Math.PI * 2), tempo: zufall(0.6, 1.8) * (reduziert ? 0.4 : 1),
        farbe: Math.random() < 0.25 ? '255,236,200' : '255,255,255',
      });
    }
    const anzahlFlocken = Math.round((flaeche / 4200) * (reduziert ? 0.5 : 1));
    flocken = Array.from({ length: anzahlFlocken }, () => neueFlocke(true));
  }

  function zeichneSterne(t) {
    for (const s of sterne) {
      const funkeln = 0.55 + 0.45 * Math.sin(t * s.tempo + s.phase);
      ctx.globalAlpha = 0.35 + 0.65 * funkeln;
      ctx.fillStyle = `rgb(${s.farbe})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.gross) {
        // kleines Funkelkreuz
        const l = s.r * (3 + 2.5 * funkeln);
        ctx.globalAlpha = 0.35 * funkeln;
        ctx.strokeStyle = `rgb(${s.farbe})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x - l, s.y); ctx.lineTo(s.x + l, s.y);
        ctx.moveTo(s.x, s.y - l); ctx.lineTo(s.x, s.y + l);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function zeichneFlocken(dt, t) {
    for (const f of flocken) {
      f.y += f.tempo * dt;
      const x = f.x + Math.sin(t * f.schwanken + f.phase) * f.weite;
      if (f.y > hoehe + 8) Object.assign(f, neueFlocke(false));
      const bild = flockenBild(f.r);
      const g = f.r * 2 * 1.6;
      ctx.globalAlpha = f.alpha;
      ctx.drawImage(bild, x - g / 2, f.y - g / 2, g, g);
    }
    ctx.globalAlpha = 1;
  }

  // --- Sternschnuppen ------------------------------------------------------
  function neueSchnuppe(jetzt) {
    const nachRechts = Math.random() < 0.5;
    const winkel = zufall(18, 34) * (Math.PI / 180);
    const tempo = zufall(330, 430);
    schnuppen.push({
      x0: zufall(breite * 0.1, breite * 0.9), y0: zufall(hoehe * 0.03, hoehe * 0.22),
      vx: Math.cos(winkel) * tempo * (nachRechts ? 1 : -1), vy: Math.sin(winkel) * tempo,
      start: jetzt, dauer: zufall(1.3, 1.8), getroffen: false,
    });
  }

  function zeichneSchnuppen(jetzt) {
    schnuppen = schnuppen.filter((s) => jetzt - s.start < s.dauer + 0.9);
    for (const s of schnuppen) {
      const alter = jetzt - s.start;
      if (alter > s.dauer || s.getroffen) continue;
      const fortschritt = alter / s.dauer;
      const kx = s.x0 + s.vx * alter, ky = s.y0 + s.vy * alter;
      const laenge = 110 * Math.sin(Math.PI * Math.min(1, fortschritt * 1.1));
      const n = Math.hypot(s.vx, s.vy);
      const sx = kx - (s.vx / n) * laenge, sy = ky - (s.vy / n) * laenge;
      const deckkraft = Math.sin(Math.PI * fortschritt);
      const verlauf = ctx.createLinearGradient(sx, sy, kx, ky);
      verlauf.addColorStop(0, 'rgba(255,240,200,0)');
      verlauf.addColorStop(1, `rgba(255,250,235,${0.9 * deckkraft})`);
      ctx.strokeStyle = verlauf;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(kx, ky); ctx.stroke();
      ctx.globalAlpha = deckkraft;
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath(); ctx.arc(kx, ky, 1.9, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // --- Funken --------------------------------------------------------------
  const FUNKENFARBEN = ['255,226,140', '255,246,214', '255,200,120', '220,236,255'];
  function funkenStreuen(x, y, anzahl = 16, art = 'regen') {
    for (let i = 0; i < anzahl; i++) {
      const w = art === 'regen' ? zufall(0, Math.PI * 2) : zufall(Math.PI * 0.3, Math.PI * 0.7);
      const v = art === 'regen' ? zufall(20, 90) : zufall(4, 18);
      funken.push({
        x, y, vx: Math.cos(w) * v, vy: Math.sin(w) * v - (art === 'regen' ? 30 : 0),
        leben: 0, dauer: art === 'regen' ? zufall(0.9, 1.6) : zufall(0.8, 1.4),
        r: art === 'regen' ? zufall(0.8, 1.7) : zufall(0.6, 1.3),
        farbe: FUNKENFARBEN[(Math.random() * FUNKENFARBEN.length) | 0],
        schwere: art === 'regen' ? 75 : 18,
      });
    }
    if (!laeuft) starten();
  }

  function zeichneFunken(dt) {
    funken = funken.filter((f) => (f.leben += dt) < f.dauer);
    for (const f of funken) {
      f.vy += f.schwere * dt;
      f.vx *= 1 - 1.2 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      const a = 1 - f.leben / f.dauer;
      ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(f.leben * 30));
      ctx.fillStyle = `rgb(${f.farbe})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // --- Hauptschleife -------------------------------------------------------
  function bild(zeitMs) {
    if (!laeuft) return;
    const jetzt = zeitMs / 1000;
    const dt = Math.min(0.05, letzteZeit ? jetzt - letzteZeit : 0.016);
    letzteZeit = jetzt;
    ctx.clearRect(0, 0, breite, hoehe);
    zeichneSterne(jetzt);
    if (!reduziert) {
      if (!naechsteSchnuppe) naechsteSchnuppe = jetzt + zufall(8, 16);
      if (jetzt > naechsteSchnuppe) { neueSchnuppe(jetzt); naechsteSchnuppe = jetzt + zufall(14, 32); }
      zeichneSchnuppen(jetzt);
    }
    zeichneFlocken(dt, jetzt);
    zeichneFunken(dt);
    requestAnimationFrame(bild);
  }

  function starten() {
    if (laeuft || pausiert || document.hidden) return;
    laeuft = true;
    letzteZeit = 0;
    requestAnimationFrame(bild);
  }
  function anhalten() { laeuft = false; }

  document.addEventListener('visibilitychange', () => (document.hidden ? anhalten() : starten()));
  let wartezeit;
  window.addEventListener('resize', () => { clearTimeout(wartezeit); wartezeit = setTimeout(groesseAnpassen, 150); });
  groesseAnpassen();
  starten();

  return {
    /** Prüft, ob an dieser Stelle eine Sternschnuppe ist – wenn ja: Funkenregen */
    tippen(x, y) {
      const jetzt = performance.now() / 1000;
      for (const s of schnuppen) {
        const alter = Math.min(jetzt - s.start, s.dauer);
        if (s.getroffen || alter < 0) continue;
        const kx = s.x0 + s.vx * alter, ky = s.y0 + s.vy * alter;
        // Abstand zur Flugbahn (Strecke vom Start bis zum Kopf)
        const dx = kx - s.x0, dy = ky - s.y0;
        const l2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((x - s.x0) * dx + (y - s.y0) * dy) / l2));
        if (Math.hypot(x - (s.x0 + t * dx), y - (s.y0 + t * dy)) < 48) {
          s.getroffen = true;
          funkenStreuen(kx, ky, 22, 'regen');
          return true;
        }
      }
      return false;
    },
    funken: funkenStreuen,
    pause(an) {
      pausiert = an;
      if (an) anhalten(); else starten();
    },
  };
}
