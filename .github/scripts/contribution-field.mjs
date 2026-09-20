import fs from 'node:fs';
import path from 'node:path';

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const username = process.env.GH_USERNAME || 'Aryan1092raj';
const output = process.env.OUTPUT_PATH || 'dist/contribution-field.svg';
const query = 'query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar { weeks { contributionDays { contributionCount } } } } } }';

if (!token) throw new Error('Missing GitHub token');

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: 'bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { login: username } }),
});
if (!response.ok) throw new Error('GitHub API error ' + response.status);

const json = await response.json();
if (json.errors) throw new Error(JSON.stringify(json.errors));

const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks.slice(-52);
while (weeks.length < 52) weeks.unshift({ contributionDays: [] });

const cell = 14;
const gap = 4;
const gridX = 74;
const gridY = 116;
const rows = 7;
const max = Math.max(...weeks.flatMap((week) => week.contributionDays.map((day) => day.contributionCount || 0)), 1);

function color(count) {
  if (!count) return '#111318';
  const ratio = count / max;
  if (ratio < 0.2) return '#12303a';
  if (ratio < 0.4) return '#0e7490';
  if (ratio < 0.65) return '#06b6d4';
  if (ratio < 0.85) return '#8b5cf6';
  return '#ff6b35';
}

const cells = [];
for (let col = 0; col < 52; col += 1) {
  const days = weeks[col]?.contributionDays || [];
  for (let row = 0; row < rows; row += 1) {
    const count = days[row]?.contributionCount || 0;
    cells.push({
      x: gridX + col * (cell + gap),
      y: gridY + row * (cell + gap),
      count,
    });
  }
}

const activeDays = cells.filter((item) => item.count > 0).length;
const hot = cells.filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 12);

const heatmap = cells.map((item) =>
  '<rect x="' + item.x + '" y="' + item.y + '" width="' + cell + '" height="' + cell + '" rx="3" fill="' + color(item.count) + '"/>'
).join('');

const pulses = hot.map((item, index) => {
  const cx = item.x + cell / 2;
  const cy = item.y + cell / 2;
  const delay = (index * 0.35).toFixed(2);
  return '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="none" stroke="#fff" opacity="0">' +
    '<animate attributeName="r" values="4;13;4" dur="2.8s" begin="' + delay + 's" repeatCount="indefinite"/>' +
    '<animate attributeName="opacity" values="0;.8;0" dur="2.8s" begin="' + delay + 's" repeatCount="indefinite"/>' +
    '</circle>';
}).join('');

const roverPath = 'M 78 316 C 240 286 390 340 560 310 S 866 282 1032 316';

const rover = [
  '<g>',
  '<path d="M -8 -18 L -52 -162 L 52 -162 Z" fill="url(#beam)" opacity=".09"><animate attributeName="opacity" values=".03;.15;.03" dur="2.2s" repeatCount="indefinite"/></path>',
  '<line x1="0" y1="-18" x2="0" y2="-162" stroke="#48cae4" stroke-width="1" stroke-dasharray="3 8" opacity=".65"><animate attributeName="stroke-dashoffset" from="0" to="-22" dur="1s" repeatCount="indefinite"/></line>',
  '<rect x="-25" y="-20" width="50" height="22" rx="5" fill="url(#rover)" stroke="#48cae4" stroke-width="1.5"/>',
  '<rect x="-13" y="-28" width="26" height="10" rx="3" fill="#0d1117" stroke="#8b5cf6" stroke-width="1"/>',
  '<circle cx="0" cy="-23" r="3" fill="#ff6b35" filter="url(#glow)"><animate attributeName="opacity" values="1;.25;1" dur="1.1s" repeatCount="indefinite"/></circle>',
  '<line x1="0" y1="-29" x2="0" y2="-42" stroke="#b8f3ff" stroke-width="1.5"/>',
  '<circle cx="0" cy="-45" r="3" fill="#48cae4" filter="url(#glow)"><animate attributeName="r" values="2;5;2" dur="1.6s" repeatCount="indefinite"/></circle>',
  '<g fill="#171d28" stroke="#48cae4" stroke-width="1">',
  '<circle cx="-17" cy="5" r="8"/><circle cx="17" cy="5" r="8"/>',
  '</g>',
  '<path d="M -25 -7 H 25" stroke="#ff6b35" stroke-width="2"><animate attributeName="stroke-dashoffset" from="0" to="-20" dur=".8s" repeatCount="indefinite"/></path>',
  '<text x="30" y="-12" fill="#f5f5f5" font-family="monospace" font-size="11">ROVER-01</text>',
  '<text x="30" y="3" fill="#777" font-family="monospace" font-size="9">SCANNING</text>',
  '<animateMotion dur="14s" repeatCount="indefinite" path="' + roverPath + '"/>',
  '</g>',
].join('');

