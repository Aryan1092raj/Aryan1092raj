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
const cell = 14;
const gap = 4;
const gridX = 74;
const gridY = 94;
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

const heatmap = cells.map((item) =>
  '<rect x="' + item.x + '" y="' + item.y + '" width="' + cell + '" height="' + cell + '" rx="3" fill="' + color(item.count) + '"/>'
).join('');

const hot = cells.filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 12);
const pulses = hot.map((item, index) => {
  const cx = item.x + cell / 2;
  const cy = item.y + cell / 2;
  const delay = (index * 0.35).toFixed(2);
  return '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="none" stroke="#fff" opacity="0">' +
    '<animate attributeName="r" values="4;13;4" dur="2.8s" begin="' + delay + 's" repeatCount="indefinite"/>' +
    '<animate attributeName="opacity" values="0;.8;0" dur="2.8s" begin="' + delay + 's" repeatCount="indefinite"/>' +
    '</circle>';
}).join('');

const orbit = 'M 74 252 C 260 282, 440 224, 610 252 S 946 282, 1048 246';
const svg = [
  '<svg width="1120" height="330" viewBox="0 0 1120 330" xmlns="http://www.w3.org/2000/svg">',
  '<title>Animated GitHub contribution field for ' + username + '</title>',
  '<defs><linearGradient id="field" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#48cae4"/><stop offset=".52" stop-color="#8b5cf6"/><stop offset="1" stop-color="#ff6b35"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>',
  '<rect width="1120" height="330" rx="12" fill="#050505" stroke="#242424"/>',
  '<path d="M32 70H1088" stroke="#171717"/>',
  '<text x="34" y="40" fill="#f5f5f5" font-family="monospace" font-size="16" font-weight="700">CONTRIBUTION FIELD</text>',
  '<text x="34" y="58" fill="#777" font-family="monospace" font-size="11">52 WEEKS / ' + max + ' PEAK SIGNAL / LIVE FROM GITHUB</text>',
  '<text x="1010" y="40" fill="#48cae4" font-family="monospace" font-size="11">ARYAN1092RAJ</text>',
  '<g>' + heatmap + '</g>',
  '<rect x="68" y="88" width="2" height="126" fill="url(#field)" filter="url(#glow)"><animate attributeName="x" values="68;1055;68" dur="8s" repeatCount="indefinite"/></rect>',
  '<g>' + pulses + '</g>',
  '<path d="' + orbit + '" stroke="#1d2939" stroke-width="2" fill="none"/>',
  '<path d="' + orbit + '" stroke="url(#field)" stroke-width="2" stroke-dasharray="7 15" fill="none"><animate attributeName="stroke-dashoffset" from="0" to="-88" dur="2.4s" repeatCount="indefinite"/></path>',
  '<circle r="5" fill="#fff" stroke="#48cae4" stroke-width="3" filter="url(#glow)"><animateMotion dur="8s" repeatCount="indefinite" path="' + orbit + '"/></circle>',
  '<text x="74" y="286" fill="#666" font-family="monospace" font-size="11">QUIET</text>',
  '<rect x="116" y="278" width="14" height="14" rx="3" fill="#111318"/><rect x="138" y="278" width="14" height="14" rx="3" fill="#12303a"/><rect x="160" y="278" width="14" height="14" rx="3" fill="#0e7490"/><rect x="182" y="278" width="14" height="14" rx="3" fill="#06b6d4"/><rect x="204" y="278" width="14" height="14" rx="3" fill="#8b5cf6"/><rect x="226" y="278" width="14" height="14" rx="3" fill="#ff6b35"/>',
  '<text x="250" y="290" fill="#666" font-family="monospace" font-size="11">LOUD</text>',
  '<text x="900" y="290" fill="#777" font-family="monospace" font-size="11">PULSE = HIGH ACTIVITY</text>',
  '</svg>',
].join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, svg, 'utf8');
console.log('Wrote ' + output);

