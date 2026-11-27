/*
 * ============================================================
 *  Türchen-Positionen – die EINE Stelle, an der sie stehen
 * ============================================================
 * Alle Angaben in Prozent des ORIGINALBILDS (werkzeuge/haus-original.webp, 768 × 1376 px):
 *   links, oben   = linke obere Ecke des Türchens
 *   breite, hoehe = Größe des Türchens
 *   form          = 'rechteck' oder 'kreis'
 *
 * Prüfen und nachjustieren: Seite mit „?debug“ am Ende der Adresse öffnen,
 * z. B. http://localhost:8080/?debug – dort lassen sich die Rahmen verschieben
 * und die neuen Werte per Knopf kopieren und hier einfügen.
 */

// Das freigestellte Hausbild und welchen Ausschnitt des Originals es zeigt
export const HAUSBILD = {
  datei: 'bilder/haus.webp',
  originalBreite: 768,
  originalHoehe: 1376,
  // Ausschnitt in Pixeln des Originals (wird von werkzeuge/haus-freistellen.js ausgegeben)
  ausschnitt: { x: 72, y: 215, breite: 627, hoehe: 893 },
};

// Tippflächen sind mindestens so groß (in CSS-Pixeln auf dem Bildschirm).
// Kleine Türchen (z. B. die 4) bekommen automatisch eine größere, unsichtbare Tippfläche,
// die nie in ein Nachbartürchen hineinragt.
export const MIN_TIPPFLAECHE_PX = 44;

export const TUEREN = [
  { nr: 1,  form: 'kreis',    links: 55.9, oben: 50.7, breite: 9.8,  hoehe: 5.5 },
  { nr: 2,  form: 'rechteck', links: 23.0, oben: 50.9, breite: 9.6,  hoehe: 5.6 },
  { nr: 3,  form: 'rechteck', links: 23.6, oben: 43.6, breite: 9.0,  hoehe: 5.7 },
  { nr: 4,  form: 'rechteck', links: 41.7, oben: 56.8, breite: 4.2,  hoehe: 3.3 },
  { nr: 5,  form: 'kreis',    links: 24.2, oben: 28.3, breite: 8.2,  hoehe: 4.5 },
  { nr: 6,  form: 'rechteck', links: 68.4, oben: 58.3, breite: 8.6,  hoehe: 5.1 },
  { nr: 7,  form: 'rechteck', links: 34.1, oben: 35.0, breite: 8.9,  hoehe: 5.1 },
  { nr: 8,  form: 'kreis',    links: 33.5, oben: 68.2, breite: 9.0,  hoehe: 5.0 },
  { nr: 9,  form: 'kreis',    links: 67.4, oben: 43.7, breite: 9.6,  hoehe: 5.3 },
  { nr: 10, form: 'kreis',    links: 57.2, oben: 57.6, breite: 9.1,  hoehe: 5.2 },
  { nr: 11, form: 'rechteck', links: 34.6, oben: 50.9, breite: 8.9,  hoehe: 5.2 },
  { nr: 12, form: 'kreis',    links: 57.6, oben: 35.0, breite: 9.2,  hoehe: 5.2 },
  { nr: 13, form: 'rechteck', links: 23.3, oben: 68.1, breite: 8.9,  hoehe: 5.3 },
  { nr: 14, form: 'rechteck', links: 46.2, oben: 27.2, breite: 8.5,  hoehe: 4.9 },
  { nr: 15, form: 'kreis',    links: 57.6, oben: 68.8, breite: 8.9,  hoehe: 4.9 },
  { nr: 16, form: 'kreis',    links: 46.0, oben: 44.0, breite: 9.0,  hoehe: 4.9 },
  { nr: 17, form: 'rechteck', links: 67.4, oben: 51.0, breite: 9.5,  hoehe: 5.5 },
  { nr: 18, form: 'rechteck', links: 44.9, oben: 32.5, breite: 10.4, hoehe: 7.3 }, // Kranzfenster
  { nr: 19, form: 'kreis',    links: 67.7, oben: 28.3, breite: 8.5,  hoehe: 4.7 },
  { nr: 20, form: 'rechteck', links: 68.0, oben: 68.1, breite: 9.2,  hoehe: 5.7 },
  { nr: 21, form: 'rechteck', links: 45.3, oben: 50.8, breite: 8.5,  hoehe: 5.3 },
  { nr: 22, form: 'rechteck', links: 56.6, oben: 43.8, breite: 8.7,  hoehe: 5.5 },
  { nr: 23, form: 'rechteck', links: 46.1, oben: 69.2, breite: 7.9,  hoehe: 4.7 },
  { nr: 24, form: 'rechteck', links: 35.3, oben: 43.6, breite: 9.0,  hoehe: 5.7 },
];
