/*
 * Memes im Windows-Fenster
 * ------------------------
 * Wer ein noch gesperrtes Türchen antippt, bekommt ab und zu ein Meme in einem
 * Fenster im Windows-Stil, darunter der Countdown. Nur das rote ✕ schließt es –
 * Minimieren und Maximieren sind reine Deko.
 *
 * Quellen:
 *  - Bilder (und eigene Videodateien) aus bilder/memes/ (Liste entsteht beim Verpacken)
 *  - YouTube-Videos aus js/meme-videos.js (werden eingebettet, mit Ton)
 * Kein Meme wiederholt sich, bevor alle einmal dran waren (gilt auch über Besuche hinweg).
 */
import { speicher } from './speicher.js';
import { fehlerton } from './klang.js';

const el = (tag, klasse, text) => {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text != null) e.textContent = text;
  return e;
};

const mischen = (liste) => {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * @param {object} o
 * @param {string[]} o.bilder      Pfade aus bilder/memes/
 * @param {object[]} o.videos      YouTube-Einträge { id, titel, start, ende }
 * @param {boolean} o.reduziert    weniger Bewegung
 * @param {(laeuft:boolean)=>void} [o.beiVideo]  wird aufgerufen, wenn ein Video startet/endet (Musik pausieren)
 */
export function starteMemes({ bilder = [], videos = [], reduziert = false, beiVideo = () => {} }) {
  const alle = [
    ...bilder.map((pfad) => ({ schluessel: pfad, art: /\.(mp4|webm)$/i.test(pfad) ? 'datei-video' : 'bild', pfad })),
    ...videos.filter((v) => v && v.id).map((v) => ({ schluessel: `yt:${v.id}`, art: 'youtube', ...v })),
  ];

  // Reihenfolge: gemischt, gesehene zuerst überspringen
  function naechstes() {
    if (!alle.length) return null;
    const gesehen = new Set(speicher.get('memes-gesehen', []));
    let uebrig = alle.filter((m) => !gesehen.has(m.schluessel));
    if (!uebrig.length) {
      gesehen.clear();
      uebrig = alle;
    }
    const meme = mischen(uebrig)[0];
    gesehen.add(meme.schluessel);
    speicher.set('memes-gesehen', [...gesehen]);
    return meme;
  }

  function medium(meme) {
    const huelle = el('div', `meme-medium meme-medium--${meme.art}`);
    if (meme.art === 'bild') {
      const img = el('img');
      img.src = meme.pfad;
      img.alt = 'Meme';
      img.decoding = 'async';
      huelle.append(img);
    } else if (meme.art === 'datei-video') {
      const v = el('video');
      Object.assign(v, { src: meme.pfad, autoplay: true, loop: true, playsInline: true, controls: true });
      huelle.append(v);
      v.play().catch(() => {}); // klappt nach dem Antippen meist mit Ton; sonst Play-Knopf im Video
    } else {
      const p = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', modestbranding: '1' });
      if (meme.start) p.set('start', String(meme.start));
      if (meme.ende) p.set('end', String(meme.ende));
      const f = el('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(meme.id)}?${p}`;
      f.title = meme.titel || 'Video-Meme';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      // Die Seite schickt sonst keinen Referrer mit – YouTube-Einbettungen brauchen ihn aber
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      huelle.append(f);
    }
    return huelle;
  }

  /** Meme zeigen; das Promise endet, wenn das Fenster per ✕ geschlossen wurde */
  function zeigen({ nr, text }) {
    const meme = naechstes();
    if (!meme) return Promise.resolve(false);
    const istVideo = meme.art !== 'bild';

    const ebene = el('div', 'meme-ebene');
    const fenster = el('div', 'meme-fenster');
    fenster.setAttribute('role', 'alertdialog');
    fenster.setAttribute('aria-modal', 'true');
    fenster.setAttribute('aria-label', text);

    const leiste = el('div', 'meme-titelleiste');
    const symbol = el('span', 'meme-symbol');
    symbol.setAttribute('aria-hidden', 'true');
    const titel = el('span', 'meme-titel', `tuerchen${nr}.exe – Zugriff verweigert`);
    // Minimieren/Maximieren: nur Deko, machen absichtlich nichts
    const minimieren = el('span', 'meme-knopf meme-knopf--min');
    const maximieren = el('span', 'meme-knopf meme-knopf--max');
    for (const k of [minimieren, maximieren]) k.setAttribute('aria-hidden', 'true');
    const zu = el('button', 'meme-knopf meme-knopf--zu');
    zu.type = 'button';
    zu.setAttribute('aria-label', 'Schließen');
    zu.innerHTML = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1 9 9M9 1 1 9" stroke="currentColor" stroke-width="1.3"/></svg>';
    leiste.append(symbol, titel, minimieren, maximieren, zu);

    const inhalt = el('div', 'meme-inhalt');
    inhalt.append(medium(meme), el('p', 'meme-text', text));
    fenster.append(leiste, inhalt);
    ebene.append(fenster);
    document.body.append(ebene);
    document.body.classList.add('meme-offen');

    fehlerton();
    if (istVideo) beiVideo(true);
    fenster.animate(
      [{ opacity: 0, transform: 'scale(.82)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: reduziert ? 1 : 170, easing: 'cubic-bezier(.2,.9,.3,1.2)' },
    );
    zu.focus({ preventScroll: true });

    return new Promise((fertig) => {
      zu.addEventListener('click', async () => {
        zu.disabled = true;
        // Video sofort stumm schalten, dann ausblenden
        inhalt.querySelector('iframe')?.remove();
        inhalt.querySelector('video')?.pause();
        await fenster.animate(
          [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)' }],
          { duration: reduziert ? 1 : 130, easing: 'ease-in', fill: 'forwards' },
        ).finished;
        ebene.remove();
        document.body.classList.remove('meme-offen');
        if (istVideo) beiVideo(false);
        fertig(true);
      }, { once: true });
    });
  }

  return { get anzahl() { return alle.length; }, zeigen };
}
