/*
 * Debug-Ansicht (Adresse mit „?debug“)
 * ------------------------------------
 * Zeigt jedes Türchen als Umriss mit Nummer (durchgezogen = gemaltes Türchen,
 * gestrichelt = unsichtbare Tippfläche). Zum Nachjustieren:
 *   - Rahmen ziehen            → verschieben
 *   - Ecke unten rechts ziehen → Größe ändern
 *   - Pfeiltasten              → ausgewähltes Türchen um 0,1 % verschieben
 *   - Umschalt + Pfeiltasten   → Größe um 0,1 % ändern
 *   - „Werte kopieren“         → fertigen Code für js/tueren.js in die Zwischenablage
 * Änderungen gelten nur bis zum Neuladen – dauerhaft werden sie erst in js/tueren.js.
 */
import { HAUSBILD, TUEREN, MIN_TIPPFLAECHE_PX } from './tueren.js';
import { inOriginalPixel, imHausProzent } from './haus.js';

const OB = HAUSBILD.originalBreite;
const OH = HAUSBILD.originalHoehe;
const runde = (v) => Math.round(v * 10) / 10;

export function starteDebug(haus) {
  document.body.classList.add('debug');
  const hausEl = haus.element;

  // --- Ebene mit den Umrissen ---------------------------------------------
  const ebene = document.createElement('div');
  ebene.className = 'dbg-ebene';
  hausEl.append(ebene);

  const rahmen = new Map(); // nr → { rahmen, tipp, schild }
  for (const t of TUEREN) {
    const tipp = document.createElement('div');
    tipp.className = 'dbg-tipp';
    const r = document.createElement('div');
    r.className = 'dbg-rahmen';
    r.dataset.form = t.form;
    r.dataset.nr = t.nr;
    const schild = document.createElement('span');
    schild.className = 'dbg-nummer';
    schild.textContent = t.nr;
    const griff = document.createElement('span');
    griff.className = 'dbg-griff';
    griff.title = 'Ziehen: Größe ändern';
    r.append(schild, griff);
    ebene.append(tipp, r);
    rahmen.set(t.nr, { rahmen: r, tipp });

    r.addEventListener('pointerdown', (e) => starteZiehen(e, t, e.target === griff ? 'groesse' : 'verschieben'));
  }

  // --- Bedienfeld -----------------------------------------------------------
  const feld = document.createElement('section');
  feld.className = 'dbg-feld';
  feld.innerHTML = `
    <div class="dbg-kopfzeile">
      <strong>Debug-Ansicht</strong>
      <button type="button" data-aktion="blass">Bild blass</button>
      <button type="button" data-aktion="kopieren">Werte kopieren</button>
      <button type="button" data-aktion="zu" aria-label="Bedienfeld ein-/ausklappen">▾</button>
    </div>
    <div class="dbg-inhalt">
      <p class="dbg-hinweis">Rahmen ziehen = verschieben, Ecke = Größe, Pfeiltasten = fein (Umschalt = Größe). Werte in % des Originalbilds.</p>
      <p class="dbg-zeile" data-feld="auswahl">Kein Türchen ausgewählt – tippe einen Rahmen an.</p>
      <p class="dbg-zeile" data-feld="zeiger"></p>
      <p class="dbg-zeile" data-feld="info"></p>
      <p class="dbg-zeile dbg-warnung" data-feld="warnung"></p>
      <textarea class="dbg-ausgabe" readonly hidden></textarea>
    </div>`;
  document.body.append(feld);
  const feldTeil = (name) => feld.querySelector(`[data-feld="${name}"]`);
  const ausgabe = feld.querySelector('.dbg-ausgabe');

  feld.addEventListener('click', async (e) => {
    const aktion = e.target.closest('button')?.dataset.aktion;
    if (aktion === 'blass') document.body.classList.toggle('dbg-blass');
    if (aktion === 'zu') feld.classList.toggle('zu');
    if (aktion === 'kopieren') {
      const text = alsCode();
      ausgabe.value = text;
      ausgabe.hidden = false;
      ausgabe.select();
      try {
        await navigator.clipboard.writeText(text);
        e.target.textContent = 'Kopiert ✓';
      } catch {
        e.target.textContent = 'Unten markiert – kopieren';
      }
      setTimeout(() => (e.target.textContent = 'Werte kopieren'), 2500);
    }
  });

  // --- Auswahl, Ziehen, Tastatur -------------------------------------------
  let auswahl = null;
  function waehle(t) {
    auswahl = t;
    for (const [nr, { rahmen: r }] of rahmen) r.classList.toggle('gewaehlt', t && nr === t.nr);
    zeigeAuswahl();
  }
  function zeigeAuswahl() {
    if (!auswahl) return;
    const tf = haus.tippflaeche(auswahl.nr);
    const m = haus.massstab();
    const z = (v) => runde(v).toFixed(1);
    feldTeil('auswahl').textContent =
      `Türchen ${auswahl.nr} (${auswahl.form}): links ${z(auswahl.links)}, oben ${z(auswahl.oben)}, ` +
      `breite ${z(auswahl.breite)}, hoehe ${z(auswahl.hoehe)} – Tippfläche ${Math.round(tf.w * m)} × ${Math.round(tf.h * m)} px`;
  }

  function starteZiehen(e, t, art) {
    e.preventDefault();
    e.stopPropagation();
    waehle(t);
    const ziel = e.currentTarget;
    ziel.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY, links: t.links, oben: t.oben, breite: t.breite, hoehe: t.hoehe };
    const bewegen = (ev) => {
      const m = haus.massstab();
      const dx = ((ev.clientX - start.x) / m / OB) * 100; // Bildschirm-Pixel → % des Originals
      const dy = ((ev.clientY - start.y) / m / OH) * 100;
      if (art === 'verschieben') { t.links = start.links + dx; t.oben = start.oben + dy; }
      else { t.breite = Math.max(1, start.breite + dx); t.hoehe = Math.max(1, start.hoehe + dy); }
      haus.aktualisieren();
    };
    const ende = () => {
      for (const k of ['links', 'oben', 'breite', 'hoehe']) t[k] = runde(t[k]);
      haus.aktualisieren();
      ziel.removeEventListener('pointermove', bewegen);
      ziel.removeEventListener('pointerup', ende);
      ziel.removeEventListener('pointercancel', ende);
    };
    ziel.addEventListener('pointermove', bewegen);
    ziel.addEventListener('pointerup', ende);
    ziel.addEventListener('pointercancel', ende);
  }

  window.addEventListener('keydown', (e) => {
    if (!auswahl || !e.key.startsWith('Arrow')) return;
    e.preventDefault();
    const s = 0.1;
    const d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
    if (e.shiftKey) { auswahl.breite = runde(Math.max(1, auswahl.breite + d[0])); auswahl.hoehe = runde(Math.max(1, auswahl.hoehe + d[1])); }
    else { auswahl.links = runde(auswahl.links + d[0]); auswahl.oben = runde(auswahl.oben + d[1]); }
    haus.aktualisieren();
  });

  // Zeigerposition in % des Originals (praktisch zum Ausmessen)
  hausEl.addEventListener('pointermove', (e) => {
    const box = hausEl.getBoundingClientRect();
    const m = haus.massstab();
    const x = (e.clientX - box.left) / m + HAUSBILD.ausschnitt.x;
    const y = (e.clientY - box.top) / m + HAUSBILD.ausschnitt.y;
    feldTeil('zeiger').textContent = `Zeiger: links ${runde((x / OB) * 100)} %, oben ${runde((y / OH) * 100)} %`;
  });

  // --- Zeichnen -----------------------------------------------------------
  function zeichnen() {
    const m = haus.massstab();
    const zuKlein = [];
    for (const t of TUEREN) {
      const { rahmen: r, tipp } = rahmen.get(t.nr);
      setzeRechteck(r, imHausProzent(inOriginalPixel(t)));
      const tf = haus.tippflaeche(t.nr);
      setzeRechteck(tipp, imHausProzent(tf));
      const klein = Math.round(tf.w * m) < MIN_TIPPFLAECHE_PX || Math.round(tf.h * m) < MIN_TIPPFLAECHE_PX;
      tipp.classList.toggle('zu-klein', klein);
      if (klein) zuKlein.push(`${t.nr} (${Math.round(tf.w * m)} × ${Math.round(tf.h * m)} px)`);
    }
    feldTeil('info').textContent =
      `Haus: ${Math.round(hausEl.clientWidth)} × ${Math.round(hausEl.clientHeight)} px, Fenster: ${innerWidth} × ${innerHeight} px, ` +
      `Mindest-Tippfläche: ${MIN_TIPPFLAECHE_PX} px`;
    feldTeil('warnung').textContent = zuKlein.length ? `Tippfläche zu klein: ${zuKlein.join(', ')}` : 'Alle Tippflächen ≥ 44 × 44 px ✓';
    feldTeil('warnung').classList.toggle('ok', !zuKlein.length);
    zeigeAuswahl();
  }
  hausEl.addEventListener('haus-aktualisiert', zeichnen);
  zeichnen();
}

function setzeRechteck(el, r) {
  Object.assign(el.style, { left: `${r.links}%`, top: `${r.oben}%`, width: `${r.breite}%`, height: `${r.hoehe}%` });
}

/** Erzeugt den Code-Block für js/tueren.js */
function alsCode() {
  const wert = (v) => `${runde(v).toFixed(1)},`.padEnd(5);
  const zeilen = TUEREN.map((t) => {
    const nr = `${t.nr},`.padEnd(3);
    const form = `'${t.form}',`.padEnd(11);
    return `  { nr: ${nr} form: ${form} links: ${wert(t.links)} oben: ${wert(t.oben)} breite: ${wert(t.breite)} hoehe: ${runde(t.hoehe).toFixed(1)} },` +
      (t.nr === 18 ? ' // Kranzfenster' : '');
  });
  return `export const TUEREN = [\n${zeilen.join('\n')}\n];\n`;
}