const svg = [
  '<svg width="1120" height="390" viewBox="0 0 1120 390" xmlns="http://www.w3.org/2000/svg">',
  '<title>Rover scanning Aryan Raj GitHub contributions</title>',
  '<defs>',
  '<linearGradient id="field" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#48cae4"/><stop offset=".52" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ff6b35"/></linearGradient>',
  '<linearGradient id="rover" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#172033"/><stop offset="1" stop-color="#0d1117"/></linearGradient>',
  '<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#48cae4"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient>',
  '<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
  '</defs>',
  '<rect width="1120" height="390" rx="12" fill="#050505" stroke="#242424"/>',
  '<path d="M32 76H1088" stroke="#171717"/>',
  '<text x="34" y="36" fill="#f5f5f5" font-family="monospace" font-size="16" font-weight="700">CONTRIBUTION ROVER / MISSION 01</text>',
  '<circle cx="1080" cy="31" r="5" fill="#48cae4" filter="url(#glow)"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle>',
  '<text x="1000" y="53" fill="#48cae4" font-family="monospace" font-size="10">MISSION ACTIVE</text>',
  '<text x="34" y="62" fill="#777" font-family="monospace" font-size="11">ROVER-01 / 52-WEEK CONTRIBUTION TERRAIN / LIVE FROM GITHUB</text>',
  '<g transform="translate(695 18)">',
  '<rect width="120" height="42" rx="5" fill="#0b0e14" stroke="#242424"/><text x="12" y="16" fill="#777" font-family="monospace" font-size="9">ACTIVE DAYS</text><text x="12" y="34" fill="#f5f5f5" font-family="monospace" font-size="16" font-weight="700">' + activeDays + '</text>',
  '<rect x="130" width="120" height="42" rx="5" fill="#0b0e14" stroke="#242424"/><text x="142" y="16" fill="#777" font-family="monospace" font-size="9">PEAK SIGNAL</text><text x="142" y="34" fill="#ff6b35" font-family="monospace" font-size="16" font-weight="700">' + max + '</text>',
  '<rect x="260" width="120" height="42" rx="5" fill="#0b0e14" stroke="#242424"/><text x="272" y="16" fill="#777" font-family="monospace" font-size="9">TARGETS</text><text x="272" y="34" fill="#48cae4" font-family="monospace" font-size="16" font-weight="700">' + hot.length + '</text>',
  '</g>',
  '<g>' + heatmap + '</g>',
  '<rect x="68" y="110" width="2" height="132" fill="url(#field)" filter="url(#glow)"><animate attributeName="x" values="68;1055;68" dur="8s" repeatCount="indefinite"/></rect>',
  '<g>' + pulses + '</g>',
  '<path d="' + roverPath + '" stroke="#1d2939" stroke-width="2" fill="none"/>',
  '<path d="' + roverPath + '" stroke="url(#field)" stroke-width="2" stroke-dasharray="7 15" fill="none"><animate attributeName="stroke-dashoffset" from="0" to="-88" dur="2.4s" repeatCount="indefinite"/></path>',
  rover,
  '<text x="74" y="370" fill="#666" font-family="monospace" font-size="10">QUIET</text>',
  '<rect x="116" y="362" width="13" height="13" rx="3" fill="#111318"/><rect x="137" y="362" width="13" height="13" rx="3" fill="#12303a"/><rect x="158" y="362" width="13" height="13" rx="3" fill="#0e7490"/><rect x="179" y="362" width="13" height="13" rx="3" fill="#06b6d4"/><rect x="200" y="362" width="13" height="13" rx="3" fill="#8b5cf6"/><rect x="221" y="362" width="13" height="13" rx="3" fill="#ff6b35"/>',
  '<text x="244" y="372" fill="#666" font-family="monospace" font-size="10">LOUD</text>',
  '<text x="890" y="372" fill="#777" font-family="monospace" font-size="10">PULSE = HIGH ACTIVITY</text>',
  '</svg>',
].join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, svg, 'utf8');
console.log('Wrote ' + output);
