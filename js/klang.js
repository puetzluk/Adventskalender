/*
 * Klänge – alles selbst erzeugt mit der Web Audio API, keine Audiodateien.
 *  - klick():        leises „Klick“ der Zugschnur
 *  - gloeckchen():   kurzer Glöckchenklang beim Öffnen eines Türchens
 *  - musik:          Spieluhr mit gemeinfreien Melodien (Jingle Bells, O Tannenbaum, Stille Nacht)
 * Browser erlauben Ton erst nach einer Berührung/einem Klick → entsperren() dort aufrufen.
 */

let ctx = null;
let ausgang = null;  // Gesamtlautstärke
let hallEingang = null;

export function entsperren() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    ausgang = ctx.createGain();
    ausgang.gain.value = 0.9;
    ausgang.connect(ctx.destination);
    // weicher Raumhall aus selbst erzeugtem Rauschen
    const hall = ctx.createConvolver();
    hall.buffer = hallImpuls(2.4);
    hallEingang = ctx.createGain();
    hallEingang.gain.value = 0.32;
    hallEingang.connect(hall).connect(ausgang);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export const tonBereit = () => !!ctx && ctx.state === 'running';

/** Ton anhalten/fortsetzen, z. B. wenn der Tab in den Hintergrund geht */
export function tonPausieren(pause) {
  if (!ctx) return;
  if (pause) ctx.suspend().catch(() => {});
  else ctx.resume().catch(() => {});
}

function hallImpuls(sekunden) {
  const laenge = Math.round(ctx.sampleRate * sekunden);
  const puffer = ctx.createBuffer(2, laenge, ctx.sampleRate);
  for (let k = 0; k < 2; k++) {
    const d = puffer.getChannelData(k);
    for (let i = 0; i < laenge; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / laenge, 3.2);
  }
  return puffer;
}

/** Ziel für einen Klang: direkt + etwas Hall */
function verbinde(knoten, hallAnteil = 1) {
  knoten.connect(ausgang);
  if (hallAnteil > 0) {
    const g = ctx.createGain();
    g.gain.value = hallAnteil;
    knoten.connect(g).connect(hallEingang);
  }
}

// ---------------------------------------------------------------------------
// Klick (Zugschnur)
// ---------------------------------------------------------------------------
export function klick() {
  if (!entsperren()) return;
  const t = ctx.currentTime + 0.005;
  const laenge = Math.round(ctx.sampleRate * 0.03);
  const rauschen = ctx.createBuffer(1, laenge, ctx.sampleRate);
  const d = rauschen.getChannelData(0);
  for (let i = 0; i < laenge; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / laenge, 4);
  const quelle = ctx.createBufferSource();
  quelle.buffer = rauschen;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2300;
  filter.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.value = 0.35;
  quelle.connect(filter).connect(g);
  verbinde(g, 0.15);
  quelle.start(t);
  // dazu ein ganz kurzes tiefes „Tock“
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(320, t);
  o.frequency.exponentialRampToValueAtTime(140, t + 0.04);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.12, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(og);
  verbinde(og, 0.1);
  o.start(t);
  o.stop(t + 0.08);
}

// ---------------------------------------------------------------------------
// Glöckchen (Türchen öffnen)
// ---------------------------------------------------------------------------
function glocke(frequenz, t, laut) {
  // leicht unharmonische Teiltöne wie bei einer kleinen Glocke
  const teile = [[1, 1, 1.6], [2.0, 0.45, 1.0], [2.76, 0.32, 0.7], [4.07, 0.18, 0.45], [5.4, 0.1, 0.3]];
  for (const [faktor, staerke, abkling] of teile) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = frequenz * faktor;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(laut * staerke, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + abkling);
    o.connect(g);
    verbinde(g, 0.9);
    o.start(t);
    o.stop(t + abkling + 0.05);
  }
}

export function gloeckchen() {
  if (!entsperren()) return;
  const t = ctx.currentTime + 0.02;
  glocke(1568, t, 0.07);         // G6
  glocke(2093, t + 0.11, 0.055); // C7
  glocke(2637, t + 0.22, 0.045); // E7
  glocke(2093, t + 0.42, 0.03);
}

