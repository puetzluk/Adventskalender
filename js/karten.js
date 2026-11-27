/*
 * Inhaltskarten – jede Inhaltsart hat ihre eigene Gestaltung:
 *   spruch    → Text in Handschrift auf Papier
 *   foto      → Polaroid-Rahmen mit Bildunterschrift
 *   gutschein → Ticket mit gestricheltem Rand, Titel und Text
 *   raetsel   → nur der Rätseltext
 *   post      → „Heute kommt etwas per Post“ mit Umschlag-Symbol und eigenem Text
 */

const el = (tag, klasse, text) => {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text != null) e.textContent = text; // textContent: nie HTML aus den Inhalten ausführen
  return e;
};

const ZWEIG = `<svg class="karte-zweig" viewBox="0 0 120 28" aria-hidden="true">
  <path d="M8 18 C30 10 60 8 112 14" fill="none" stroke="#6b4630" stroke-width="1.6" stroke-linecap="round"/>
  <g fill="#3f7d5b" stroke="#2b5c44" stroke-width=".6">
    <path d="M24 14 l-6 -8 l9 4 Z"/><path d="M36 12 l-3 -9 l8 6 Z"/><path d="M50 11 l-2 -9 l7 7 Z"/><path d="M66 11 l0 -9 l6 8 Z"/><path d="M82 12 l2 -8 l4 9 Z"/>
    <path d="M30 15 l-5 8 l9 -4 Z"/><path d="M45 13 l-2 9 l7 -6 Z"/><path d="M60 12 l0 9 l6 -7 Z"/><path d="M76 12 l2 9 l4 -8 Z"/><path d="M92 13 l4 8 l2 -9 Z"/>
  </g>
  <circle cx="100" cy="17" r="3.4" fill="#c8463a" stroke="#7a1f16" stroke-width=".8"/><circle cx="106" cy="14" r="3" fill="#c8463a" stroke="#7a1f16" stroke-width=".8"/>
</svg>`;

const UMSCHLAG_SYMBOL = `<svg class="post-symbol" viewBox="0 0 120 84" aria-hidden="true">
  <rect x="6" y="8" width="108" height="70" rx="6" fill="#fbf1dc" stroke="#5a3322" stroke-width="2.4"/>
  <path d="M8 12 L60 50 L112 12" fill="none" stroke="#5a3322" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M8 76 L46 42 M112 76 L74 42" stroke="#5a3322" stroke-width="1.6" opacity=".5"/>
  <rect x="88" y="16" width="18" height="22" rx="1.5" fill="#c8463a" stroke="#7a1f16" stroke-width="1.2" stroke-dasharray="2 1.5"/>
  <path d="M97 22 l2.2 4.4 4.8 .7 -3.5 3.3 .8 4.8 -4.3 -2.3 -4.3 2.3 .8 -4.8 -3.5 -3.3 4.8 -.7 Z" fill="#ffd65a"/>
  <circle cx="60" cy="50" r="8" fill="#c8463a" stroke="#7a1f16" stroke-width="1.4"/>
  <path d="M56.5 50 h7 M60 46.5 v7" stroke="#f6e7c8" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

/**
 * @param {number} nr Tag
 * @param {{typ:string, text?:string, titel?:string, bild?:string}} eintrag
 */
export function baueKarte(nr, eintrag = {}) {
  const typ = ['spruch', 'foto', 'gutschein', 'raetsel', 'post'].includes(eintrag.typ) ? eintrag.typ : 'spruch';
  const karte = el('div', `karte karte--${typ}`);
  karte.setAttribute('role', 'dialog');
  karte.setAttribute('aria-modal', 'true');
  karte.setAttribute('aria-label', `Türchen ${nr}`);
  karte.tabIndex = -1;

  const zu = el('button', 'karte-zu');
  zu.type = 'button';
  zu.setAttribute('aria-label', 'Schließen');
  zu.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  const inhalt = el('div', 'karte-inhalt');
  inhalt.append(el('p', 'karte-datum', `${nr}. Dezember`));
  const text = eintrag.text || '';

  switch (typ) {
    case 'spruch': {
      inhalt.append(el('p', 'karte-text handschrift', text));
      inhalt.insertAdjacentHTML('beforeend', ZWEIG);
      break;
    }
    case 'foto': {
      const rahmen = el('figure', 'polaroid');
      const klebe = el('span', 'polaroid-klebe');
      const bildBox = el('div', 'polaroid-bild');
      if (eintrag.bild) {
        const img = el('img');
        img.src = eintrag.bild;
        img.alt = text || 'Foto';
        img.decoding = 'async';
        img.addEventListener('error', () => bildBox.classList.add('fehlt'));
        bildBox.append(img);
      } else {
        bildBox.classList.add('fehlt');
      }
      rahmen.append(klebe, bildBox, el('figcaption', 'handschrift', text));
      inhalt.append(rahmen);
      break;
    }
    case 'gutschein': {
      const ticket = el('div', 'ticket');
      ticket.append(
        el('p', 'ticket-marke', 'Gutschein'),
        el('h2', 'ticket-titel', eintrag.titel || 'Für dich'),
        el('p', 'ticket-text', text),
        el('p', 'ticket-fuss', '★  jederzeit einlösbar  ★'),
      );
      inhalt.append(ticket);
      break;
    }
    case 'raetsel': {
      inhalt.append(el('p', 'karte-ueberschrift', 'Rätsel'), el('p', 'karte-text', text));
      break;
    }
    case 'post': {
      inhalt.insertAdjacentHTML('beforeend', UMSCHLAG_SYMBOL);
      inhalt.append(el('h2', 'karte-ueberschrift', 'Heute kommt etwas per Post'));
      if (text) inhalt.append(el('p', 'karte-text handschrift', text));
      break;
    }
  }

  karte.append(zu, inhalt);
  return karte;
}
