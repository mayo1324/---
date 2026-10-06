'use strict';
/* ===== original artwork: mascot "שורי" + animated scenes. All hand-built SVG, nothing external. ===== */
let _u = 0; const uid = () => 'a' + (_u++);
const grad = (id, a, b, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const sky = (a, b) => { const id = uid(); return `<defs>${grad(id, a, b)}</defs><rect width="320" height="200" fill="url(#${id})"/>`; };
const cloud = (x, y, s = 1, d = 0) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="drift" style="animation-delay:${d}s"><ellipse rx="22" ry="8" fill="#fff" opacity=".8"/><ellipse cx="-11" cy="-6" rx="11" ry="8" fill="#fff" opacity=".8"/><ellipse cx="9" cy="-8" rx="13" ry="9" fill="#fff" opacity=".8"/></g></g>`;
const coin = (x, y, r = 7, d = 0) => `<g transform="translate(${x} ${y})"><g class="coin" style="animation-delay:${d}s"><circle r="${r}" fill="#ffc94d"/><circle r="${r * .68}" fill="none" stroke="#e8a317" stroke-width="1.4"/><path d="M-${r * .25} -${r * .35}v${r * .7}M${r * .25} -${r * .35}v${r * .7}" stroke="#e8a317" stroke-width="1.2"/></g></g>`;
const person = (x, y, body = '#6aa8ff', skin = '#ffd2a8', s = 1, wave = false) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${wave ? 'wave' : 'bob'}"><rect x="-6" y="-2" width="12" height="16" rx="5" fill="${body}"/><circle cy="-9" r="6.5" fill="${skin}"/><path d="M-6 -11q6 -8 12 0" fill="#3a2a1a"/><rect x="-5" y="13" width="4" height="9" rx="2" fill="#2a3040"/><rect x="1" y="13" width="4" height="9" rx="2" fill="#2a3040"/></g></g>`;
const star = (x, y, s = 1, d = 0) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="tw" style="animation-delay:${d}s" d="M0 -5l1.4 3.4 3.6.3-2.8 2.4.9 3.6L0 2.2-3.1 4.7l.9-3.6-2.8-2.4 3.6-.3z" fill="#fff"/></g>`;
const bld = (x, y, w, h, c, lit = .5) => { let win = ''; for (let i = 0; i < Math.floor(w / 9); i++) for (let j = 0; j < Math.floor(h / 12); j++) { const on = ((i * 7 + j * 3 + Math.floor(x)) % 10) / 10 < lit; win += `<rect x="${x + 4 + i * 9}" y="${y + 5 + j * 12}" width="4.5" height="6" rx="1" fill="${on ? '#ffe9a8' : 'rgba(0,0,0,.18)'}" ${on && (i + j) % 3 === 0 ? 'class="tw"' : ''}/>`; } return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${c}"/>${win}`; };
const T = (x, y, t, fill = '#fff', size = 11, w = 700) => `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${w}" text-anchor="middle" font-family="Heebo,sans-serif">${t}</text>`;