// ---------------------------------------------------------------------------
// Spieluhr
// ---------------------------------------------------------------------------
const HALBTOENE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function frequenz(note) {
  const m = /^([A-G])(b|#)?(\d)$/.exec(note);
  let n = HALBTOENE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = 12 * (Number(m[3]) + 1) + n;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
const quinte = (note) => frequenz(note) * 1.5;

// Melodien: [Note, Dauer in Schlägen, …];  Bass: ein Grundton pro Takt
const LIEDER = [
  {
    name: 'Jingle Bells', schlag: 0.42, taktSchlaege: 4, auftakt: 0,
    melodie: [
      'E5', 1, 'E5', 1, 'E5', 2, 'E5', 1, 'E5', 1, 'E5', 2, 'E5', 1, 'G5', 1, 'C5', 1.5, 'D5', 0.5, 'E5', 4,
      'F5', 1, 'F5', 1, 'F5', 1.5, 'F5', 0.5, 'F5', 1, 'E5', 1, 'E5', 1, 'E5', 0.5, 'E5', 0.5, 'E5', 1, 'D5', 1, 'D5', 1, 'E5', 1, 'D5', 2, 'G5', 2,
      'E5', 1, 'E5', 1, 'E5', 2, 'E5', 1, 'E5', 1, 'E5', 2, 'E5', 1, 'G5', 1, 'C5', 1.5, 'D5', 0.5, 'E5', 4,
      'F5', 1, 'F5', 1, 'F5', 1.5, 'F5', 0.5, 'F5', 1, 'E5', 1, 'E5', 1, 'E5', 0.5, 'E5', 0.5, 'G5', 1, 'G5', 1, 'F5', 1, 'D5', 1, 'C5', 4,
    ],
    bass: ['C4', 'C4', 'C4', 'C4', 'F3', 'C4', 'D4', 'G3', 'C4', 'C4', 'C4', 'C4', 'F3', 'C4', 'G3', 'C4'],
  },
  {
    name: 'O Tannenbaum', schlag: 0.5, taktSchlaege: 3, auftakt: 1,
    melodie: [
      'C5', 1,
      'F5', 0.75, 'F5', 0.25, 'F5', 1, 'G5', 1, 'A5', 0.75, 'A5', 0.25, 'A5', 1.5, 'A5', 0.5,
      'G5', 0.5, 'A5', 0.5, 'Bb5', 1, 'E5', 1, 'G5', 1, 'F5', 1, 'C6', 1,
      'C6', 0.75, 'A5', 0.25, 'D6', 1, 'C6', 1, 'C6', 0.75, 'Bb5', 0.25, 'Bb5', 1.5, 'Bb5', 0.5,
      'Bb5', 0.75, 'G5', 0.25, 'C6', 1, 'Bb5', 1, 'Bb5', 0.75, 'A5', 0.25, 'A5', 1.5, 'C5', 0.5,
      'F5', 0.75, 'F5', 0.25, 'F5', 1, 'G5', 1, 'A5', 0.75, 'A5', 0.25, 'A5', 1.5, 'A5', 0.5,
      'G5', 0.5, 'A5', 0.5, 'Bb5', 1, 'E5', 1, 'G5', 1, 'F5', 2,
    ],
    bass: ['F3', 'F3', 'C4', 'F3', 'F3', 'C4', 'C4', 'F3', 'F3', 'F3', 'C4', 'F3'],
  },
  {
    name: 'Stille Nacht', schlag: 0.3, taktSchlaege: 6, auftakt: 0,
    melodie: [
      'G5', 3, 'A5', 1, 'G5', 2, 'E5', 6, 'G5', 3, 'A5', 1, 'G5', 2, 'E5', 6,
      'D6', 4, 'D6', 2, 'B5', 6, 'C6', 4, 'C6', 2, 'G5', 6,
      'A5', 4, 'A5', 2, 'C6', 3, 'B5', 1, 'A5', 2, 'G5', 3, 'A5', 1, 'G5', 2, 'E5', 6,
      'A5', 4, 'A5', 2, 'C6', 3, 'B5', 1, 'A5', 2, 'G5', 3, 'A5', 1, 'G5', 2, 'E5', 6,
      'D6', 4, 'D6', 2, 'F6', 3, 'D6', 1, 'B5', 2, 'C6', 6, 'E6', 6,
      'C6', 3, 'G5', 1, 'E5', 2, 'G5', 3, 'F5', 1, 'D5', 2, 'C5', 12,
    ],
    bass: ['C4', 'C4', 'C4', 'C4', 'G3', 'G3', 'C4', 'C4', 'F3', 'F3', 'C4', 'C4', 'F3', 'F3', 'C4', 'C4', 'G3', 'G3', 'C4', 'C4', 'C4', 'G3', 'C4', 'C4'],
  },
];

/** Ereignisliste eines Liedes: { zeit (s ab Liedbeginn), frequenz, laut, dauer } */
function noten(lied) {
  const liste = [];
  let schlag = 0;
  for (let i = 0; i < lied.melodie.length; i += 2) {
    const dauer = lied.melodie[i + 1];
    liste.push({ zeit: schlag * lied.schlag, frequenz: frequenz(lied.melodie[i]), laut: 0.5, klang: 1.5 + dauer * lied.schlag });
    schlag += dauer;
  }
  lied.bass.forEach((ton, takt) => {
    const beginn = (lied.auftakt + takt * lied.taktSchlaege) * lied.schlag;
    liste.push({ zeit: beginn, frequenz: frequenz(ton), laut: 0.26, klang: 2.2 });
    // in geraden Takten zur Taktmitte noch die Quinte dazu
    if (lied.taktSchlaege % 2 === 0) {
      liste.push({ zeit: beginn + (lied.taktSchlaege / 2) * lied.schlag, frequenz: quinte(ton), laut: 0.15, klang: 1.6 });
    }
  });
  liste.sort((a, b) => a.zeit - b.zeit);
  return { liste, laenge: schlag * lied.schlag };
}

function spieluhrTon(ziel, f, t, laut, klang) {
  // Grundton + Oktave + ein heller, schnell verklingender Metallton
  const teile = [[1, 1, klang], [2, 0.22, klang * 0.5], [4.2, 0.08, 0.18]];
  for (const [faktor, staerke, abkling] of teile) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * faktor;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(laut * staerke, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + abkling);
    o.connect(g).connect(ziel);
    o.start(t);
    o.stop(t + abkling + 0.05);
  }
}

export const musik = (() => {
  let lautstaerke = null, uhr = null, liedNr = Math.floor(Math.random() * LIEDER.length);
  let aktuelles = null, liedStart = 0, zeiger = 0;

  function naechstesLied(beginn) {
    aktuelles = noten(LIEDER[liedNr % LIEDER.length]);
    liedNr++;
    liedStart = beginn;
    zeiger = 0;
  }

  function planen() {
    const bis = ctx.currentTime + 0.6;
    while (true) {
      if (zeiger >= aktuelles.liste.length) {
        naechstesLied(liedStart + aktuelles.laenge + 2.8); // kleine Pause zwischen den Liedern
        continue;
      }
      const n = aktuelles.liste[zeiger];
      const t = liedStart + n.zeit;
      if (t > bis) break;
      if (t >= ctx.currentTime - 0.05) spieluhrTon(lautstaerke, n.frequenz, Math.max(t, ctx.currentTime), n.laut, n.klang);
      zeiger++;
    }
  }

  return {
    get laeuft() { return !!uhr; },
    start() {
      if (uhr || !entsperren()) return;
      lautstaerke = ctx.createGain();
      lautstaerke.gain.setValueAtTime(0, ctx.currentTime);
      lautstaerke.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 1.5); // leise einblenden
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 5200;
      lautstaerke.connect(filter);
      verbinde(filter, 1.1);
      naechstesLied(ctx.currentTime + 0.3);
      planen();
      uhr = setInterval(planen, 150);
    },
    stop() {
      if (!uhr) return;
      clearInterval(uhr);
      uhr = null;
      const g = lautstaerke;
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(() => g.disconnect(), 700);
    },
  };
})();
