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
  if (!count) return '#0a0f1d';
  const ratio = count / max;
  if (ratio < 0.2) return '#152442';
  if (ratio < 0.4) return '#274b86';
  if (ratio < 0.65) return '#5038a8';
  if (ratio < 0.85) return '#9754d6';
  return '#ff8a4c';
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
  const delay = (index * 0.42).toFixed(2);
  return '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="none" stroke="#f7f7f2" opacity="0">' +
    '<animate attributeName="r" values="3;10;3" dur="3.1s" begin="' + delay + 's" repeatCount="indefinite"/>' +
    '<animate attributeName="opacity" values="0;.55;0" dur="3.1s" begin="' + delay + 's" repeatCount="indefinite"/>' +
    '</circle>';
}).join('');

const peaks = [];
for (let col = 0; col < weeks.length; col += 1) {
  const column = cells.filter((item) => item.x === gridX + col * (cell + gap));
  const peak = column.reduce((best, item) => item.count > best.count ? item : best, column[0]);
  peaks.push({ x: peak.x + cell / 2, y: peak.y + cell / 2 });
}
const activityPath = peaks.map((point, index) => (index === 0 ? 'M ' : ' L ') + point.x + ' ' + point.y).join('');
const activityPulse = [
  '<circle r="5" fill="#f7f7ff" filter="url(#glow)">',
  '<animateMotion dur="16s" repeatCount="indefinite" path="' + activityPath + '" rotate="auto"/>',
  '</circle>',
  '<circle r="13" fill="none" stroke="#8b7cff" stroke-width="1" opacity=".5">',
  '<animateMotion dur="16s" repeatCount="indefinite" path="' + activityPath + '" rotate="auto"/>',
  '<animate attributeName="r" values="7;15;7" dur="1.4s" repeatCount="indefinite"/>',
  '</circle>',
].join('');

const stars = Array.from({ length: 72 }, (_, index) => {
  const x = (index * 157) % 1110 + 5;
  const y = (index * 83) % 346 + 7;
  const radius = index % 9 === 0 ? 1.5 : index % 3 === 0 ? 1 : 0.6;
  const opacity = (0.18 + (index % 6) * 0.08).toFixed(2);
  const twinkle = index % 4 === 0
    ? '<animate attributeName="opacity" values="' + opacity + ';.8;' + opacity + '" dur="' + (2.4 + index % 4) + 's" repeatCount="indefinite"/>'
    : '';
  return '<circle cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="#dce7ff" opacity="' + opacity + '">' + twinkle + '</circle>';
}).join('');

const orbit = 'M 882 248 A 76 26 0 1 1 1034 248 A 76 26 0 1 1 882 248';
const spaceScene = [
  '<ellipse cx="958" cy="248" rx="76" ry="26" fill="none" stroke="#3d2d72" stroke-width="1" stroke-dasharray="2 7" opacity=".8"/>',
  '<ellipse cx="958" cy="248" rx="58" ry="18" fill="none" stroke="#8b5cf6" stroke-width="1" opacity=".3"><animateTransform attributeName="transform" type="rotate" from="0 958 248" to="360 958 248" dur="12s" repeatCount="indefinite"/></ellipse>',
  '<circle cx="958" cy="248" r="24" fill="#030308" stroke="#161326" stroke-width="7"/>',
  '<circle cx="958" cy="248" r="30" fill="none" stroke="#ff8a4c" stroke-width="2" opacity=".8"><animate attributeName="stroke-dashoffset" from="0" to="-80" dur="3s" repeatCount="indefinite"/></circle>',
  '<circle cx="958" cy="248" r="34" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="17 33" opacity=".55"><animateTransform attributeName="transform" type="rotate" from="0 958 248" to="360 958 248" dur="7s" repeatCount="indefinite"/></circle>',
  '<circle r="4" fill="#f7f7ff" filter="url(#glow)"><animateMotion dur="8s" repeatCount="indefinite" path="' + orbit + '"/></circle>',
  '<text x="928" y="294" fill="#847e9f" font-family="monospace" font-size="9">BLACK HOLE</text>',
].join('');

