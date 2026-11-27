/*
 * Einstieg: baut die Seite zusammen.
 *   ?debug         → Debug-Ansicht der Tippflächen (ohne Inhalte)
 *   ?test=CODEWORT → Testmodus: alle Türchen öffenbar, Knopf „Alles zurücksetzen“
 *   ?test=CODEWORT&datum=2026-12-05 → Testmodus mit vorgetäuschtem Datum
 *   ?test=CODEWORT&variante=flug     → immer „Flug durchs Türchen“ (oder: variante=brief)
 * In der Testleiste lassen sich Schneesturm und ein Meme direkt auslösen.
 */
import { bauHaus } from './haus.js';
import { starteHimmel } from './himmel.js';
import { baueSzene, starteSchlitten } from './szene.js';
import { starteLichterkette } from './lichterkette.js';
import { entsperren, musik, tonPausieren } from './klang.js';
import { speicher } from './speicher.js';
import { istCodewort, zeigeCodewort } from './codewort.js';
import { starteKalender } from './kalender.js';
import { starteMemes } from './memes.js';
import { VIDEOS } from './meme-videos.js';
import { starteSchneesturm } from './schneesturm.js';

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

// --- Schneesturm (Handy schütteln) -------------------------------------------------
const sturm = starteSchneesturm({
  reduziert,
  istBlockiert: () => document.body.classList.contains('karte-offen') || !!document.querySelector('.codewort'),
});

// --- Inhalte ----------------------------------------------------------------------
async function ladeInhalte() {
  try {
    const { DATEN, MEMES = [] } = await import('./inhalte-verpackt.js');
    const bytes = Uint8Array.from(atob(DATEN.split('').reverse().join('')), (z) => z.charCodeAt(0));
    return { inhalte: JSON.parse(new TextDecoder().decode(bytes)), memeBilder: MEMES };
  } catch (fehler) {
    console.error('Inhalte konnten nicht geladen werden:', fehler);
    return { inhalte: Array.from({ length: 24 }, () => ({ typ: 'spruch', text: 'Hier fehlt noch der Inhalt.' })), memeBilder: [] };
  }
}

// Während ein Video-Meme läuft, macht die Spieluhr Pause
let musikPausiertFuerVideo = false;
function beiVideo(laeuft) {
  if (laeuft && musik.laeuft) {
    musikPausiertFuerVideo = true;
    musik.stop();
  } else if (!laeuft && musikPausiertFuerVideo) {
    musikPausiertFuerVideo = false;
    if (musikAn) musik.start();
  }
}

// --- Testmodus ----------------------------------------------------------------------
function zeigeTestleiste(simulierterTag, memes) {
  const leiste = document.createElement('div');
  leiste.className = 'testleiste';
  const info = simulierterTag
    ? `Test · ${simulierterTag.toLocaleDateString('de-DE')}`
    : 'Testmodus';
  leiste.innerHTML = `<span>${info}</span>
    <button type="button" class="test-sturm">Sturm</button>
    <button type="button" class="test-meme">Meme</button>
    <button type="button" class="test-reset">Zurücksetzen</button>`;
  leiste.querySelector('.test-sturm').addEventListener('click', () => sturm.ausloesen());

  // Sensor-Anzeige (nur im Testmodus): zeigt, ob das Handy Bewegungsdaten liefert
  // und wie stark gerade geschüttelt wird (ab 12 löst ein Ausschlag aus, zwei davon = Sturm)
  const sensorInfo = document.createElement('div');
  sensorInfo.className = 'test-sensor';
  document.body.append(sensorInfo);
  setInterval(() => {
    const s = sturm.sensor;
    sensorInfo.textContent = s.status === 'aktiv'
      ? `Sensor aktiv · Schütteln: ${Math.round(s.spitze)} (Sturm ab 12)`
      : `Sensor: ${s.status}`;
    sensorInfo.classList.toggle('stark', s.status === 'aktiv' && s.spitze >= 12);
  }, 250);
  leiste.querySelector('.test-meme').addEventListener('click', () => {
    if (!document.body.classList.contains('meme-offen')) memes.zeigen({ nr: 24, text: 'Noch 23 Tage bis Türchen 24! (Test)' });
  });
  leiste.querySelector('.test-reset').addEventListener('click', () => {
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

  const { inhalte, memeBilder } = await ladeInhalte();
  const memes = starteMemes({ bilder: memeBilder, videos: VIDEOS, reduziert, beiVideo });
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
    memes,
  });
  if (testmodus) zeigeTestleiste(simulierterTag, memes);

  // Schütteln: Bewegungssensoren freischalten. Android & Co. sofort; das iPhone braucht
  // dafür ein Antippen und fragt dann einmal nach – deshalb bei jedem Tippen erneut versuchen,
  // bis es geklappt hat (bewegungErlauben() tut danach nichts mehr).
  sturm.bewegungErlauben();
  window.addEventListener('click', () => sturm.bewegungErlauben(), true);
  window.addEventListener('touchend', () => sturm.bewegungErlauben(), true);
})();
