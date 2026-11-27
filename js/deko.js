/*
 * Zeichnungen der Szene als SVG (Mond, Tannen, Rentiere, Schlitten, Schneeboden).
 * Stil: weich, Kinderbuch, braune statt schwarze Konturen.
 */

let zaehler = 0;
const neueId = (name) => `${name}-${++zaehler}`;

/** Macht aus SVG-Text ein DOM-Element */
export function alsElement(text) {
  const vorlage = document.createElement('template');
  vorlage.innerHTML = text.trim();
  return vorlage.content.firstElementChild;
}

const KONTUR = '#5a3322';
const LICHTFARBEN = ['#ffd261', '#ff6f61', '#86d4ff', '#ff9fd2', '#a5ea86'];

// ---------------------------------------------------------------------------
// Mond
// ---------------------------------------------------------------------------
export function mondSvg() {
  const id = neueId('mond');
  return `<svg class="mond" viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <radialGradient id="${id}-schein"><stop offset="0" stop-color="#fff3c8" stop-opacity=".5"/><stop offset=".42" stop-color="#ffe7a8" stop-opacity=".16"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-scheibe" cx=".38" cy=".36" r=".72"><stop offset="0" stop-color="#fffbea"/><stop offset=".68" stop-color="#f7e6ba"/><stop offset="1" stop-color="#e6cd94"/></radialGradient>
  </defs>
  <circle class="mond-schein" cx="60" cy="60" r="59" fill="url(#${id}-schein)"/>
  <circle cx="60" cy="60" r="25" fill="url(#${id}-scheibe)" stroke="#c7a66b" stroke-width="1.1"/>
  <g fill="#e4cb92" opacity=".6"><circle cx="52" cy="53" r="4.6"/><circle cx="67" cy="66" r="3.4"/><circle cx="64" cy="49" r="2"/><circle cx="53" cy="69" r="2.4"/></g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Tannenbaum (viewBox 120 × 160), optional mit Lichterkette und Stern
// ---------------------------------------------------------------------------
const STUFEN = [
  { o: 12, u: 58, b: 24 },
  { o: 34, u: 96, b: 36 },
  { o: 62, u: 136, b: 48 },
];

function stufePfad({ o, u, b }) {
  const m = 60, h = u - o, n = 4;
  let d = `M ${m} ${o} Q ${m + b * 0.36} ${o + h * 0.56} ${m + b} ${u}`;
  for (let i = 1; i <= n; i++) {
    const x0 = m + b - ((2 * b) / n) * (i - 1), x1 = m + b - ((2 * b) / n) * i;
    d += ` Q ${(x0 + x1) / 2} ${u + 7} ${x1} ${u}`;
  }
  return d + ` Q ${m - b * 0.36} ${o + h * 0.56} ${m} ${o} Z`;
}

function schneeAufStufe({ u, b }) {
  const m = 60, n = 4, bb = b * 0.84;
  let d = `M ${m + bb} ${u - 1}`;
  for (let i = 1; i <= n; i++) {
    const x0 = m + bb - ((2 * bb) / n) * (i - 1), x1 = m + bb - ((2 * bb) / n) * i;
    d += ` Q ${(x0 + x1) / 2} ${u + 5.5} ${x1} ${u - 1}`;
  }
  for (let i = 1; i <= n; i++) {
    const x0 = m - bb + ((2 * bb) / n) * (i - 1), x1 = m - bb + ((2 * bb) / n) * i;
    d += ` Q ${(x0 + x1) / 2} ${u - 10} ${x1} ${u - 1}`;
  }
  return d + ' Z';
}

const BAUM_LICHTER = [[52, 40], [67, 49], [45, 74], [60, 82], [75, 70], [64, 90], [41, 108], [56, 117], [72, 110], [86, 120], [33, 125], [62, 128]];

export function baumSvg({ lichter = false, stern = false, ton = 0 } = {}) {
  const id = neueId('baum');
  const [hell, dunkel] = [['#4b8a63', '#2b5c44'], ['#3f7d5b', '#245039'], ['#55916a', '#30624a']][ton % 3];
  let s = `<svg class="baum" viewBox="0 0 120 160" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hell}"/><stop offset="1" stop-color="${dunkel}"/></linearGradient>
    ${LICHTFARBEN.map((f, i) => `<radialGradient id="${id}-l${i}"><stop offset="0" stop-color="${f}" stop-opacity=".95"/><stop offset=".35" stop-color="${f}" stop-opacity=".45"/><stop offset="1" stop-color="${f}" stop-opacity="0"/></radialGradient>`).join('')}
  </defs>
  <ellipse cx="60" cy="152" rx="34" ry="5.5" fill="#dfe6f3" stroke="#9d93a3" stroke-width=".8" opacity=".9"/>
  <rect x="53.5" y="132" width="13" height="19" rx="2.5" fill="#7b4a2c" stroke="${KONTUR}" stroke-width="1.5"/>`;
  for (const st of [...STUFEN].reverse()) {
    s += `<path d="${stufePfad(st)}" fill="url(#${id}-g)" stroke="#3f2a1c" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += `<path d="${schneeAufStufe(st)}" fill="#f6f8fc" stroke="#978c99" stroke-width=".9" stroke-linejoin="round"/>`;
  }
  // Schneehaube auf der Spitze
  s += `<path d="M 60 12 Q 66 18 69 23 Q 64 21 60 23 Q 56 21 51 23 Q 54 18 60 12 Z" fill="#f6f8fc" stroke="#978c99" stroke-width=".9"/>`;
  if (lichter) {
    s += '<g class="baum-lichter">';
    BAUM_LICHTER.forEach(([x, y], i) => {
      const f = i % LICHTFARBEN.length;
      s += `<g class="baum-licht" style="--v:${(i * 0.37) % 2.6}s"><circle class="glanz" cx="${x}" cy="${y}" r="7" fill="url(#${id}-l${f})"/><circle cx="${x}" cy="${y}" r="2.2" fill="${LICHTFARBEN[f]}" stroke="${KONTUR}" stroke-width=".5"/></g>`;
    });
    s += '</g>';
  }
  if (stern) {
    s += `<g class="baum-stern"><circle cx="60" cy="10" r="10" fill="url(#${id}-l0)"/>
      <path d="M60 2.5 L62.3 7.6 L67.8 8.1 L63.6 11.7 L64.9 17.1 L60 14.3 L55.1 17.1 L56.4 11.7 L52.2 8.1 L57.7 7.6 Z" fill="#ffd65a" stroke="#9a6a24" stroke-width=".9" stroke-linejoin="round"/></g>`;
  }
  return s + '</svg>';
}

