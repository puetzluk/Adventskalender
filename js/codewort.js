/*
 * Codewort-Bildschirm beim ersten Aufruf.
 * Das Codewort steht NICHT im Klartext im Code – verglichen wird nur sein SHA-256-Hash.
 * Eigene Zifferntastatur (auf dem Handy erscheint keine Systemtastatur), am PC geht auch die Tastatur.
 */
import { sha256Hex } from './sha256.js';

const SALZ = 'adventskalender-2026:';
// SHA-256 von SALZ + Codewort
const CODEWORT_HASH = '0ac9b7f5042d88ba375fb0a147b28bac12374dd10773bec14cea140f2f743601';

export async function istCodewort(eingabe) {
  return (await sha256Hex(SALZ + String(eingabe ?? '').trim())) === CODEWORT_HASH;
}

/** Zeigt den Codewort-Bildschirm. Das Versprechen erfüllt sich, sobald das Codewort stimmt. */
export function zeigeCodewort({ reduziert = false } = {}) {
  return new Promise((fertig) => {
    const huelle = document.createElement('div');
    huelle.className = 'codewort';
    huelle.innerHTML = `
      <div class="codewort-schild" role="dialog" aria-modal="true" aria-labelledby="codewort-titel">
        <svg class="codewort-kranz" viewBox="0 0 120 64" aria-hidden="true">
          <path d="M14 40 C30 54 90 54 106 40" fill="none" stroke="#2f6b4f" stroke-width="9" stroke-linecap="round"/>
          <path d="M14 40 C30 54 90 54 106 40" fill="none" stroke="#4b8a63" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 5"/>
          <g fill="#c8463a" stroke="#7a1f16" stroke-width=".8"><circle cx="30" cy="47" r="3"/><circle cx="60" cy="51" r="3.2"/><circle cx="90" cy="47" r="3"/></g>
          <path d="M60 8 l4.6 9.4 10.4 1.5 -7.5 7.3 1.8 10.3 -9.3 -4.9 -9.3 4.9 1.8 -10.3 -7.5 -7.3 10.4 -1.5 Z" fill="#ffd65a" stroke="#9a6a24" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
        <h2 id="codewort-titel" class="codewort-titel">Psst … ein Geheimnis!</h2>
        <p class="codewort-text">Bitte gib das Codewort ein.</p>
        <div class="codewort-punkte" aria-live="polite"></div>
        <div class="codewort-tasten">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => `<button type="button" data-ziffer="${z}">${z}</button>`).join('')}
          <button type="button" data-aktion="loeschen" aria-label="Letzte Ziffer löschen">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6 H20 V18 H9 L3 12 Z M12 9.5 L16.5 14.5 M16.5 9.5 L12 14.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>
          </button>
          <button type="button" data-ziffer="0">0</button>
          <button type="button" data-aktion="ok" class="taste-ok" aria-label="Bestätigen">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 L10 17 L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>`;
    document.body.append(huelle);

    const schild = huelle.querySelector('.codewort-schild');
    const punkte = huelle.querySelector('.codewort-punkte');
    let eingabe = '';
    let pruefe = false;

    function zeigen() {
      punkte.innerHTML = '';
      for (let i = 0; i < Math.max(4, eingabe.length); i++) {
        const p = document.createElement('span');
        if (i < eingabe.length) p.className = 'voll';
        punkte.append(p);
      }
      punkte.setAttribute('aria-label', `${eingabe.length} Ziffern eingegeben`);
    }

    async function bestaetigen() {
      if (pruefe || !eingabe) return;
      pruefe = true;
      if (await istCodewort(eingabe)) {
        punkte.classList.add('richtig');
        huelle.classList.add('geschafft');
        setTimeout(() => {
          huelle.remove();
          document.removeEventListener('keydown', taste);
          fertig();
        }, reduziert ? 250 : 900);
        return;
      }
      // falsch: sanftes Wackeln, dann neu
      punkte.classList.add('falsch');
      navigator.vibrate?.(60);
      schild.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }],
        { duration: reduziert ? 1 : 520, easing: 'ease-in-out' },
      );
      setTimeout(() => {
        eingabe = '';
        punkte.classList.remove('falsch');
        zeigen();
        pruefe = false;
      }, 650);
    }

    function ziffer(z) {
      if (pruefe || eingabe.length >= 8) return;
      eingabe += z;
      zeigen();
    }
    function loeschen() {
      if (pruefe) return;
      eingabe = eingabe.slice(0, -1);
      zeigen();
    }

    huelle.addEventListener('click', (e) => {
      const knopf = e.target.closest('button');
      if (!knopf) return;
      if (knopf.dataset.ziffer) ziffer(knopf.dataset.ziffer);
      else if (knopf.dataset.aktion === 'loeschen') loeschen();
      else if (knopf.dataset.aktion === 'ok') bestaetigen();
    });
    const taste = (e) => {
      if (/^[0-9]$/.test(e.key)) ziffer(e.key);
      else if (e.key === 'Backspace') { e.preventDefault(); loeschen(); }
      else if (e.key === 'Enter') { e.preventDefault(); bestaetigen(); } // sonst „klickt“ Enter auch den fokussierten Knopf
    };
    document.addEventListener('keydown', taste);
    zeigen();
    huelle.querySelector('[data-ziffer="1"]').focus({ preventScroll: true });
  });
}