/* ----- the mascot ----- */
function mascot(mood = 'happy', size = 120) {
  const m = {
    happy: '<path d="M-14 12q14 14 28 0" fill="#fff" stroke="#0b3b30" stroke-width="2.5" stroke-linecap="round"/>',
    wow: '<ellipse cy="16" rx="8" ry="10" fill="#0b3b30"/><ellipse cy="19" rx="5" ry="5" fill="#ff7a8a"/>',
    think: '<path d="M-10 17q8 -5 18 0" fill="none" stroke="#0b3b30" stroke-width="2.8" stroke-linecap="round"/>',
    oops: '<path d="M-12 20q12 -10 24 0" fill="none" stroke="#0b3b30" stroke-width="2.8" stroke-linecap="round"/>'
  }[mood] || '';
  const eyes = mood === 'cheer' ? '<path d="M-27 -5q8 -9 16 0M11 -5q8 -9 16 0" fill="none" stroke="#0b3b30" stroke-width="3.5" stroke-linecap="round"/>'
    : `<g class="blink"><ellipse cx="-19" cy="-4" rx="7" ry="8.5" fill="#fff"/><ellipse cx="19" cy="-4" rx="7" ry="8.5" fill="#fff"/><circle cx="${mood === 'think' ? -16 : -18}" cy="${mood === 'think' ? -6 : -3}" r="4.4" fill="#0b3b30"/><circle cx="${mood === 'think' ? 22 : 20}" cy="${mood === 'think' ? -6 : -3}" r="4.4" fill="#0b3b30"/><circle cx="-16.5" cy="-5" r="1.6" fill="#fff"/><circle cx="21.5" cy="-5" r="1.6" fill="#fff"/></g>`;
  const mouth = mood === 'cheer' ? '<path d="M-15 11q15 20 30 0z" fill="#0b3b30"/><path d="M-9 17q9 7 18 0" fill="#ff7a8a"/>' : m;
  const brow = mood === 'oops' ? '<path d="M-26 -16l12 4M26 -16l-12 4" stroke="#0b3b30" stroke-width="3" stroke-linecap="round"/>' : mood === 'think' ? '<path d="M8 -17q9 -5 18 0" fill="none" stroke="#0b3b30" stroke-width="3" stroke-linecap="round"/>' : '';
  const arms = mood === 'cheer' ? '<g class="armL"><path d="M-36 24q-24 -8 -22 -34" fill="none" stroke="#18c796" stroke-width="11" stroke-linecap="round"/></g><g class="armR"><path d="M36 24q24 -8 22 -34" fill="none" stroke="#18c796" stroke-width="11" stroke-linecap="round"/></g>' : mood === 'think' ? '<path d="M30 34q18 -2 14 -22" fill="none" stroke="#18c796" stroke-width="11" stroke-linecap="round"/>' : '';
  const id = uid();
  return `<svg class="mascot ${mood}" viewBox="-70 -62 140 138" width="${size}" height="${size * .986}" aria-hidden="true"><defs><radialGradient id="${id}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#6bfad0"/><stop offset=".6" stop-color="#1fd9a4"/><stop offset="1" stop-color="#0e9f78"/></radialGradient></defs>
    <g class="mbob"><ellipse cx="0" cy="68" rx="34" ry="5" fill="#000" opacity=".25"/>${arms}
    <path d="M-26 -18q-20 -12 -12 -38q8 12 26 14z" fill="#fff6d6" stroke="#0b3b30" stroke-width="2"/><path d="M26 -18q20 -12 12 -38q-8 12 -26 14z" fill="#fff6d6" stroke="#0b3b30" stroke-width="2"/>
    <ellipse cx="-44" cy="-12" rx="11" ry="7" fill="#18c796" transform="rotate(-25 -44 -12)"/><ellipse cx="44" cy="-12" rx="11" ry="7" fill="#18c796" transform="rotate(25 44 -12)"/>
    <ellipse cx="0" cy="22" rx="46" ry="48" fill="url(#${id})" stroke="#0b3b30" stroke-width="2.5"/>
    <ellipse cx="0" cy="38" rx="31" ry="23" fill="#ccfff0" opacity=".9"/><ellipse cx="-10" cy="36" rx="3" ry="4.5" fill="#0b3b30" opacity=".75"/><ellipse cx="10" cy="36" rx="3" ry="4.5" fill="#0b3b30" opacity=".75"/>
    <circle cx="-33" cy="12" r="6.5" fill="#ff8aa0" opacity=".55"/><circle cx="33" cy="12" r="6.5" fill="#ff8aa0" opacity=".55"/>
    ${eyes}${brow}<g transform="translate(0 20)">${mouth}</g>
    <circle cx="0" cy="58" r="9" fill="#ffc94d" stroke="#c98a08" stroke-width="1.6"/><path d="M-3 54v8M3 54v8" stroke="#c98a08" stroke-width="1.6"/></g></svg>`;
}

