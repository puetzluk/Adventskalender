/*
 * Speichert den Zustand im Browser (localStorage):
 * geöffnete Türchen, Codewort ok, Lichterkette an/aus, Musik an/aus.
 * Alle Zugriffe sind abgesichert – im privaten Modus funktioniert die Seite trotzdem.
 */
const SCHLUESSEL = 'adventskalender-2026';

function lesen() {
  try {
    return JSON.parse(localStorage.getItem(SCHLUESSEL)) || {};
  } catch {
    return {};
  }
}

let stand = lesen();

export const speicher = {
  get(name, standard) {
    return name in stand ? stand[name] : standard;
  },
  set(name, wert) {
    stand[name] = wert;
    try {
      localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
    } catch {
      /* Speichern nicht möglich (z. B. privater Modus) – dann eben nur für diesen Besuch */
    }
  },
  allesLoeschen() {
    stand = {};
    try {
      localStorage.removeItem(SCHLUESSEL);
    } catch {
      /* egal */
    }
  },
};
