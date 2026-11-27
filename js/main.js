/*
 * Einstieg: baut die Seite zusammen.
 *   ?debug         → Debug-Ansicht der Tippflächen (ohne Inhalte)
 *   ?test=CODEWORT → Testmodus: alle Türchen öffenbar, Knopf „Alles zurücksetzen“
 *   ?test=CODEWORT&datum=2026-12-05 → Testmodus mit vorgetäuschtem Datum
 *   ?test=CODEWORT&variante=flug     → immer „Flug durchs Türchen“ (oder: variante=brief)
 */
import { bauHaus } from './haus.js';
import { starteHimmel } from './himmel.js';
import { baueSzene, starteSchlitten } from './szene.js';
import { starteLichterkette } from './lichterkette.js';
import { entsperren, musik, tonPausieren } from './klang.js';
import { speicher } from './speicher.js';
import { istCodewort, zeigeCodewort } from './codewort.js';
import { starteKalender } from './kalender.js';

const parameter = new URLSearchParams(location.search);
const debug = parameter.has('debug');
const reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches;
const welt = document.getElementById('welt');

// --- Szene ------------------------------------------------------------------
let kalender = null;
const haus = bauHaus(document.getElementById('haus'), {
  beimTippen(nr) {
    if (!debug) kalender?.tippen(nr);
  },
});
const { mond, schlitten } = baueSzene({ welt, vordergrund: document.querySelector('.vordergrund'), reduziert });
const himmel = starteHimmel(document.getElementById('himmel-canvas'), { reduziert, mondElement: mond });
starteLichterkette(document.querySelector('.kopf'), { reduziert });
if (!debug) starteSchlitten(schlitten, himmel, { reduziert });

// Antippen am Himmel: trifft es eine Sternschnuppe, gibt es einen kleinen Funkenregen
welt.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button, .tuer, .rentier, .zugschnur')) return;
  himmel.tippen(e.clientX, e.clientY);
});

// --- Musik --------------------------------------------------------------------
const musikKnopf = document.getElementById('musik-knopf');
let musikAn = speicher.get('musik', true);
function musikZeigen() {
  musikKnopf.setAttribute('aria-pressed', String(musikAn));
  musikKnopf.setAttribute('aria-label', musikAn ? 'Musik ausschalten' : 'Musik einschalten');
  musikKnopf.classList.toggle('aus', !musikAn);
}
musikKnopf.addEventListener('click', () => {
  musikAn = !musikAn;
  speicher.set('musik', musikAn);
  musikZeigen();
  if (musikAn) musik.start();
  else musik.stop();
});
musikZeigen();

// Browser erlauben Ton erst nach einer Interaktion: bei der ersten Berührung freischalten
function freischalten(e) {
  entsperren();
  if (debug || e.target?.closest?.('#musik-knopf')) return;
  if (musikAn && !musik.laeuft) musik.start();
}
for (const typ of ['pointerdown', 'touchend', 'click', 'keydown']) {
  window.addEventListener(typ, freischalten, { capture: true, passive: true });
}
document.addEventListener('visibilitychange', () => tonPausieren(document.hidden));

// --- Inhalte ----------------------------------------------------------------------
async function ladeInhalte() {
  try {
    const { DATEN } = await import('./inhalte-verpackt.js');
    const bytes = Uint8Array.from(atob(DATEN.split('').reverse().join('')), (z) => z.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (fehler) {
    console.error('Inhalte konnten nicht geladen werden:', fehler);
    return Array.from({ length: 24 }, () => ({ typ: 'spruch', text: 'Hier fehlt noch der Inhalt.' }));
  }
}

// --- Testmodus ----------------------------------------------------------------------
function zeigeTestleiste(simulierterTag) {
  const leiste = document.createElement('div');
  leiste.className = 'testleiste';
  const info = simulierterTag
    ? `Testmodus · Datum: ${simulierterTag.toLocaleDateString('de-DE')}`
    : 'Testmodus · alle Türchen offen';
  leiste.innerHTML = `<span>${info}</span><button type="button">Alles zurücksetzen</button>`;
  leiste.querySelector('button').addEventListener('click', () => {
    if (!confirm('Alle geöffneten Türchen, das Codewort und die Einstellungen zurücksetzen?')) return;
    speicher.allesLoeschen();
    location.reload();
  });
  document.body.append(leiste);
}

// --- Start ----------------------------------------------------------------------------
(async () => {
  if (debug) {
    const { starteDebug } = await import('./debug.js');
    starteDebug(haus);
    return;
  }
  const testwert = parameter.get('test');
  const testmodus = testwert !== null && (await istCodewort(testwert));

  if (!testmodus && !speicher.get('zugang', false)) {
    await zeigeCodewort({ reduziert });
    speicher.set('zugang', true);
  }

  let simulierterTag = null;
  if (testmodus && parameter.get('datum')) {
    const d = new Date(`${parameter.get('datum')}T12:00:00`);
    if (!Number.isNaN(d.getTime())) simulierterTag = d;
  }

  const inhalte = await ladeInhalte();
  kalender = starteKalender({
    haus,
    inhalte,
    testmodus: testmodus && !simulierterTag,
    simulierterTag,
    welt,
    himmel,
    ebene: document.getElementById('vorhang-ebene'),
    reduziert,
    festeVariante: testmodus ? parameter.get('variante') : null,
  });
  if (testmodus) zeigeTestleiste(simulierterTag);
})();
