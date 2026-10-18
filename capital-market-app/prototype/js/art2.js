'use strict';
/* ===== extra scenes for the new lessons (same style as art.js) ===== */
const person = (x, y, col, s = 1, lean = 0) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="${lean}" cy="-26" r="7" fill="${col}"/><path d="M${lean} -17 L0 6 M0 -8 L${-9 + lean} 0 M0 -8 L${10 + lean} -2 M0 6 L-8 20 M0 6 L9 20" stroke="${col}" stroke-width="4.5" stroke-linecap="round" fill="none"/></g>`;
const candleAt = (x, hi, lo, o, c, col, w = 26) => `<g><line x1="${x}" x2="${x}" y1="${hi}" y2="${lo}" stroke="${col}" stroke-width="3.5" stroke-linecap="round"/><rect x="${x - w / 2}" y="${Math.min(o, c)}" width="${w}" height="${Math.max(6, Math.abs(o - c))}" rx="6" fill="${col}"/></g>`;
const brace = (x, y1, y2, col, side = 1) => `<path d="M${x} ${y1} q${8 * side} 0 ${8 * side} 8 V${(y1 + y2) / 2 - 5} q0 5 ${5 * side} 5 q${-5 * side} 0 ${-5 * side} 5 V${y2 - 8} q0 8 ${-8 * side} 8" fill="none" stroke="${col}" stroke-width="1.8" stroke-linecap="round"/>`;
Object.assign(SCENES, {
  range: () => bgS() + candleAt(92, 78, 124, 92, 108, GR, 24) + candleAt(228, 26, 176, 70, 138, RD, 24)
    + brace(122, 78, 124, MUT, 1) + brace(198, 26, 176, MUT, -1)
    + pill(92, 150, 'יום רגוע', GR) + pill(228, 192 - 4, 'יום סוער', RD) + pill(160, 101, 'טווח קטן', '#fff', '#fff') + pill(160, 56, 'טווח גדול', '#fff', '#fff'),
  gap: () => bgS() + candleAt(92, 52, 150, 128, 76, GR, 30) + candleAt(228, 24, 118, 36, 104, RD, 30)
    + dash(110, 76, 210, 76, MUT, 1.2) + dash(110, 36, 210, 36, GD, 1.4) + `<path d="M160 40v32" stroke="${GD}" stroke-width="2.2" stroke-linecap="round"/><path d="M155 48l5 -8 5 8M155 68l5 8 5 -8" fill="none" stroke="${GD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    + pill(192, 56, 'פער', GD) + pill(92, 172, 'סגירה אתמול', GR) + pill(228, 150, 'פתיחה היום', RD),
  fomo_crowd: () => bgS() + [[40, 120, 1, 5], [78, 132, .95, 5], [118, 116, 1, 5], [156, 130, .95, 5], [196, 118, 1, 5]].map(([x, y, s, l], i) => person(x, y, GR, s, l).replace('<g ', `<g style="opacity:${.95 - i * .06}" `)).join('')
    + `<path d="M228 140 L262 80 L248 82 L270 56 L292 82 L278 80 Z" fill="${GR}" fill-opacity=".85"/>`
    + dash(30, 150, 214, 150, GR, 1.2) + person(150, 76, GD, .9, 0) + `<circle cx="188" cy="42" r="14" fill="${GD}" fill-opacity=".16" stroke="${GD}"/>${T(188, 47, '?', GD, 16, 800)}`
    + pill(100, 176, 'כולם קונים', GR) + pill(240, 176, 'מחכים רגע?', GD)
});

Object.assign(SCENES, {
  leverage: () => bgS() + T(160, 24, 'דוגמה: כסף שלך והלוואה מהברוקר', MUT, 11, 600)
    + `<rect x="40" y="44" width="80" height="26" rx="8" fill="${GR}"/><rect x="124" y="44" width="160" height="26" rx="8" fill="${GD}" fill-opacity=".85"/>` + T(80, 62, 'הכסף שלך', '#06201a', 11, 800) + T(204, 62, 'הלוואה', '#2a1d00', 11, 800)
    + `<path d="M162 82v22" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 4"/>` + T(162, 98, 'המחיר יורד', '#fff', 11, 700)
    + `<rect x="40" y="116" width="80" height="26" rx="8" fill="${RD}" fill-opacity=".25" stroke="${RD}" stroke-dasharray="4 3"/><rect x="124" y="116" width="160" height="26" rx="8" fill="${GD}" fill-opacity=".85"/><rect x="40" y="116" width="80" height="26" rx="8" fill="${RD}" fill-opacity=".25"/>`
    + `<path d="M62 124l36 10M98 124l-36 10" stroke="${RD}" stroke-width="3" stroke-linecap="round"/>` + pill(160, 170, 'הפסד קטן בשוק יכול למחוק את כל הכסף שלך', RD),
  fees: () => bgS() + T(160, 26, 'דוגמה: מה אוכל מהתשואה', MUT, 11, 600)
    + `<rect x="30" y="44" width="260" height="34" rx="10" fill="${GR}" fill-opacity=".9"/>` + T(160, 66, 'התשואה', '#06201a', 13, 800)
    + `<rect x="30" y="96" width="150" height="34" rx="10" fill="${GR}" fill-opacity=".9"/><rect x="184" y="96" width="34" height="34" rx="8" fill="${RD}"/><rect x="222" y="96" width="34" height="34" rx="8" fill="${GD}"/><rect x="260" y="96" width="30" height="34" rx="8" fill="${VI}"/>`
    + `<path d="M160 82v10" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>` + pill(201, 150, 'עמלה', RD) + pill(239, 172, 'מרווח', GD) + pill(275, 150, 'דמי ניהול', VI) + T(100, 118, 'מה שנשאר', '#06201a', 12, 800)
});

