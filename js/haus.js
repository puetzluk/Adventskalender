/*
 * Das Haus: Bild, Türchen und ihre Tippflächen
 * --------------------------------------------
 * Jedes Türchen ist ein Element genau über dem gemalten Türchen (.tuer).
 * Darin liegt die Tippfläche (.tippflaeche, ein <button>). Ist ein Türchen auf dem
 * Bildschirm kleiner als MIN_TIPPFLAECHE_PX, wird nur die Tippfläche vergrößert –
 * und zwar so, dass sie höchstens bis zur halben Lücke zum Nachbartürchen reicht.
 */
import { HAUSBILD, TUEREN, MIN_TIPPFLAECHE_PX } from './tueren.js';

const OB = HAUSBILD.originalBreite;
const OH = HAUSBILD.originalHoehe;
const A = HAUSBILD.ausschnitt;

/** Türchen (Prozent im Original) → Pixel im Original */
export function inOriginalPixel(t) {
  return { x: (t.links / 100) * OB, y: (t.oben / 100) * OH, w: (t.breite / 100) * OB, h: (t.hoehe / 100) * OH };
}

/** Pixel im Original → Prozent des angezeigten Hausbilds (Ausschnitt) */
export function imHausProzent(p) {
  return {
    links: ((p.x - A.x) / A.breite) * 100,
    oben: ((p.y - A.y) / A.hoehe) * 100,
    breite: (p.w / A.breite) * 100,
    hoehe: (p.h / A.hoehe) * 100,
  };
}

/**
 * Berechnet für alle Türchen, wie weit die Tippfläche über das Türchen hinausragt
 * (in Pixeln des Originals, getrennt für jede Seite).
 * @param {number} minPx Mindestgröße der Tippfläche in Original-Pixeln
 */
export function berechneTippflaechen(tueren, minPx) {
  const r = tueren.map((t) => inOriginalPixel(t));
  const grenzen = { x: [A.x, A.x + A.breite], y: [A.y, A.y + A.hoehe] };

  return r.map((a) => {
    const erg = {};
    for (const achse of ['x', 'y']) {
      const laenge = achse === 'x' ? 'w' : 'h';
      const quer = achse === 'x' ? 'y' : 'x';
      const querLaenge = achse === 'x' ? 'h' : 'w';
      const bedarf = Math.max(0, minPx - a[laenge]) / 2;
      // Platz bis zum Bildrand …
      let platzVor = a[achse] - grenzen[achse][0];
      let platzNach = grenzen[achse][1] - (a[achse] + a[laenge]);
      // … und bis zur halben Lücke zu jedem Nachbarn, der quer dazu in Reichweite liegt
      const reichweite = Math.max(0, minPx - a[querLaenge]) / 2 + 1;
      for (const b of r) {
        if (b === a) continue;
        const querUeberlappt = b[quer] < a[quer] + a[querLaenge] + reichweite && b[quer] + b[querLaenge] > a[quer] - reichweite;
        if (!querUeberlappt) continue;
        if (b[achse] + b[laenge] <= a[achse]) platzVor = Math.min(platzVor, (a[achse] - b[achse] - b[laenge]) / 2);
        else if (b[achse] >= a[achse] + a[laenge]) platzNach = Math.min(platzNach, (b[achse] - a[achse] - a[laenge]) / 2);
      }
      let vor = Math.min(bedarf, platzVor);
      let nach = Math.min(bedarf, platzNach);
      // Was auf einer Seite fehlt, bekommt die andere Seite dazu
      if (vor < bedarf) nach = Math.min(platzNach, nach + (bedarf - vor));
      if (nach < bedarf) vor = Math.min(platzVor, vor + (bedarf - nach));
      erg[achse] = { vor: Math.max(0, vor), nach: Math.max(0, nach) };
    }
    return erg;
  });
}

/**
 * Baut das Haus in das Element `hausEl` und gibt eine kleine Schnittstelle zurück.
 * @param {HTMLElement} hausEl
 * @param {{ beimTippen?: (nr:number, tuerEl:HTMLElement) => void }} optionen
 */
export function bauHaus(hausEl, optionen = {}) {
  const bild = hausEl.querySelector('.haus-bild');
  const ebene = hausEl.querySelector('.tueren');
  // Seitenverhältnis des Hausbilds für das CSS (Größe des Hauses auf dem Bildschirm)
  document.documentElement.style.setProperty('--haus-verhaeltnis', String(A.breite / A.hoehe));

  const elemente = new Map(); // nr → { tuer, knopf }

  for (const t of TUEREN) {
    const tuer = document.createElement('div');
    tuer.className = 'tuer';
    tuer.dataset.nr = t.nr;
    tuer.dataset.form = t.form;

    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'tippflaeche';
    knopf.setAttribute('aria-label', `Türchen ${t.nr}`);
    knopf.addEventListener('click', () => optionen.beimTippen?.(t.nr, tuer));

    tuer.append(knopf);
    ebene.append(tuer);
    elemente.set(t.nr, { tuer, knopf });
  }

  /** Bildschirm-Pixel pro Original-Pixel */
  const massstab = () => hausEl.clientWidth / A.breite;

  let letzteTipp = [];
  /** Positionen und Tippflächen neu setzen (bei Größenänderung oder nach Debug-Änderungen) */
  function aktualisieren() {
    const m = massstab();
    if (!m) return;
    const minPx = MIN_TIPPFLAECHE_PX / m;
    letzteTipp = berechneTippflaechen(TUEREN, minPx);
    TUEREN.forEach((t, i) => {
      const { tuer, knopf } = elemente.get(t.nr);
      const p = inOriginalPixel(t);
      const r = imHausProzent(p);
      Object.assign(tuer.style, { left: `${r.links}%`, top: `${r.oben}%`, width: `${r.breite}%`, height: `${r.hoehe}%` });
      const e = letzteTipp[i];
      // Prozentwerte bei left/right beziehen sich auf die Breite, bei top/bottom auf die Höhe des Türchens
      Object.assign(knopf.style, {
        left: `${(-e.x.vor / p.w) * 100}%`,
        right: `${(-e.x.nach / p.w) * 100}%`,
        top: `${(-e.y.vor / p.h) * 100}%`,
        bottom: `${(-e.y.nach / p.h) * 100}%`,
      });
    });
    hausEl.dispatchEvent(new CustomEvent('haus-aktualisiert'));
  }

  new ResizeObserver(aktualisieren).observe(hausEl);
  if (bild.complete) aktualisieren();
  else bild.addEventListener('load', aktualisieren, { once: true });

  return {
    element: hausEl,
    elemente,
    massstab,
    aktualisieren,
    /** Tippfläche eines Türchens in Original-Pixeln (für die Debug-Ansicht) */
    tippflaeche(nr) {
      const i = TUEREN.findIndex((t) => t.nr === nr);
      const p = inOriginalPixel(TUEREN[i]);
      const e = letzteTipp[i];
      if (!e) return p;
      return { x: p.x - e.x.vor, y: p.y - e.y.vor, w: p.w + e.x.vor + e.x.nach, h: p.h + e.y.vor + e.y.nach };
    },
  };
}
