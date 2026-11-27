/*
 * Baut die Landschaft um das Haus: Mond, Schneeboden, Tannen, Rentiere, Schlitten.
 * Grundregel: Nichts liegt über den Türchen. Bäume stehen HINTER dem Haus,
 * Rentiere und vorderer Schnee nur unterhalb der Türchen.
 */
import { alsElement, mondSvg, baumSvg, rentierSvg, schlittenSvg, bodenHintenSvg, bodenVorneSvg } from './deko.js';

export function baueSzene({ welt, vordergrund, reduziert }) {
  // --- Mond -----------------------------------------------------------------
  const mond = alsElement(mondSvg());
  welt.querySelector('.himmel').after(mond);

  // --- Boden hinten, Bäume, Boden vorne -------------------------------------
  const hinten = document.createElement('div');
  hinten.className = 'boden-hinten';
  hinten.append(alsElement(bodenHintenSvg()));

  const baeume = document.createElement('div');
  baeume.className = 'baeume';
  // [Klasse, Lichter, Stern, Farbton] – innen: halb hinter dem Haus; außen: nur auf breiten Bildschirmen sichtbar
  const BAEUME = [
    ['baum--links-innen', true, true, 0],
    ['baum--rechts-innen', true, false, 1],
    ['baum--links-mitte', false, false, 2],
    ['baum--rechts-mitte', false, false, 0],
    ['baum--links-aussen', true, false, 1],
    ['baum--rechts-aussen', false, true, 2],
  ];
  for (const [klasse, lichter, stern, ton] of BAEUME) {
    const b = alsElement(baumSvg({ lichter, stern, ton }));
    b.classList.add(klasse);
    baeume.append(b);
  }

  const vorne = document.createElement('div');
  vorne.className = 'boden-vorne';
  vorne.append(alsElement(bodenVorneSvg()));
  const glitzer = document.createElement('div');
  glitzer.className = 'boden-glitzer';
  vorne.append(glitzer);

  // --- Rentiere ---------------------------------------------------------------
  const rentiere = document.createElement('div');
  rentiere.className = 'rentiere';
  const RENTIERE = [
    { klasse: 'rentier--gross', art: 'gross', schal: true },
    { klasse: 'rentier--kalb', art: 'kalb', glocke: true },
    { klasse: 'rentier--nase', art: 'gross', nase: true },
  ];
  for (const r of RENTIERE) {
    const huelle = document.createElement('div');
    huelle.className = `rentier ${r.klasse}`;
    huelle.append(alsElement(rentierSvg(r)));
    huelle.addEventListener('pointerdown', () => hopsen(huelle, reduziert));
    rentiere.append(huelle);
  }

  vordergrund.append(hinten, baeume, vorne, rentiere);

  // --- Schlitten ----------------------------------------------------------------
  const schlitten = document.createElement('div');
  schlitten.className = 'schlitten';
  schlitten.innerHTML = `<div class="schlitten-wippe">${schlittenSvg()}</div>`;
  mond.after(schlitten);

  return { mond, schlitten };
}

/** Kleiner Hopser beim Antippen eines Rentiers */
function hopsen(el, reduziert) {
  if (el.dataset.hopst) return;
  el.dataset.hopst = '1';
  const spiegel = el.classList.contains('rentier--nase') ? ' scaleX(-1)' : '';
  const hoehe = reduziert ? 4 : 18;
  const a = el.animate(
    [
      { transform: `translateY(0) scale(1, 1)${spiegel}` },
      { transform: `translateY(1px) scale(1.04, 0.94)${spiegel}`, offset: 0.12 },
      { transform: `translateY(-${hoehe}px) scale(0.97, 1.04)${spiegel}`, offset: 0.45, easing: 'ease-in' },
      { transform: `translateY(0) scale(1.05, 0.93)${spiegel}`, offset: 0.78 },
      { transform: `translateY(0) scale(1, 1)${spiegel}` },
    ],
    { duration: 620, easing: 'ease-out' },
  );
  a.finished.finally(() => delete el.dataset.hopst);
}

/**
 * Der Weihnachtsmann fliegt etwa alle 45–90 Sekunden langsam über den Himmel
 * (hinter dem Haus, also nie über den Türchen) und hinterlässt Glitzer.
 */
export function starteSchlitten(schlitten, himmel, { reduziert }) {
  if (reduziert) return;
  let richtungRechts = true;
  const zufall = (a, b) => a + Math.random() * (b - a);

  function planen(sekunden) {
    setTimeout(fliegen, sekunden * 1000);
  }

  function fliegen() {
    if (document.hidden || document.body.classList.contains('karte-offen')) { planen(8); return; }
    const breite = innerWidth;
    const eigene = schlitten.offsetWidth || 180;
    const von = richtungRechts ? -eigene - 20 : breite + 20;
    const nach = richtungRechts ? breite + 20 : -eigene - 20;
    const spiegel = richtungRechts ? '' : ' scaleX(-1)';
    schlitten.style.visibility = 'visible';
    const dauer = zufall(11000, 14500);
    const flug = schlitten.animate(
      [
        { transform: `translate(${von}px, 10px)${spiegel}` },
        { transform: `translate(${(von + nach) / 2}px, -8px)${spiegel}` },
        { transform: `translate(${nach}px, 6px)${spiegel}` },
      ],
      { duration: dauer, easing: 'linear' },
    );
    // Glitzerspur hinter dem Schlitten
    const spur = setInterval(() => {
      const r = schlitten.getBoundingClientRect();
      const x = richtungRechts ? r.left + r.width * 0.08 : r.right - r.width * 0.08;
      himmel.funken(x, r.top + r.height * 0.8, 2, 'spur');
    }, 110);
    flug.finished.finally(() => {
      clearInterval(spur);
      schlitten.style.visibility = 'hidden';
      richtungRechts = !richtungRechts;
      planen(zufall(45, 90));
    });
  }

  planen(zufall(18, 28));
}
