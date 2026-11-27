/*
 * Türchen-Logik und Öffnen-Animation
 * ----------------------------------
 *  - Dezember 2026, Datum vom Gerät (lokale Zeit).
 *  - Türchen N ab dem N. Dezember; verpasste Tage bleiben nachholbar; nach dem 24. ist alles offen.
 *  - Zu früh: Türchen wackelt und zeigt „Noch 3 Tage!“ (vor dem 1.12.: „Ab dem 1. Dezember geht's los“).
 *  - Öffnen: Türblatt klappt in 3D auf (pro Tag fest: links, rechts oder oben), Glöckchen,
 *    danach zufällig „Flug durchs Türchen“ oder „Brief“. Schließen spielt alles rückwärts ab.
 */
import { TUEREN, HAUSBILD } from './tueren.js';
import { inOriginalPixel } from './haus.js';
import { speicher } from './speicher.js';
import { gloeckchen } from './klang.js';
import { baueKarte } from './karten.js';

const JAHR = 2026;
const RICHTUNGEN = ['links', 'rechts', 'oben'];
const OFFEN = { links: 'rotateY(-108deg)', rechts: 'rotateY(108deg)', oben: 'rotateX(108deg)' };
const WEITER = { links: 'rotateY(-114deg)', rechts: 'rotateY(114deg)', oben: 'rotateX(114deg)' };

const el = (tag, klasse, text) => {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text != null) e.textContent = text;
  return e;
};

/** Animation, die ihren Endzustand hält (und rückwärts ihren Anfangszustand) */
const animiere = (element, frames, optionen) => element.animate(frames, { fill: 'both', ...optionen });

/**
 * Ein Ablauf aus Schritten, der sich rückwärts abspielen lässt.
 * Jeder Schritt startet Animationen; `vorRueckweg` wird vor dem Rückwärtsspielen
 * dieses Schritts ausgeführt (z. B. um eine Ebenen-Reihenfolge zurückzusetzen).
 */
class Ablauf {
  constructor() { this.schritte = []; }
  async schritt(erzeugen, vorRueckweg) {
    const animationen = [].concat(erzeugen() || []);
    this.schritte.push({ animationen, vorRueckweg });
    await Promise.all(animationen.map((a) => a.finished));
  }
  async rueckwaerts(tempo = 1.35) {
    for (const s of this.schritte.reverse()) {
      s.vorRueckweg?.();
      await Promise.all(s.animationen.map((a) => {
        a.playbackRate = -tempo;
        a.play();
        return a.finished;
      }));
      s.animationen.forEach((a) => a.cancel());
    }
  }
}

