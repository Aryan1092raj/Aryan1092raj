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
const totalContributions = cells.reduce((sum, item) => sum + item.count, 0);
const hot = cells.filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);

const heatmap = cells.map((item) =>
  '<rect x="' + item.x + '" y="' + item.y + '" width="' + cell + '" height="' + cell + '" rx="3" fill="' + color(item.count) + '"/>'
).join('');

const pulses = hot.map((item, index) => {
  const cx = item.x + cell / 2;
  const cy = item.y + cell / 2;
  const delay = (index * 0.35).toFixed(2);
  return '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="none" stroke="#f7f7f2" opacity="0">' +
    '<animate attributeName="r" values="3;11;3" dur="2.5s" begin="' + delay + 's" repeatCount="indefinite"/>' +
    '<animate attributeName="opacity" values="0;.7;0" dur="2.5s" begin="' + delay + 's" repeatCount="indefinite"/>' +
    '</circle>';
}).join('');

const snakePathParts = ['M ' + (gridX + cell / 2) + ' ' + (gridY + cell / 2)];
for (let row = 0; row < rows; row += 1) {
  const y = gridY + row * (cell + gap) + cell / 2;
  const left = gridX + cell / 2;
  const right = gridX + (52 - 1) * (cell + gap) + cell / 2;
  snakePathParts.push(row % 2 === 0 ? 'H ' + right : 'H ' + left);
  if (row < rows - 1) snakePathParts.push('V ' + (y + cell + gap));
}
const snakePath = snakePathParts.join(' ');

const snakeSegments = Array.from({ length: 16 }, (_, index) => {
  const delay = (index * -0.06).toFixed(2);
  const size = Math.max(5, 11 - Math.floor(index / 5));
  const colorValue = index === 0 ? '#f7f7f2' : index < 4 ? '#a7f3d0' : '#22d3ee';
  return '<rect x="-' + size / 2 + '" y="-' + size / 2 + '" width="' + size + '" height="' + size + '" rx="' + Math.min(3, size / 3) + '" fill="' + colorValue + '" opacity="' + (1 - index * 0.045).toFixed(2) + '" filter="url(#glow)">' +
    '<animateMotion dur="34s" begin="' + delay + 's" repeatCount="indefinite" path="' + snakePath + '" rotate="auto"/>' +
    '</rect>';
}).join('');

const snakeHead = [
  '<g filter="url(#glow)">',
  '<rect x="-6" y="-6" width="12" height="12" rx="4" fill="#f7f7f2" stroke="#22d3ee" stroke-width="2">',
  '<animateMotion dur="34s" repeatCount="indefinite" path="' + snakePath + '" rotate="auto"/>',
  '</rect>',
  '<circle cx="-2" cy="-2" r="1.2" fill="#050505"><animateMotion dur="34s" repeatCount="indefinite" path="' + snakePath + '" rotate="auto"/></circle>',
  '<circle cx="2" cy="-2" r="1.2" fill="#050505"><animateMotion dur="34s" repeatCount="indefinite" path="' + snakePath + '" rotate="auto"/></circle>',
  '</g>',
].join('');

const svg = [
  '<svg width="1120" height="390" viewBox="0 0 1120 390" xmlns="http://www.w3.org/2000/svg">',
  '<title>Animated contribution snake for Aryan Raj</title>',
  '<defs>',
  '<linearGradient id="field" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#22d3ee"/><stop offset=".55" stop-color="#a7f3d0"/><stop offset="1" stop-color="#f97316"/></linearGradient>',
  '<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
  '</defs>',
  '<rect width="1120" height="390" rx="12" fill="#050505" stroke="#242424"/>',
  '<path d="M32 76H1088" stroke="#171717"/>',
  '<text x="34" y="36" fill="#f5f5f2" font-family="monospace" font-size="16" font-weight="700">CONTRIBUTION SNAKE</text>',
  '<circle cx="1080" cy="31" r="5" fill="#a7f3d0" filter="url(#glow)"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle>',
  '<text x="990" y="53" fill="#a7f3d0" font-family="monospace" font-size="10">AUTO-RUNNING</text>',
  '<text x="34" y="62" fill="#777" font-family="monospace" font-size="11">52 WEEKS / 7 DAYS / REAL GITHUB CONTRIBUTIONS</text>',
  '<g transform="translate(630 18)">',
  '<rect width="138" height="42" rx="5" fill="#0b0e14" stroke="#242424"/><text x="12" y="16" fill="#777" font-family="monospace" font-size="9">ACTIVE DAYS</text><text x="12" y="34" fill="#f5f5f2" font-family="monospace" font-size="16" font-weight="700">' + activeDays + '</text>',
  '<rect x="148" width="138" height="42" rx="5" fill="#0b0e14" stroke="#242424"/><text x="160" y="16" fill="#777" font-family="monospace" font-size="9">TOTAL CONTRIBUTIONS</text><text x="160" y="34" fill="#a7f3d0" font-family="monospace" font-size="16" font-weight="700">' + totalContributions + '</text>',
  '<rect x="296" width="138" height="42" rx="5" fill="#0b0e14" stroke="#242424"/><text x="308" y="16" fill="#777" font-family="monospace" font-size="9">BEST DAY</text><text x="308" y="34" fill="#f97316" font-family="monospace" font-size="16" font-weight="700">' + max + '</text>',
  '</g>',
  '<g>' + heatmap + '</g>',
  '<g>' + pulses + '</g>',
  '<path d="' + snakePath + '" stroke="#1b2830" stroke-width="2" fill="none" stroke-dasharray="2 8" opacity=".7"/>',
  '<g>' + snakeSegments + snakeHead + '</g>',
  '<text x="74" y="370" fill="#666" font-family="monospace" font-size="10">QUIET</text>',
  '<rect x="116" y="362" width="13" height="13" rx="3" fill="#111318"/><rect x="137" y="362" width="13" height="13" rx="3" fill="#12303a"/><rect x="158" y="362" width="13" height="13" rx="3" fill="#0e7490"/><rect x="179" y="362" width="13" height="13" rx="3" fill="#06b6d4"/><rect x="200" y="362" width="13" height="13" rx="3" fill="#8b5cf6"/><rect x="221" y="362" width="13" height="13" rx="3" fill="#ff6b35"/>',
  '<text x="244" y="372" fill="#666" font-family="monospace" font-size="10">LOUD</text>',
  '<text x="875" y="372" fill="#777" font-family="monospace" font-size="10">SNAKE FOLLOWS YOUR CONTRIBUTIONS</text>',
  '</svg>',
].join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, svg, 'utf8');
console.log('Wrote ' + output);