/* ----- lesson scenes (viewBox 320x200) ----- */
const SCENES = {
  pie: () => sky('#2a1f4d', '#ff9a7a') + star(40, 30, 1) + star(120, 18, .8, .6) + star(250, 36, 1, 1.2) + `<circle cx="262" cy="52" r="16" fill="#fff0c9" opacity=".9"/>` + bld(40, 80, 34, 100, '#33295c') + bld(80, 56, 52, 124, '#3d3170', .6) + bld(138, 96, 30, 84, '#2c2350') + `<rect x="100" y="38" width="2" height="18" fill="#fff"/><path class="flag" d="M102 38h16l-4 5 4 5h-16z" fill="#1ff0b0"/><rect y="176" width="320" height="24" fill="#1d1638"/>` +
    `<g transform="translate(236 112)"><g class="float"><circle r="38" fill="#fff6e8"/><circle r="38" fill="none" stroke="#e8a56a" stroke-width="3"/><path d="M0 0L0 -38A38 38 0 0 1 32.9 -19Z" fill="#1ff0b0" transform="translate(7 -4)"/><path d="M0 0L-38 0M0 0L-19 33M0 0L19 33M0 0L38 0" stroke="#e8a56a" stroke-width="2"/></g></g>` + T(236, 170, 'החתיכה שלך', '#fff', 11) + coin(190, 70, 6, .3) + coin(205, 52, 5, .9),
  market: () => sky('#4fc3e8', '#c9f1ff') + cloud(60, 36, 1) + cloud(250, 28, .8, 1.5) + `<rect y="150" width="320" height="50" fill="#e8c88f"/>` +
    [0, 1].map(i => { const x = 28 + i * 160; return `<g><rect x="${x + 6}" y="100" width="118" height="52" fill="#a8683a"/>` + Array.from({ length: 6 }, (_, k) => `<path d="M${x + k * 21.3} 78h21.3l4 24h-29z" fill="${k % 2 ? '#fff' : (i ? '#ff6b6b' : '#1fc9a0')}"/>`).join('') + `<rect x="${x + 14}" y="116" width="26" height="20" rx="3" fill="${i ? '#ffd166' : '#ff9f68'}"/><circle cx="${x + 56}" cy="126" r="9" fill="${i ? '#ef476f' : '#06d6a0'}"/><circle cx="${x + 86}" cy="126" r="9" fill="${i ? '#ffd166' : '#118ab2'}"/></g>`; }).join('') +
    person(150, 128, '#6aa8ff', '#ffd2a8', 1.15, true) + person(176, 128, '#ff8fab', '#c68642', 1.15) + `<g><g class="swap"><path d="M154 112h18" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M168 108l5 4-5 4" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g></g>` + coin(162, 98, 6, .2) + `<rect x="100" y="22" width="120" height="22" rx="11" fill="#0d2230"/>` + T(160, 37, 'הבורסה פתוחה', '#1ff0b0', 11),
  coaster: () => sky('#3a2a7a', '#ff8fa3') + star(30, 24) + star(280, 30, .9, .7) + cloud(70, 44, .8) +
    `<path d="M0 150Q40 150 70 100T140 70Q170 56 190 110T250 130T320 60" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/><path d="M0 150Q40 150 70 100T140 70Q170 56 190 110T250 130T320 60V200H0z" fill="#1d1638" opacity=".55"/>` +
    `<g><animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path="M0 148Q40 148 70 98T140 68Q170 54 190 108T250 128T320 58"/><rect x="-11" y="-14" width="22" height="10" rx="4" fill="#ff5d73"/><circle cx="-6" cy="-2" r="3" fill="#222"/><circle cx="6" cy="-2" r="3" fill="#222"/><circle cy="-20" r="5.5" fill="#ffd2a8"/><path d="M-5 -22q5 -7 10 0" fill="#3a2a1a"/></g>`,
  styles: () => sky('#1e3a5f', '#7fd8be') + `<rect y="146" width="320" height="54" fill="#12304a"/><g stroke="#fff" stroke-opacity=".25" stroke-dasharray="6 6"><path d="M0 160h320M0 178h320"/></g>` +
    `<g transform="translate(60 138)"><g class="bob"><ellipse rx="22" ry="14" fill="#3ba66b"/><path d="M-12 -4q12 -10 24 0" fill="none" stroke="#2a7a4e" stroke-width="2"/><circle cx="22" cy="-2" r="7" fill="#7ad39c"/><circle cx="25" cy="-4" r="1.6" fill="#123"/><rect x="-14" y="10" width="7" height="6" rx="2" fill="#7ad39c"/><rect x="6" y="10" width="7" height="6" rx="2" fill="#7ad39c"/></g></g>` + T(60, 188, 'טווח ארוך', '#fff', 10.5) +
    person(160, 126, '#ffb703', '#ffd2a8', 1.5) + T(160, 188, 'סווינג', '#fff', 10.5) +
    `<g transform="translate(262 112)"><g class="float"><path d="M-8 24l8 -44l8 44z" fill="#ef476f"/><circle cy="-8" r="4.5" fill="#cfe9ff"/><path d="M-8 20l-8 8l8 -3zM8 20l8 8l-8 -3z" fill="#ffd166"/><path class="flame" d="M-4 24q4 18 8 0z" fill="#ffb703"/></g></g>` + T(262, 188, 'יומי', '#fff', 10.5),
  candle1: () => sky('#1b2a4a', '#2f3f73') + `<g stroke="#fff" stroke-opacity=".18" stroke-dasharray="4 5"><path d="M10 40h300M10 100h300M10 160h300"/></g><g class="float"><line x1="110" x2="110" y1="22" y2="182" stroke="#1ff0b0" stroke-width="5" stroke-linecap="round"/><rect x="88" y="64" width="44" height="82" rx="9" fill="#1ff0b0"/><rect x="88" y="64" width="44" height="14" rx="7" fill="#9bffe0" opacity=".6"/></g>` +
    [['הכי גבוה', 22, '#fff'], ['סגירה', 64, '#9bffe0'], ['פתיחה', 146, '#9bffe0'], ['הכי נמוך', 182, '#fff']].map(([t, yy, c]) => `<path d="M140 ${yy}h50" stroke="${c}" stroke-opacity=".7" stroke-dasharray="3 3"/>` + `<text x="196" y="${yy + 4}" fill="${c}" font-size="12" font-weight="700" font-family="Heebo,sans-serif">${t}</text>`).join(''),
  candle2: () => sky('#1b2a4a', '#2f3f73') + `<g class="float"><line x1="90" x2="90" y1="40" y2="170" stroke="#1ff0b0" stroke-width="5" stroke-linecap="round"/><rect x="70" y="70" width="40" height="70" rx="9" fill="#1ff0b0"/></g><g class="float" style="animation-delay:.8s"><line x1="230" x2="230" y1="30" y2="160" stroke="#ff6048" stroke-width="5" stroke-linecap="round"/><rect x="210" y="55" width="40" height="72" rx="9" fill="#ff6048"/></g>` + T(90, 192, 'עלה', '#1ff0b0', 13) + T(230, 192, 'ירד', '#ff6048', 13) + `<path d="M90 26v-14M84 18l6 -8 6 8" fill="none" stroke="#1ff0b0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M230 176v10" stroke="#ff6048" stroke-width="3"/>`,
  index: () => sky('#16324f', '#3a7fa8') + cloud(250, 34, .9) + `<path d="M70 96h180l-14 84H84z" fill="#c68a4a"/><path d="M70 96h180" stroke="#8a5a2a" stroke-width="5"/><g stroke="#a9733a" stroke-width="2" opacity=".6"><path d="M95 100l8 76M125 100l5 76M160 100v76M195 100l-5 76M225 100l-8 76"/></g><path d="M100 96q60 -66 120 0" fill="none" stroke="#8a5a2a" stroke-width="6" stroke-linecap="round"/>` +
    [['#ff6b6b', 112, 82], ['#ffd166', 146, 70], ['#06d6a0', 180, 76], ['#118ab2', 212, 84], ['#ef8cff', 128, 62], ['#ff9f68', 198, 60]].map(([c, x, yy], i) => `<g transform="translate(${x} ${yy})"><g class="float" style="animation-delay:${i * .3}s"><rect x="-13" y="-13" width="26" height="26" rx="8" fill="${c}"/><path d="M-6 4l4 -6 4 4 5 -7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></g>`).join(''),
  volume: () => sky('#241a52', '#7a4fb0') + `<rect y="168" width="320" height="32" fill="#150f33"/>` +
    [38, 62, 30, 90, 70, 108, 54, 80, 44, 66].map((h, i) => `<g><rect class="grow" style="animation-delay:${i * .08}s;transform-origin:${34 + i * 28}px 168px" x="${24 + i * 28}" y="${168 - h}" width="20" height="${h}" rx="5" fill="${h > 85 ? '#ff6048' : '#1ff0b0'}" opacity=".9"/></g>` + (h > 60 ? person(34 + i * 28, 168 - h - 18, ['#ffd166', '#6aa8ff', '#ff8fab'][i % 3], '#ffd2a8', .7, true) : '')).join('') + T(160, 24, 'כמה אנשים קנו ומכרו?', '#fff', 12),
  ma: () => sky('#0f3a43', '#25a79b') + `<g stroke="#fff" stroke-opacity=".15"><path d="M0 60h320M0 110h320M0 160h320"/></g><path id="mapath" d="M10 150C60 120 90 160 130 110S200 90 230 70 290 40 312 32" fill="none" stroke="#ffd166" stroke-width="5" stroke-linecap="round"/><polyline points="10,150 30,100 50,140 70,86 90,150 110,96 130,110 150,60 170,104 190,56 210,96 230,48 250,90 270,40 290,64 312,32" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" stroke-linejoin="round"/><circle r="6" fill="#fff" stroke="#ffd166" stroke-width="3"><animateMotion dur="5s" repeatCount="indefinite" path="M10 150C60 120 90 160 130 110S200 90 230 70 290 40 312 32"/></circle>` + T(160, 188, 'הקו הצהוב מחליק את הקפיצות', '#fff', 12),
  trendUp: () => sky('#14334f', '#58b8d8') + cloud(60, 40, .9) + cloud(240, 30, .7, 1) + `<path d="M0 200V160h60V132h60V104h60V76h60V48h60V200z" fill="#2f5d7c"/><path d="M0 160h60V132h60V104h60V76h60V48h60" fill="none" stroke="#7fe3c7" stroke-width="4"/><g fill="#ffd166"><circle cx="60" cy="132" r="5"/><circle cx="120" cy="104" r="5"/><circle cx="180" cy="76" r="5"/><circle cx="240" cy="48" r="5"/></g>` + person(206, 52, '#ff8fab', '#ffd2a8', 1.1, true) + `<rect x="290" y="14" width="2" height="34" fill="#fff"/><path class="flag" d="M292 14h18l-4 6 4 6h-18z" fill="#1ff0b0"/>` + T(160, 192, 'כל "רצפה" גבוהה מהקודמת', '#fff', 11),
  trendDown: () => sky('#2a1f4d', '#c56a8a') + cloud(70, 34, .8) + `<path d="M0 200V48h60V76h60V104h60V132h60V160h60V200z" fill="#3a2a60"/><path d="M0 48h60V76h60V104h60V132h60V160h60" fill="none" stroke="#ff8f8f" stroke-width="4"/><g fill="#ffd166"><circle cx="60" cy="76" r="5"/><circle cx="120" cy="104" r="5"/><circle cx="180" cy="132" r="5"/><circle cx="240" cy="160" r="5"/></g>` + person(206, 120, '#6aa8ff', '#ffd2a8', 1.1) + T(160, 192, 'כל "רצפה" נמוכה מהקודמת', '#fff', 11),
  trendSide: () => sky('#1e3a5f', '#8fd3c0') + cloud(80, 36, .9) + cloud(250, 50, .7, 1.2) + `<rect y="130" width="320" height="70" fill="#3b8a6a"/><path d="M0 130h320" stroke="#7fe3c7" stroke-width="4"/><rect x="80" y="84" width="3" height="46" fill="#8a5a2a"/><path d="M83 88h38l8 8-8 8H83z" fill="#ffd166"/><rect x="236" y="84" width="3" height="46" fill="#8a5a2a"/><path d="M236 88h-38l-8 8 8 8h38z" fill="#ffd166"/>` + person(160, 116, '#ef476f', '#ffd2a8', 1.2) + T(160, 168, 'הולך ימינה ושמאלה, לא מתקדם', '#fff', 11),
  support: () => sky('#14334f', '#335d85') + `<rect y="150" width="320" height="50" fill="#2d8a63"/><path d="M0 150h320" stroke="#7fe3c7" stroke-width="4"/><rect y="146" width="320" height="10" fill="#fbbf24" opacity=".25"/>` + `<g transform="translate(160 136)"><g class="ball"><circle r="14" fill="#ff8f6b"/><path d="M-14 0q14 -8 28 0M0 -14q8 14 0 28" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></g></g>` + `<g fill="#fff" opacity=".6"><circle cx="60" cy="80" r="2"/><circle cx="260" cy="60" r="2"/><circle cx="220" cy="110" r="2"/></g>` + T(160, 184, 'הרצפה: המחיר קופץ ממנה חזרה', '#fff', 12) + `<path d="M268 40v34M262 66l6 8 6 -8" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  resist: () => sky('#2a1f4d', '#6a4fb0') + `<rect y="0" width="320" height="34" fill="#3a2a70"/><path d="M0 34h320" stroke="#a78bfa" stroke-width="4"/><rect y="34" width="320" height="10" fill="#a78bfa" opacity=".25"/>` + `<g transform="translate(160 160)"><g class="balloon"><ellipse cy="-30" rx="17" ry="21" fill="#ff6b9d"/><path d="M0 -9l-4 6h8z" fill="#ff6b9d"/><path d="M0 -3q-6 14 0 30" fill="none" stroke="#fff" stroke-width="1.6"/></g></g>` + T(160, 188, 'התקרה: המחיר נעצר ולא עובר', '#fff', 12),
  rr: () => sky('#3a2a7a', '#e8a56a') + `<path d="M24 164q60 -10 90 -42T196 90 280 40" fill="none" stroke="#fff" stroke-width="3.5" stroke-dasharray="7 7" stroke-linecap="round" opacity=".8"/>` +
    `<g transform="translate(28 160)"><rect x="-1.5" y="-30" width="3" height="32" fill="#fff"/><path class="flag" d="M1.5 -30h20l-5 6 5 6h-20z" fill="#6aa8ff"/></g>` + T(30, 186, 'כניסה', '#9fc4ff', 11) +
    `<g transform="translate(130 150)"><path d="M-9 -16h18l9 9v18l-9 9h-18l-9 -9v-18z" fill="#ff6048" stroke="#fff" stroke-width="2"/>${T(0, 4, 'סטופ', '#fff', 9)}</g>` + T(130, 186, 'יוצאים אם טעינו', '#ffc4b8', 10) +
    `<g transform="translate(272 54)"><g class="float"><rect x="-22" y="-8" width="44" height="26" rx="5" fill="#a8683a"/><path d="M-22 -8q22 -22 44 0z" fill="#c9833f"/><rect x="-4" y="-2" width="8" height="10" rx="2" fill="#ffd166"/><circle cx="-14" cy="-16" r="3" fill="#ffd166"/><circle cx="12" cy="-20" r="2.4" fill="#fff" class="tw"/></g></g>` + T(272, 90, 'יעד', '#ffd166', 11),
  size: () => sky('#1e3a5f', '#6fb1c9') + `<rect y="164" width="320" height="36" fill="#1a3350"/>` + `<g transform="translate(150 118)"><g class="bob"><ellipse rx="56" ry="42" fill="#ff9ec1"/><ellipse cx="54" cy="6" rx="14" ry="11" fill="#ff7fae"/><circle cx="50" cy="6" r="2.4" fill="#7a2a4a"/><circle cx="58" cy="6" r="2.4" fill="#7a2a4a"/><circle cx="30" cy="-12" r="4.6" fill="#2a1a2a"/><path d="M-30 -36l14 -14l12 20z" fill="#ff7fae"/><rect x="-14" y="-44" width="30" height="5" rx="2.5" fill="#7a2a4a"/><rect x="-36" y="34" width="12" height="16" rx="5" fill="#ff7fae"/><rect x="16" y="34" width="12" height="16" rx="5" fill="#ff7fae"/><path d="M-56 -4q-18 -2 -14 -16" fill="none" stroke="#ff7fae" stroke-width="6" stroke-linecap="round"/></g></g>` + coin(150, 40, 9, 0) + `<g transform="translate(260 70)"><circle r="24" fill="#0d2230" opacity=".7"/>${T(0, 6, '1%', '#1ff0b0', 17)}</g>` + T(260, 112, 'רק חלק קטן', '#fff', 10.5)
};
SCENES.candles = SCENES.coaster; SCENES.scale = SCENES.market;
const sceneSVG = (key) => { const f = SCENES[key] || SCENES.candle1; return `<svg direction="ltr" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" class="scene">${f()}</svg>`; };

/* onboarding scenes (portrait) */
function obScene(i) {
  const id = uid(), g = [['#2a1f4d', '#ff8f6b'], ['#14334f', '#1fd9a4'], ['#3a2a7a', '#ffb86b']][i];
  let skyline = ''; const r = rng(40 + i);
  for (let k = 0; k < 9; k++) { const h = 70 + r() * 110, x = k * 38 - 6; skyline += bld(x, 380 - h, 32, h, ['#2a2150', '#33295c', '#3d3170'][k % 3], .55); }
  const extras = [
    `<g transform="translate(160 150)"><circle r="46" fill="#fff0c9" opacity=".9"/></g>`,
    `<g transform="translate(160 120)"><path d="M-70 40L-30 -10L0 20L40 -30L80 -50" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="80" cy="-50" r="8" fill="#ffc94d"/></g>`,
    `<g transform="translate(160 110)"><rect x="-44" y="10" width="88" height="56" rx="8" fill="#a8683a"/><path d="M-44 10q44 -44 88 0z" fill="#c9833f"/><rect x="-8" y="22" width="16" height="20" rx="3" fill="#ffd166"/><path d="M-44 10h88" stroke="#ffd166" stroke-width="4"/></g>`
  ][i];
  return `<svg direction="ltr" viewBox="0 0 320 380" preserveAspectRatio="xMidYMid slice" class="scene"><defs>${grad(id, g[0], g[1])}</defs><rect width="320" height="380" fill="url(#${id})"/>${star(40, 40)}${star(110, 22, .8, .5)}${star(270, 50, 1, 1)}${star(210, 24, .7, 1.4)}${extras}${cloud(60, 90, 1)}${cloud(260, 120, .8, 1.5)}${skyline}${coin(60, 200, 8, 0)}${coin(268, 230, 7, .7)}${coin(40, 260, 6, 1.2)}<rect y="352" width="320" height="28" fill="#150f33"/></svg>`;
}

/* ----- small interactive toys inside lessons ----- */
function toyHTML(x) {
  if (x === 'scale') return `<div class="toy" id="toy"><div class="toy-v"><svg direction="ltr" viewBox="0 0 320 120" class="scene" style="height:120px"><g id="plank" style="transform-origin:160px 80px;transition:transform .6s cubic-bezier(.3,1.5,.5,1)"><rect x="40" y="74" width="240" height="8" rx="4" fill="#ffc94d"/>${person(70, 62, '#ff8fab', '#ffd2a8', 1)}${person(94, 62, '#6aa8ff', '#c68642', 1)}${person(226, 62, '#06d6a0', '#ffd2a8', 1)}</g><path d="M160 82l-18 32h36z" fill="#8a5a2a"/>${T(70, 22, 'קונים', '#1ff0b0', 13)}${T(250, 22, 'מוכרים', '#ff8f8f', 13)}</svg></div><div class="toy-p">מחיר: <b id="tp" class="up">100</b></div><div class="toy-b"><button class="chip" data-d="1">עוד קונים</button><button class="chip" data-d="-1">עוד מוכרים</button></div></div>`;
  if (x === 'flip') return `<div class="toy" id="toy"><div class="toy-b"><button class="chip on" data-d="up">יום ירוק</button><button class="chip" data-d="down">יום אדום</button></div><div class="toy-p" id="tt">פתיחה <b>100</b> · סגירה <b class="up">108</b></div></div>`;
  return '';
}
function bindToy(x, root) {
  const t = $('#toy', root); if (!t) return;
  if (x === 'scale') { let b = 0; t.onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; b = clamp(b + +c.dataset.d, -4, 4); $('#plank', t).style.transform = `rotate(${b * -3.5}deg)`; const p = $('#tp', t); p.textContent = 100 + b * 3; p.className = b >= 0 ? 'up' : 'down'; burst(e.clientX, e.clientY, c.dataset.d > 0 ? '#1ff0b0' : '#ff8f8f'); }; }
  if (x === 'flip') t.onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; $$('.chip', t).forEach(k => k.classList.toggle('on', k === c)); const up = c.dataset.d === 'up'; $('#tt', t).innerHTML = up ? 'פתיחה <b>100</b> · סגירה <b class="up">108</b>' : 'פתיחה <b>100</b> · סגירה <b class="down">92</b>'; const sc = $('.scene', root.closest('.slide') || document); burst(e.clientX, e.clientY, up ? '#1ff0b0' : '#ff8f8f'); };
}