export function starteKalender({ haus, inhalte, testmodus, simulierterTag, welt, himmel, ebene, reduziert, festeVariante = null }) {
  const offen = new Set(speicher.get('offen', []));
  let beschaeftigt = false;

  const richtung = (nr) => RICHTUNGEN[(nr - 1) % 3];

  // --- Datum ------------------------------------------------------------------
  function heute() {
    const d = simulierterTag || new Date();
    const j = d.getFullYear(), m = d.getMonth(), t = d.getDate();
    if (j < JAHR || (j === JAHR && m < 11)) return { vorDezember: true, tag: 0 };
    if (j > JAHR || t > 24) return { vorDezember: false, tag: 24 };
    return { vorDezember: false, tag: t };
  }
  const darfOeffnen = (nr) => testmodus || heute().tag >= nr;
  function hinweisText(nr) {
    const h = heute();
    if (h.vorDezember) return "Ab dem 1. Dezember geht's los";
    const rest = nr - h.tag;
    return rest === 1 ? 'Morgen ist es so weit!' : `Noch ${rest} Tage!`;
  }

  // --- Türblatt und Nische ------------------------------------------------------
  function bauTuerblatt(nr) {
    const { tuer } = haus.elemente.get(nr);
    if (tuer.querySelector('.blatt')) return tuer;
    const t = TUEREN.find((x) => x.nr === nr);
    const p = inOriginalPixel(t);
    const A = HAUSBILD.ausschnitt;

    const nische = el('div', 'nische');
    nische.append(el('span', 'nische-licht'), el('span', 'nische-zahl', String(nr)));

    const blatt = el('div', 'blatt');
    blatt.dataset.richtung = richtung(nr);
    const vorne = el('div', 'blatt-vorne');
    const bild = el('div', 'blatt-bild');
    // Ausschnitt des Hausbilds genau an der Stelle des Türchens
    Object.assign(bild.style, {
      left: `${(-(p.x - A.x) / p.w) * 100}%`,
      top: `${(-(p.y - A.y) / p.h) * 100}%`,
      width: `${(A.breite / p.w) * 100}%`,
      height: `${(A.hoehe / p.h) * 100}%`,
    });
    vorne.append(bild);
    blatt.append(vorne, el('div', 'blatt-hinten'));
    tuer.prepend(nische, blatt);
    return tuer;
  }

  for (const nr of offen) bauTuerblatt(nr).classList.add('offen');

  // --- Zu früh: Wackeln und Hinweis ----------------------------------------------
  function wackeln(nr) {
    const tuer = bauTuerblatt(nr);
    const blatt = tuer.querySelector('.blatt');
    blatt.animate(
      [
        { transform: 'rotate(0) translateX(0)' },
        { transform: 'rotate(-6deg) translateX(-1px)' },
        { transform: 'rotate(5deg) translateX(1px)' },
        { transform: 'rotate(-3.5deg)' },
        { transform: 'rotate(2deg)' },
        { transform: 'rotate(0) translateX(0)' },
      ],
      { duration: reduziert ? 1 : 650, easing: 'ease-in-out' },
    );
  }

  function hinweis(nr, text) {
    const { tuer } = haus.elemente.get(nr);
    haus.element.querySelectorAll('.hinweis').forEach((h) => h.remove());
    const h = el('div', 'hinweis', text);
    h.setAttribute('role', 'status');
    const t = tuer.getBoundingClientRect(), hr = haus.element.getBoundingClientRect();
    h.style.left = `${((t.left + t.width / 2 - hr.left) / hr.width) * 100}%`;
    h.style.top = `${((t.top - hr.top) / hr.height) * 100}%`;
    haus.element.append(h);
    // Nicht über den Bildschirmrand hinausragen. offsetWidth statt getBoundingClientRect,
    // weil die Blase beim Aufpoppen noch verkleinert ist. Der Pfeil zeigt weiter aufs Türchen.
    const mitte = t.left + t.width / 2, halb = h.offsetWidth / 2, rand = 8;
    let versatz = 0;
    if (mitte - halb < rand) versatz = rand - (mitte - halb);
    else if (mitte + halb > innerWidth - rand) versatz = innerWidth - rand - (mitte + halb);
    if (versatz) {
      h.style.marginLeft = `${versatz}px`;
      h.style.setProperty('--pfeil', `calc(50% - ${versatz}px)`);
    }
    setTimeout(() => h.classList.add('weg'), 2000);
    setTimeout(() => h.remove(), 2500);
  }

  // --- Öffnen ---------------------------------------------------------------------
  async function aufklappen(nr) {
    const tuer = bauTuerblatt(nr);
    const blatt = tuer.querySelector('.blatt');
    const licht = tuer.querySelector('.nische-licht');
    gloeckchen();
    if (reduziert) {
      tuer.classList.add('offen');
      await licht.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 }).finished;
      return;
    }
    const r = richtung(nr);
    const a = blatt.animate(
      [{ transform: 'none' }, { transform: WEITER[r], offset: 0.82 }, { transform: OFFEN[r] }],
      { duration: 1250, easing: 'cubic-bezier(.33,.7,.25,1)', fill: 'forwards' },
    );
    const l = licht.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, delay: 150, easing: 'ease-out', fill: 'forwards' });
    await a.finished;
    tuer.classList.add('offen');
    a.cancel();
    l.cancel();
  }

  // --- Variante 1: Flug durchs Türchen ----------------------------------------------
  async function flug(nr, karte) {
    const { tuer } = haus.elemente.get(nr);
    const r = tuer.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const groesse = Math.max(r.width, r.height);
    const zoom = Math.min(9, (Math.max(innerWidth, innerHeight) / groesse) * 0.85);
    const kreisZoom = (Math.hypot(innerWidth, innerHeight) * 2.4) / groesse;

    const huelle = el('div', 'vorhang vorhang--flug');
    const kreis = el('div', 'lichtkreis');
    Object.assign(kreis.style, { left: `${cx}px`, top: `${cy}px`, width: `${groesse}px`, height: `${groesse}px` });
    const grund = el('div', 'lichtgrund');
    grund.style.setProperty('--x', `${cx}px`);
    grund.style.setProperty('--y', `${cy}px`);
    const buehne = el('div', 'karten-buehne');
    buehne.append(karte);
    karte.style.opacity = '0';
    huelle.append(kreis, grund, buehne);
    ebene.append(huelle);

    welt.style.transformOrigin = `${cx}px ${cy}px`;
    welt.style.willChange = 'transform';
    const ablauf = new Ablauf();
    await ablauf.schritt(
      () => [
        animiere(welt, [{ transform: 'scale(1)' }, { transform: `scale(${zoom})` }], { duration: 1450, easing: 'cubic-bezier(.5,.02,.75,.45)' }),
        animiere(kreis, [
          { transform: 'translate(-50%, -50%) scale(.7)', opacity: 0 },
          { opacity: 1, offset: 0.3 },
          { transform: `translate(-50%, -50%) scale(${kreisZoom})`, opacity: 1 },
        ], { duration: 1450, easing: 'cubic-bezier(.55,0,.8,.35)' }),
        animiere(grund, [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: 1450, easing: 'ease-in' }),
      ],
      () => { welt.style.visibility = ''; },
    );
    welt.style.visibility = 'hidden'; // das Licht deckt alles ab – spart Rechenzeit
    await ablauf.schritt(() =>
      animiere(karte, [
        { transform: 'perspective(1100px) rotateX(-86deg) scale(.86)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'perspective(1100px) rotateX(0deg) scale(1)', opacity: 1 },
      ], { duration: 1000, easing: 'cubic-bezier(.2,.8,.25,1)' }),
    );
    return { ablauf, huelle };
  }

  // --- Variante 2: Brief -----------------------------------------------------------
  async function brief(nr, karte) {
    const { tuer } = haus.elemente.get(nr);
    const r = tuer.getBoundingClientRect();

    const huelle = el('div', 'vorhang vorhang--brief');
    const dunkel = el('div', 'abdunkler');
    const umschlag = el('div', 'umschlag');
    umschlag.innerHTML = `
      <div class="umschlag-rueck"></div>
      <div class="umschlag-schacht"><div class="umschlag-papier"><span></span><span></span><span></span></div></div>
      <svg class="umschlag-vorne" viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 6 L50 38 L100 6 L100 64 L0 64 Z" fill="#f3e2c2"/>
        <path d="M0 64 L42 33 M100 64 L58 33" stroke="#c9a77a" stroke-width=".8" vector-effect="non-scaling-stroke"/>
        <path d="M0 6 L50 38 L100 6" fill="none" stroke="#b8936a" stroke-width="1" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="umschlag-lasche"><div class="umschlag-siegel"></div></div>`;
    const buehne = el('div', 'karten-buehne');
    buehne.append(karte);
    karte.style.opacity = '0';
    huelle.append(dunkel, umschlag, buehne);
    ebene.append(huelle);

    const u = umschlag.getBoundingClientRect();
    const dx = r.left + r.width / 2 - (u.left + u.width / 2);
    const dy = r.top + r.height / 2 - (u.top + u.height / 2);
    const s0 = Math.max(0.1, r.width / u.width);
    const lasche = umschlag.querySelector('.umschlag-lasche');
    const papier = umschlag.querySelector('.umschlag-papier');

    const ablauf = new Ablauf();
    // 1. Umschlag fliegt aus dem Türchen in die Mitte
    await ablauf.schritt(() => [
      animiere(dunkel, [{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: 'ease-out' }),
      animiere(umschlag, [
        { transform: `translate(${dx}px, ${dy}px) scale(${s0}) rotate(-14deg)`, opacity: 0 },
        { opacity: 1, offset: 0.15 },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 80}px) scale(${(s0 + 1) * 0.45}) rotate(7deg)`, opacity: 1, offset: 0.58 },
        { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      ], { duration: 1400, easing: 'cubic-bezier(.42,.05,.3,1)' }),
    ]);
    // 2. Lasche öffnet sich (in zwei Hälften, damit sie danach hinter dem Brief liegt)
    await ablauf.schritt(
      () => animiere(lasche, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(90deg)' }], { duration: 380, easing: 'ease-in' }),
      () => lasche.classList.remove('offen'),
    );
    lasche.classList.add('offen');
    await ablauf.schritt(() =>
      animiere(lasche, [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(180deg)' }], { duration: 420, easing: 'ease-out' }),
    );
    // 3. Der Brief gleitet heraus
    const ph = papier.offsetHeight;
    await ablauf.schritt(() =>
      animiere(papier, [{ transform: 'translateY(0)' }, { transform: `translateY(${-ph * 0.66}px)` }], { duration: 950, easing: 'cubic-bezier(.3,.7,.3,1)' }),
    );
    // 4. Aus dem Brief wird die Karte, der Umschlag sinkt nach unten weg
    const pr = papier.getBoundingClientRect(), kr = karte.getBoundingClientRect();
    const fx = pr.left + pr.width / 2 - (kr.left + kr.width / 2);
    const fy = pr.top + pr.height / 2 - (kr.top + kr.height / 2);
    await ablauf.schritt(() => [
      animiere(karte, [
        { transform: `translate(${fx}px, ${fy}px) scale(${pr.width / kr.width}, ${pr.height / kr.height})`, opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { transform: 'translate(0, 0) scale(1, 1)', opacity: 1 },
      ], { duration: 950, easing: 'cubic-bezier(.3,.7,.2,1)' }),
      animiere(papier, [{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], { duration: 950 }),
      animiere(umschlag, [
        { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: 'translate(0, 42vh) scale(.92) rotate(5deg)', opacity: 0 },
      ], { duration: 950, easing: 'cubic-bezier(.5,0,.75,.4)' }),
    ]);
    return { ablauf, huelle };
  }

  // --- Variante bei „weniger Bewegung“: sanftes Einblenden ---------------------------
  async function sanft(_nr, karte) {
    const huelle = el('div', 'vorhang vorhang--brief');
    const dunkel = el('div', 'abdunkler');
    const buehne = el('div', 'karten-buehne');
    buehne.append(karte);
    huelle.append(dunkel, buehne);
    ebene.append(huelle);
    const ablauf = new Ablauf();
    await ablauf.schritt(() => [
      animiere(dunkel, [{ opacity: 0 }, { opacity: 1 }], { duration: 350 }),
      animiere(karte, [{ opacity: 0 }, { opacity: 1 }], { duration: 350 }),
    ]);
    return { ablauf, huelle };
  }

  // --- Inhalt zeigen und wieder schließen --------------------------------------------
  async function zeigeInhalt(nr) {
    const karte = baueKarte(nr, inhalte[nr - 1]);
    document.body.classList.add('karte-offen');
    const zufaellig = Math.random() < 0.5 ? flug : brief;
    const variante = reduziert ? sanft : festeVariante === 'flug' ? flug : festeVariante === 'brief' ? brief : zufaellig;
    const ansicht = await variante(nr, karte);
    himmel.pause(true);
    karte.querySelector('.karte-zu').focus({ preventScroll: true });

    let schliesst = false;
    const schliessen = async () => {
      if (schliesst) return;
      schliesst = true;
      document.removeEventListener('keydown', taste);
      himmel.pause(false);
      welt.style.visibility = '';
      await ansicht.ablauf.rueckwaerts();
      ansicht.huelle.remove();
      welt.style.transformOrigin = '';
      welt.style.willChange = '';
      document.body.classList.remove('karte-offen');
      haus.elemente.get(nr).knopf.focus({ preventScroll: true });
      beschaeftigt = false;
    };
    const taste = (e) => { if (e.key === 'Escape') schliessen(); };
    document.addEventListener('keydown', taste);
    karte.querySelector('.karte-zu').addEventListener('click', schliessen);
    ansicht.huelle.addEventListener('click', (e) => { if (!e.target.closest('.karte')) schliessen(); });
  }

  // --- Antippen ----------------------------------------------------------------------
  async function tippen(nr) {
    if (beschaeftigt) return;
    if (!darfOeffnen(nr)) {
      wackeln(nr);
      hinweis(nr, hinweisText(nr));
      return;
    }
    beschaeftigt = true;
    try {
      if (!offen.has(nr)) {
        await aufklappen(nr);
        offen.add(nr);
        speicher.set('offen', [...offen].sort((a, b) => a - b));
      }
      await zeigeInhalt(nr);
    } catch (fehler) {
      console.error(fehler);
      beschaeftigt = false;
    }
  }

  return { tippen };
}