// ---------------------------------------------------------------------------
// Rentier (viewBox 130 × 108, schaut nach rechts)
// art: 'gross' | 'kalb';  nase: true = rot leuchtend;  schal: true = roter Schal
// ---------------------------------------------------------------------------
export function rentierSvg({ art = 'gross', nase = false, schal = false, glocke = false } = {}) {
  const id = neueId('rentier');
  const fell = art === 'kalb' ? '#c08a5a' : '#b2784b';
  const fellDunkel = art === 'kalb' ? '#9c6c45' : '#8c5a37';
  const geweih = art === 'kalb'
    ? `<path d="M101 19 C100 15 99 13 97 11 M106 18 C107 14 108 12 110 10" />`
    : `<path d="M101 19 C99 12 97 8 92 4 M98 11 C95 10 93 9 90 7 M95 7 C95 4 94 2 93 0.5 M106 18 C107 11 110 7 115 4 M108 11 C111 11 113 10 115 8 M112 6 C113 3 114 2 116 1" />`;
  const nasenTeil = nase
    ? `<circle class="nasenschein" cx="122" cy="31" r="11" fill="url(#${id}-schein)"/>
       <ellipse class="nase nase--rot" cx="122" cy="31" rx="3.6" ry="3.2" fill="url(#${id}-nase)" stroke="#7a1f16" stroke-width=".9"/>
       <ellipse cx="121" cy="29.8" rx="1.2" ry=".8" fill="#fff" opacity=".8"/>`
    : `<ellipse class="nase" cx="122" cy="31" rx="3.2" ry="2.8" fill="#4a2a1e" stroke="${KONTUR}" stroke-width=".8"/>
       <ellipse cx="121.2" cy="30" rx="1" ry=".6" fill="#fff" opacity=".5"/>`;
  const flecken = art === 'kalb'
    ? `<g fill="#f3e4c8" opacity=".85"><circle cx="46" cy="52" r="2"/><circle cx="56" cy="50" r="1.6"/><circle cx="66" cy="53" r="1.8"/><circle cx="51" cy="58" r="1.4"/><circle cx="74" cy="51" r="1.4"/></g>`
    : '';
  const schalTeil = schal
    ? `<path d="M85 47 C92 52 101 51 107 45 L108 52 C101 58 91 58 84 53 Z" fill="#c8463a" stroke="${KONTUR}" stroke-width="1.3" stroke-linejoin="round"/>
       <path d="M90 53 L85 67 L92 66 L95 54 Z" fill="#c8463a" stroke="${KONTUR}" stroke-width="1.3" stroke-linejoin="round"/>
       <path d="M88 50 L89 55 M94 51 L95 56 M100 50 L101 55 M88 61 L91 61" stroke="#f6e7c8" stroke-width="1.3" stroke-linecap="round"/>`
    : '';
  const glockeTeil = glocke
    ? `<path d="M86 50 C93 54 101 53 106 48" fill="none" stroke="#7a3b22" stroke-width="2.4" stroke-linecap="round"/>
       <circle cx="97" cy="55" r="3.4" fill="#f2c45a" stroke="#8a5a20" stroke-width=".9"/><circle cx="97" cy="56.6" r=".9" fill="#7a4a18"/>`
    : '';

  return `<svg class="rentier-svg" viewBox="0 0 130 108" aria-hidden="true">
  <defs>
    <radialGradient id="${id}-nase" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#ff8a74"/><stop offset=".55" stop-color="#e8382a"/><stop offset="1" stop-color="#a51f17"/></radialGradient>
    <radialGradient id="${id}-schein"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".75"/><stop offset=".45" stop-color="#ff5a3c" stop-opacity=".25"/><stop offset="1" stop-color="#ff5a3c" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-fell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fell}"/><stop offset="1" stop-color="${fellDunkel}"/></linearGradient>
  </defs>
  <ellipse cx="62" cy="103" rx="44" ry="4.5" fill="#8d9cc4" opacity=".35"/>
  <g class="rentier-koerper">
    <!-- hintere Beine (dunkler) -->
    <g fill="${fellDunkel}" stroke="${KONTUR}" stroke-width="1.4">
      <rect x="38" y="70" width="7" height="31" rx="3"/><rect x="86" y="70" width="7" height="31" rx="3"/>
    </g>
    <g fill="#4a2e20"><rect x="38" y="97" width="7" height="5" rx="1.5"/><rect x="86" y="97" width="7" height="5" rx="1.5"/></g>
    <!-- Schwanz -->
    <path d="M29 55 C22 51 20 46 24 44 C28 45 30 50 31 54 Z" fill="#f1e3c8" stroke="${KONTUR}" stroke-width="1.3"/>
    <!-- Hals -->
    <path d="M83 54 C85 43 90 35 96 29 L107 35 C103 43 99 53 95 63 Z" fill="url(#${id}-fell)" stroke="${KONTUR}" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M100 40 C98 48 96 55 94 61 L97 59 C100 52 103 45 105 38 Z" fill="#ecd6b2"/>
    <!-- Körper -->
    <path d="M28 64 C24 50 36 44 52 45 C66 46 78 44 88 47 C97 50 99 62 94 72 C90 79 76 81 60 81 C44 81 32 79 29 72 Z" fill="url(#${id}-fell)" stroke="${KONTUR}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M40 75 C50 80 70 80 86 74 C80 80 68 82 59 82 C49 82 43 80 40 75 Z" fill="#ead2ad"/>
    <path d="M40 48 C47 45 56 45 62 47" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>
    ${flecken}
    <!-- vordere Beine -->
    <g fill="${fell}" stroke="${KONTUR}" stroke-width="1.5">
      <rect x="30" y="71" width="8" height="31" rx="3.5"/><rect x="78" y="71" width="8" height="31" rx="3.5"/>
    </g>
    <g fill="#4a2e20"><rect x="30" y="97" width="8" height="5.5" rx="1.8"/><rect x="78" y="97" width="8" height="5.5" rx="1.8"/></g>
    ${schalTeil}${glockeTeil}
  </g>
  <g class="rentier-kopf">
    <g fill="none" stroke="#7a4e2e" stroke-width="2.8" stroke-linecap="round">${geweih}</g>
    <g fill="none" stroke="#caa06f" stroke-width="1.1" stroke-linecap="round" opacity=".8">${geweih}</g>
    <path d="M99 23 C93 18 88 19 85 22 C89 26 95 26 99 26 Z" fill="${fellDunkel}" stroke="${KONTUR}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M96 30 C94 22 100 17 107 18 C113 19 117 23 121 27 C125 30 125 35 120 36 C114 38 106 37 101 37 C97 36 96 33 96 30 Z" fill="${fell}" stroke="${KONTUR}" stroke-width="1.7" stroke-linejoin="round"/>
    <ellipse cx="116" cy="32.5" rx="6" ry="3.6" fill="#cf9b6e" opacity=".8"/>
    <ellipse cx="111" cy="31" rx="2.6" ry="1.5" fill="#e98d78" opacity=".45"/>
    <g class="rentier-auge"><ellipse cx="108" cy="25" rx="1.9" ry="2.2" fill="#3a2218"/><circle cx="108.6" cy="24.2" r=".65" fill="#fff"/></g>
    ${nasenTeil}
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Weihnachtsmann mit Schlitten und zwei Rentieren (viewBox 240 × 90, fliegt nach rechts)
// ---------------------------------------------------------------------------
function springendesRentier(x, y, verzoegerung) {
  return `<g transform="translate(${x} ${y})"><g class="flug-rentier" style="--v:${verzoegerung}s">
    <g stroke="#8a5a38" stroke-width="3" stroke-linecap="round"><path d="M9 4 L21 9 M7 5 L18 13 M-10 4 L-22 9 M-12 3 L-24 6"/></g>
    <path d="M-16 -1 C-20 -4 -21 -7 -18 -8 C-15 -7 -14 -4 -14 -2 Z" fill="#f1e3c8" stroke="${KONTUR}" stroke-width="1"/>
    <ellipse cx="0" cy="0" rx="16" ry="7.5" fill="#b2784b" stroke="${KONTUR}" stroke-width="1.5"/>
    <path d="M10 -4 C14 -10 18 -14 22 -17 L27 -13 C23 -9 19 -3 15 2 Z" fill="#b2784b" stroke="${KONTUR}" stroke-width="1.4" stroke-linejoin="round"/>
    <g fill="none" stroke="#7a4e2e" stroke-width="1.8" stroke-linecap="round"><path d="M24 -20 C23 -25 21 -28 18 -30 M22 -25 C20 -25 19 -26 18 -27 M27 -20 C29 -25 31 -27 34 -29"/></g>
    <path d="M21 -18 C24 -21 29 -21 32 -18 C35 -16 35 -13 32 -12 C28 -11 24 -12 22 -13 C20 -14 20 -16 21 -18 Z" fill="#b2784b" stroke="${KONTUR}" stroke-width="1.3"/>
    <circle cx="33" cy="-14" r="1.7" fill="#4a2a1e"/><circle cx="27" cy="-17" r=".9" fill="#3a2218"/>
    <path d="M12 -2 C15 0 18 -1 20 -5" fill="none" stroke="#f2c45a" stroke-width="1.6"/>
  </g></g>`;
}

export function schlittenSvg() {
  return `<svg class="schlitten-svg" viewBox="0 0 240 90" aria-hidden="true">
  <path d="M80 37 C110 40 130 30 148 34 M80 37 C120 30 170 20 205 26" fill="none" stroke="${KONTUR}" stroke-width="1.1"/>
  ${springendesRentier(146, 44, 0)}
  ${springendesRentier(203, 36, 0.25)}
  <g class="schlitten-gefaehrt">
    <!-- Sack mit Geschenken -->
    <path d="M18 42 C14 28 22 17 33 20 C42 22 45 32 41 42 Z" fill="#8a6440" stroke="${KONTUR}" stroke-width="1.5"/>
    <rect x="24" y="14" width="9" height="8" rx="1" fill="#2f6b4f" stroke="${KONTUR}" stroke-width="1"/>
    <rect x="31" y="11" width="8" height="10" rx="1" fill="#c8463a" stroke="${KONTUR}" stroke-width="1"/>
    <path d="M35 11 L35 21 M24.5 18 L32.5 18" stroke="#f2c45a" stroke-width="1.2"/>
    <!-- Weihnachtsmann -->
    <path d="M46 42 C44 27 52 20 62 20 C72 20 78 28 76 42 Z" fill="#c8463a" stroke="${KONTUR}" stroke-width="1.5"/>
    <path d="M70 29 C76 31 80 34 83 37" fill="none" stroke="#c8463a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="83" cy="37" r="2.8" fill="#2f6b4f" stroke="${KONTUR}" stroke-width=".8"/>
    <circle cx="64" cy="16" r="7" fill="#f4caa8" stroke="${KONTUR}" stroke-width="1.2"/>
    <path d="M57 16 C57 27 70 29 72 17 C68 21 61 21 57 16 Z" fill="#fbfbf8" stroke="#958a96" stroke-width=".9"/>
    <circle cx="66" cy="14" r=".9" fill="#3a2218"/><circle cx="69.5" cy="17" r="1.3" fill="#e98d78"/>
    <path d="M56 12 C57 3 68 -1 74 5 C77 8 79 12 80 16 L71 10 Z" fill="#c8463a" stroke="${KONTUR}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M55.5 11.5 Q64 7.5 72.5 10.5 L72.5 14 Q64 11 55.5 15 Z" fill="#fbfbf8" stroke="#958a96" stroke-width=".8"/>
    <circle cx="80.5" cy="17" r="2.6" fill="#fbfbf8" stroke="#958a96" stroke-width=".8"/>
    <!-- Schlitten -->
    <path d="M12 44 C10 30 22 26 30 32 L33 40 L86 40 C96 40 100 46 98 54 C96 62 88 66 76 66 L30 66 C20 66 13 58 12 44 Z" fill="#c8463a" stroke="${KONTUR}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M30 52 L92 52" stroke="#f2c45a" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="20" cy="40" r="4" fill="none" stroke="#f2c45a" stroke-width="2"/>
    <path d="M30 66 L27 76 M72 66 L74 76" stroke="#8a5a35" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M6 76 L84 76 C98 76 104 68 99 60" fill="none" stroke="#8a5a35" stroke-width="3.2" stroke-linecap="round"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Schneeboden. Formen werden auf die Breite gestreckt (preserveAspectRatio="none"),
// Konturen bleiben dabei gleich dick (vector-effect).
// ---------------------------------------------------------------------------
export function bodenHintenSvg() {
  const id = neueId('boden');
  return `<svg class="boden-svg" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdd7ee"/><stop offset="1" stop-color="#aab8da"/></linearGradient>
    <linearGradient id="${id}-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2fa"/><stop offset=".55" stop-color="#d9e1f1"/><stop offset="1" stop-color="#c3cee8"/></linearGradient>
  </defs>
  <!-- ferne Hügel -->
  <path d="M0 26 C40 8 90 6 130 20 C150 27 170 30 200 30 C230 30 250 27 270 20 C310 6 360 8 400 26 L400 100 L0 100 Z" fill="url(#${id}-a)"/>
  <path d="M0 26 C40 8 90 6 130 20 C150 27 170 30 200 30 C230 30 250 27 270 20 C310 6 360 8 400 26" fill="none" stroke="#8a8199" stroke-width="1.2" opacity=".45" vector-effect="non-scaling-stroke"/>
  <!-- Schneefeld, auf dem das Haus steht -->
  <path d="M0 44 C50 34 110 36 160 42 C185 45 215 45 240 42 C290 36 350 34 400 44 L400 100 L0 100 Z" fill="url(#${id}-b)"/>
  <path d="M0 44 C50 34 110 36 160 42 C185 45 215 45 240 42 C290 36 350 34 400 44" fill="none" stroke="#8a7f8e" stroke-width="1.4" opacity=".55" vector-effect="non-scaling-stroke"/>
  <path d="M20 60 C60 54 100 56 130 62 C100 66 50 66 20 60 Z M270 62 C300 55 345 54 380 60 C350 66 300 66 270 62 Z" fill="#b9c5e2" opacity=".55"/>
</svg>`;
}

export function bodenVorneSvg() {
  const id = neueId('boden');
  // Oberkante des mittleren Schneewalls: tritt in der Mitte leicht über den Fuß des Hauses
  const wall = 'M0 20 C40 12 90 10 135 17 C160 21 180 24 200 24 C220 24 240 21 265 17 C310 10 360 12 400 20';
  const linkerHuegel = 'M-4 56 C20 38 62 32 98 40 C122 45 140 54 150 66';
  const rechterHuegel = 'M404 52 C380 36 338 30 302 38 C278 43 260 52 250 64';
  return `<svg class="boden-svg" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset=".35" stop-color="#eef2f9"/><stop offset=".8" stop-color="#d7dff0"/><stop offset="1" stop-color="#c6d0e8"/></linearGradient>
    <linearGradient id="${id}-huegel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#f1f4fa"/><stop offset="1" stop-color="#d2dbee"/></linearGradient>
  </defs>
  <path d="${wall} L400 100 L0 100 Z" fill="url(#${id}-wall)"/>
  <!-- weicher Schatten direkt unter dem Haus -->
  <path d="M95 24 C140 20 170 27 200 27 C230 27 260 20 305 24 C290 34 250 38 200 38 C150 38 110 34 95 24 Z" fill="#b9c5e2" opacity=".55"/>
  <path d="${wall}" fill="none" stroke="#8b7f8c" stroke-width="1.5" opacity=".6" vector-effect="non-scaling-stroke"/>
  <!-- bläuliche Schatten und Mulden wie am Fuß des Hauses -->
  <path d="M110 40 C150 36 180 42 200 40 C230 38 260 36 300 40 C270 46 240 47 200 46 C160 47 130 46 110 40 Z" fill="#c9d3ea" opacity=".7"/>
  <path d="M20 30 C40 27 60 28 72 31 C58 34 36 34 20 30 Z M330 30 C348 27 368 27 384 30 C368 34 346 34 330 30 Z" fill="#c4cfe8" opacity=".75"/>
  <path d="M150 52 C170 49 190 50 204 53 C188 56 166 56 150 52 Z M210 60 C226 57 244 57 256 60 C242 63 224 63 210 60 Z" fill="#cdd6ec" opacity=".8"/>
  <!-- kleine Schneeklumpen mit Kontur -->
  <g fill="#fbfcfe" stroke="#9a8f9c" stroke-width="1" vector-effect="non-scaling-stroke">
    <path d="M58 40 C60 35 68 35 70 40 Z" vector-effect="non-scaling-stroke"/>
    <path d="M318 38 C321 32 331 32 334 38 Z" vector-effect="non-scaling-stroke"/>
    <path d="M176 64 C178 60 184 60 186 64 Z" vector-effect="non-scaling-stroke"/>
  </g>
  <path d="M0 60 C30 52 60 50 90 54 L150 66 L150 100 L0 100 Z" fill="#c3cde6" opacity=".6"/>
  <path d="M400 58 C370 50 340 48 310 52 L250 64 L250 100 L400 100 Z" fill="#c3cde6" opacity=".6"/>
  <!-- vordere Schneehügel -->
  <!-- Schattenkante vor den Hügeln (wie gemalt) -->
  <path d="M-4 56 C20 38 62 32 98 40 C122 45 140 54 150 66 L150 57 C138 47 120 38 98 33 C62 25 20 31 -4 48 Z" fill="#b4c0dc" opacity=".6"/>
  <path d="M404 52 C380 36 338 30 302 38 C278 43 260 52 250 64 L250 55 C262 45 280 36 302 31 C338 23 380 29 404 45 Z" fill="#b4c0dc" opacity=".6"/>
  <path d="${linkerHuegel} L150 100 L-4 100 Z" fill="url(#${id}-huegel)"/>
  <path d="${linkerHuegel}" fill="none" stroke="#8b7f8c" stroke-width="1.5" opacity=".65" vector-effect="non-scaling-stroke"/>
  <path d="${rechterHuegel} L250 100 L404 100 Z" fill="url(#${id}-huegel)"/>
  <path d="${rechterHuegel}" fill="none" stroke="#8b7f8c" stroke-width="1.5" opacity=".65" vector-effect="non-scaling-stroke"/>
  <!-- Lichtkante oben auf den Hügeln -->
  <path d="M8 50 C30 40 60 36 90 41" fill="none" stroke="#fff" stroke-width="3" opacity=".9" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  <path d="M392 47 C370 37 340 33 310 38" fill="none" stroke="#fff" stroke-width="3" opacity=".9" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  <path d="M10 78 C40 72 80 72 120 80 C80 84 40 84 10 78 Z M290 80 C320 72 360 72 392 78 C360 84 320 84 290 80 Z M160 70 C185 66 215 66 240 70 C215 74 185 74 160 70 Z" fill="#c9d3ea" opacity=".55"/>
</svg>`;
}