/* ----- sparkles on tap ----- */
function burst(x, y, color = '#1ff0b0', n = 10) {
  if (reduceMotion) return;
  const ph = $('#phone').getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'); s.className = 'spk';
    const a = Math.PI * 2 * i / n + Math.random() * .6, d = 26 + Math.random() * 26;
    s.style.cssText = `left:${x - ph.left}px;top:${y - ph.top}px;background:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
    $('#phone').appendChild(s); setTimeout(() => s.remove(), 700);
  }
}
document.addEventListener('pointerdown', (e) => { const b = e.target.closest('.btn.primary,.opt,.rk,.chip,.tab'); if (b) burst(e.clientX, e.clientY, '#1ff0b0', 6); });

/* mascot lines per slide */
const SAY = {
  l1: ['חשבו על פיצה: כל מניה היא משולש קטן.', 'זה כמו שוק, אבל עם מחשבים.', 'נסו להזיז את המאזניים!', 'הכי חשוב: לדעת כמה אפשר להפסיד.', 'כל אחד בוחר סגנון שמתאים לו.'],
  l2: ['נר אחד = סיפור קטן של זמן אחד.', 'נסו להחליף בין יום ירוק לאדום!', 'הקווים הדקים הם המסע, לא התחנה.', 'ועכשיו מסתכלים על הרבה נרות.'],
  l3: ['מדד = סל עם הרבה חברות בפנים.', 'עמודות גבוהות = הרבה אנשים בשוק.', 'הקו הצהוב עושה סדר בבלגן.', 'שקט או סוער? זו התנודתיות.'],
  l4: ['תדמיינו שאתם מטפסים על מדרגות.', 'כל מדרגה גבוהה מהקודמת = עולים.', 'וכאן יורדים מדרגה אחרי מדרגה.', 'כשלא מתקדמים, אפשר לחכות.'],
  l5: ['הכדור קופץ מהרצפה, וגם המחיר לפעמים.', 'מחפשים איפה הוא כבר קפץ בעבר.', 'לא נקודה אחת, אלא אזור.', 'ורצפה יכולה להישבר, זהירות!'],
  l6: ['הבלון עולה ופוגש תקרה.', 'מחפשים איפה זה כבר קרה.', 'גם תקרות נשברות לפעמים.'],
  l7: ['מפה שלמה: כניסה, סטופ, יעד.', 'קונים כשיש סיבה, לא כשיש תחושה.', 'הסטופ הוא רשת הביטחון שלכם.', 'והיעד הוא האוצר.', 'כאן לא מנחשים, כאן חושבים.'],
  l8: ['מי שמסכן 5 כדי להרוויח 10, חכם.', 'בואו נספור ביחד.', 'גם הטובים מפסידים לפעמים, וזה בסדר.'],
  l9: ['קודם קובעים כמה מוכנים להפסיד.', 'חישוב קטן ואתם שולטים.', 'לא שמים הכול בקופה אחת!', 'לפעמים הכי חכם לחכות.']
};