const coin = (x, y, r = 9, col = GD) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="#fff" stroke-opacity=".4"/><text x="${x}" y="${y + r * .38}" fill="#3a2a00" font-size="${r * 1.1}" font-weight="800" text-anchor="middle" font-family="Heebo,sans-serif">₪</text>`;
const arrowTo = (x1, y1, x2, y2, col) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 7; return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="2.2" stroke-linecap="round" class="flow" stroke-dasharray="5 5"/><path d="M${x2 - h * Math.cos(a - .5)} ${y2 - h * Math.sin(a - .5)} L${x2} ${y2} L${x2 - h * Math.cos(a + .5)} ${y2 - h * Math.sin(a + .5)}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`; };
const box = (x, y, w, h, col, label, sub) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${col}" fill-opacity=".12" stroke="${col}" stroke-opacity=".7"/>${T(x + w / 2, y + h / 2 + (sub ? -2 : 5), label, '#fff', 13, 700)}${sub ? T(x + w / 2, y + h / 2 + 14, sub, MUT, 10.5, 600) : ''}`;
Object.assign(SCENES, {
  bondLoan: () => bgS() + box(18, 64, 96, 72, GR, 'מלווה', 'אתם') + box(206, 64, 96, 72, BL, 'מנפיק', 'מדינה או חברה')
    + arrowTo(116, 80, 204, 80, GD) + coin(160, 70, 9) + pill(160, 52, 'הלוואה', GD)
    + arrowTo(204, 104, 116, 104, GR) + pill(160, 120, 'ריבית', GR) + arrowTo(204, 132, 116, 132, GR) + pill(160, 150, 'החזר בסוף', GR) + T(160, 184, 'אג״ח היא הלוואה', MUT, 10.5, 600),
  players: () => bgS() + box(16, 118, 78, 52, GR, 'משקיע') + box(121, 118, 78, 52, GD, 'ברוקר') + box(226, 118, 78, 52, BL, 'בורסה')
    + arrowTo(96, 144, 119, 144, '#fff') + arrowTo(201, 144, 224, 144, '#fff')
    + box(110, 22, 100, 44, VI, 'רגולטור', 'מפקח') + `<path d="M160 68V116M140 66L62 116M180 66L264 116" stroke="${VI}" stroke-width="1.6" stroke-dasharray="4 4" fill="none" opacity=".8"/>` + T(160, 188, 'כל אחד עם תפקיד אחר', MUT, 10.5, 600),
  fundPool: () => bgS() + [[34, 56], [34, 100], [34, 144]].map(([x, y], i) => person(x, y + 14, [GR, BL, GD][i], .62, 0) + arrowTo(52, y, 112, 100, '#fff')).join('')
    + `<circle cx="140" cy="100" r="30" fill="${GR}" fill-opacity=".14" stroke="${GR}" stroke-opacity=".8" stroke-width="2"/>` + T(140, 105, 'קרן', '#fff', 14, 800)
    + [[GR, 'מניות', 52], [BL, 'אג״ח', 88], [GD, 'מניות אחרות', 124], [VI, 'נכסים נוספים', 160]].map(([c, t, y]) => arrowTo(172, 100, 212, y, c) + `<rect x="214" y="${y - 12}" width="90" height="24" rx="12" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-opacity=".8"/>${T(259, y + 4, t, '#fff', 10.5, 700)}`).join('')
    + pill(140, 168, 'כסף של הרבה אנשים', '#fff', '#fff'),
  inflBasket: () => { const basket = (x, notes, label, col) => `<g><path d="M${x - 44} 96 h88 l-10 56 h-68 Z" fill="${col}" fill-opacity=".14" stroke="${col}" stroke-width="2" stroke-linejoin="round"/><path d="M${x - 30} 96 q30 -44 60 0" fill="none" stroke="${col}" stroke-width="2.4"/>${notes.map((n, i) => `<rect x="${x - 18 + i * 22}" y="${112 - i * 8}" width="30" height="16" rx="3" fill="${GR}" fill-opacity=".85" stroke="#06201a"/>${T(x - 3 + i * 22, 124 - i * 8, '₪', '#06201a', 11, 800)}`).join('')}${pill(x, 176, label, col)}</g>`; return bgS() + T(160, 28, 'אותו סל מצרכים', '#fff', 13, 700) + basket(88, [0], 'אתמול', GR) + basket(232, [0, 1], 'היום', RD) + `<path d="M138 120h44M172 112l10 8-10 8" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` + T(160, 56, 'המחירים עלו: צריך יותר שקלים', MUT, 10.5, 600); },
  compareBars: () => bgS() + [['פיקדון', 36, GR, 52], ['קרן', 78, GD, 56], ['מניה', 132, RD, 54]].map(([t, h, c, x], i) => { const bx = 56 + i * 90; return `<rect x="${bx}" y="${160 - h}" width="54" height="${h}" rx="10" fill="${c}" fill-opacity=".85" style="animation:growy .7s cubic-bezier(.2,.9,.2,1) ${i * 120}ms both;transform-origin:${bx + 27}px 160px"/>${T(bx + 27, 178, t, '#fff', 12, 700)}`; }).join('')
    + `<path d="M62 120 L170 80 L262 30" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 5"/>` + pill(66, 26, 'סיכון', '#fff', '#fff') + pill(262, 18 + 12, 'גבוה', RD)
});