const svg = [
  '<svg width="1120" height="360" viewBox="0 0 1120 360" xmlns="http://www.w3.org/2000/svg">',
  '<title>Contribution cosmos for Aryan Raj</title>',
  '<defs>',
  '<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
  '</defs>',
  '<rect width="1120" height="360" rx="12" fill="#05050a" stroke="#24243a"/>',
  '<g>' + stars + '</g>',
  '<path d="M32 76H1088" stroke="#17172b"/>',
  '<text x="34" y="36" fill="#f5f5ff" font-family="monospace" font-size="16" font-weight="700">CONTRIBUTION COSMOS</text>',
  '<text x="34" y="59" fill="#77738d" font-family="monospace" font-size="11">LAST 52 WEEKS / UPDATED DAILY</text>',
  '<g transform="translate(650 18)">',
  '<rect width="135" height="42" rx="5" fill="#0b0b15" stroke="#24243a"/><text x="12" y="16" fill="#77738d" font-family="monospace" font-size="9">ACTIVE DAYS</text><text x="12" y="34" fill="#f5f5ff" font-family="monospace" font-size="16" font-weight="700">' + activeDays + '</text>',
  '<rect x="145" width="135" height="42" rx="5" fill="#0b0b15" stroke="#24243a"/><text x="157" y="16" fill="#77738d" font-family="monospace" font-size="9">CONTRIBUTIONS</text><text x="157" y="34" fill="#a78bfa" font-family="monospace" font-size="16" font-weight="700">' + totalContributions + '</text>',
  '<rect x="290" width="135" height="42" rx="5" fill="#0b0b15" stroke="#24243a"/><text x="302" y="16" fill="#77738d" font-family="monospace" font-size="9">BUSIEST DAY</text><text x="302" y="34" fill="#ff8a4c" font-family="monospace" font-size="16" font-weight="700">' + max + '</text>',
  '</g>',
  '<g>' + heatmap + '</g>',
  '<g>' + pulses + '</g>',
  '<path d="' + activityPath + '" stroke="#8b5cf6" stroke-width="1.2" fill="none" opacity=".22"/>',
  '<path d="' + activityPath + '" stroke="#f7f7ff" stroke-width="1.4" fill="none" stroke-dasharray="1 18" opacity=".65"><animate attributeName="stroke-dashoffset" from="0" to="-76" dur="2.8s" repeatCount="indefinite"/></path>',
  '<g>' + activityPulse + '</g>',
  '<g>' + spaceScene + '</g>',
  '<text x="74" y="274" fill="#a78bfa" font-family="monospace" font-size="10">ACTIVITY ORBIT</text>',
  '<text x="74" y="291" fill="#77738d" font-family="monospace" font-size="10">THE PULSE FOLLOWS THE BUSIEST DAY OF EACH WEEK</text>',
  '<text x="74" y="330" fill="#66627a" font-family="monospace" font-size="10">QUIET</text>',
  '<rect x="116" y="322" width="13" height="13" rx="3" fill="#0a0f1d"/><rect x="137" y="322" width="13" height="13" rx="3" fill="#152442"/><rect x="158" y="322" width="13" height="13" rx="3" fill="#274b86"/><rect x="179" y="322" width="13" height="13" rx="3" fill="#5038a8"/><rect x="200" y="322" width="13" height="13" rx="3" fill="#9754d6"/><rect x="221" y="322" width="13" height="13" rx="3" fill="#ff8a4c"/>',
  '<text x="244" y="332" fill="#66627a" font-family="monospace" font-size="10">LOUD</text>',
  '<text x="824" y="332" fill="#77738d" font-family="monospace" font-size="10">REAL CONTRIBUTION DATA</text>',
  '</svg>',
].join('\n');

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, svg, 'utf8');
console.log('Wrote ' + output);
