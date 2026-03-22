<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AryanOS v1.0</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green: #00ff41;
    --green-dim: #00aa2e;
    --green-dark: #003b10;
    --amber: #ffb000;
    --cyan: #00e5ff;
    --red: #ff3b3b;
    --bg: #0a0e0a;
    --scanline: rgba(0,0,0,0.12);
  }

  html, body {
    width: 100%; height: 100%;
    background: #000;
    font-family: 'Share Tech Mono', 'Courier New', monospace;
    overflow: hidden;
  }

  #monitor {
    width: 100%; height: 100vh;
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }

  /* CRT scanlines */
  #monitor::before {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      0deg,
      var(--scanline) 0px,
      var(--scanline) 1px,
      transparent 1px,
      transparent 3px
    );
    pointer-events: none; z-index: 10;
  }

  /* CRT vignette */
  #monitor::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%);
    pointer-events: none; z-index: 11;
  }

  #screen {
    width: 100%; height: 100%;
    padding: 20px 28px 20px 28px;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    position: relative;
    z-index: 1;
  }

  #screen::-webkit-scrollbar { width: 4px; }
  #screen::-webkit-scrollbar-track { background: #000; }
  #screen::-webkit-scrollbar-thumb { background: var(--green-dark); }

  .line {
    color: var(--green);
    font-size: 14px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-all;
    opacity: 0;
    animation: fadein 0.05s forwards;
  }

  @keyframes fadein { to { opacity: 1; } }

  .line.dim    { color: var(--green-dim); }
  .line.bright { color: #80ff90; font-weight: bold; }
  .line.amber  { color: var(--amber); }
  .line.cyan   { color: var(--cyan); }
  .line.red    { color: var(--red); }
  .line.white  { color: #e0e0e0; }
  .line.gap    { line-height: 0.6; }

  #prompt-row {
    display: flex; align-items: center;
    margin-top: 2px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  #prompt-row.visible { opacity: 1; }

  #prompt-label {
    color: var(--cyan);
    font-size: 14px;
    white-space: nowrap;
    font-family: 'Share Tech Mono', monospace;
  }

  #cmd-input {
    background: transparent;
    border: none; outline: none;
    color: var(--green);
    font-size: 14px;
    font-family: 'Share Tech Mono', monospace;
    flex: 1;
    caret-color: var(--green);
    margin-left: 4px;
  }

  #cursor-blink {
    display: inline-block;
    width: 9px; height: 16px;
    background: var(--green);
    vertical-align: middle;
    animation: blink 1s step-end infinite;
    margin-left: 1px;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* Phosphor glow on text */
  .line, #prompt-label, #cmd-input {
    text-shadow: 0 0 4px rgba(0,255,65,0.35);
  }
  .line.amber { text-shadow: 0 0 4px rgba(255,176,0,0.4); }
  .line.cyan  { text-shadow: 0 0 4px rgba(0,229,255,0.4); }
  .line.red   { text-shadow: 0 0 4px rgba(255,59,59,0.5); }

  /* BOOT screen */
  #boot-overlay {
    position: fixed; inset: 0;
    background: #000;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    z-index: 100;
    transition: opacity 0.8s;
  }
  #boot-overlay.fade { opacity: 0; pointer-events: none; }

  #boot-ascii {
    color: var(--green);
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    line-height: 1.3;
    text-align: center;
    text-shadow: 0 0 8px rgba(0,255,65,0.6);
    white-space: pre;
  }

  #boot-bar-wrap {
    margin-top: 24px; width: 340px;
    border: 1px solid var(--green-dim);
    height: 16px; background: #000; position: relative;
  }
  #boot-bar {
    height: 100%; background: var(--green);
    width: 0%; transition: width 0.05s linear;
    box-shadow: 0 0 8px rgba(0,255,65,0.6);
  }
  #boot-pct {
    color: var(--green-dim);
    font-size: 12px;
    font-family: 'Share Tech Mono', monospace;
    margin-top: 8px;
    text-align: center;
  }

  /* matrix rain easter egg */
  #matrix-canvas {
    position: fixed; inset: 0;
    z-index: 50;
    display: none;
  }

  /* glitch effect */
  .glitch {
    animation: glitch 0.15s steps(2) 3;
  }
  @keyframes glitch {
    0%  { transform: translate(-2px, 0) skewX(-0.5deg); filter: brightness(2); }
    33% { transform: translate(2px, 0) skewX(0.5deg); }
    66% { transform: translate(-1px, 0); filter: brightness(1.5); }
    100%{ transform: translate(0); filter: brightness(1); }
  }
</style>
</head>
<body>

<!-- BOOT OVERLAY -->
<div id="boot-overlay">
  <pre id="boot-ascii"></pre>
  <div id="boot-bar-wrap"><div id="boot-bar"></div></div>
  <div id="boot-pct">0%</div>
</div>

<!-- MATRIX CANVAS -->
<canvas id="matrix-canvas"></canvas>

<!-- MAIN TERMINAL -->
<div id="monitor">
  <div id="screen">
    <div id="output"></div>
    <div id="prompt-row">
      <span id="prompt-label">aryan@aryanos:~$&nbsp;</span>
      <input id="cmd-input" type="text" autocomplete="off" autocorrect="off" spellcheck="false" autofocus />
      <span id="cursor-blink"></span>
    </div>
  </div>
</div>

<script>
const ASCII_LOGO = `
  ___   ____  __   __ ___   _  _    ___   ____
 / _ | / __ \\/ /  / // _ | / \\/ |  / _ | / __/
/ __ |/ /_/ / /__/ // __ |/ /\\  | / __ |_\\ \\  
/_/ |_|\\____/____/_//_/ |_/_/  \\_|/_/ |_/___/  
                                                 
          v1.0.0 — AryanOS EE Terminal           
       Built on: IIT Mandi Silicon Architecture  
`;

const BOOT_MSGS = [
  "[  0.001] BIOS v3.14.1 — EE-Chip Detected",
  "[  0.042] Initializing CPU: AryanCore 1.0 @ 3.9GHz",
  "[  0.085] RAM: 64GB DDR5 — All OK",
  "[  0.123] Mounting /dev/brain... done",
  "[  0.201] Loading kernel: linux-5.18-iitmandi",
  "[  0.350] Probing interfaces: C++ Python Bash",
  "[  0.444] Connecting to IIT Mandi academic server...",
  "[  0.512] Codeforces daemon: AryanRaj_1 — ONLINE",
  "[  0.600] LeetCode daemon: Dy9h5fmpvr — ONLINE",
  "[  0.750] Embedded Systems subsystem: READY",
  "[  0.890] Arduino HAL: LOADED",
  "[  1.000] AryanOS fully operational.",
];

const COMMANDS = {
  help: {
    fn: () => [
      { t:"cyan",  v:"╔══════════════════════════════════════╗" },
      { t:"cyan",  v:"║         ARYANOS COMMAND MANUAL        ║" },
      { t:"cyan",  v:"╚══════════════════════════════════════╝" },
      { t:"",      v:"" },
      { t:"amber", v:"  whoami     ", suffix:"— about me" },
      { t:"amber", v:"  skills     ", suffix:"— tech stack & tools" },
      { t:"amber", v:"  cp         ", suffix:"— competitive programming" },
      { t:"amber", v:"  social     ", suffix:"— links & contacts" },
      { t:"amber", v:"  projects   ", suffix:"— what I'm building" },
      { t:"amber", v:"  ls         ", suffix:"— list my directories" },
      { t:"amber", v:"  cat <file> ", suffix:"— read a file (try cat readme.txt)" },
      { t:"amber", v:"  uptime     ", suffix:"— how long I've been running" },
      { t:"amber", v:"  matrix     ", suffix:"— 👀 go deeper" },
      { t:"amber", v:"  clear      ", suffix:"— clear the terminal" },
      { t:"amber", v:"  reboot     ", suffix:"— restart AryanOS" },
      { t:"",      v:"" },
      { t:"dim",   v:"  TIP: use ↑↓ to navigate history" },
    ]
  },
  whoami: {
    fn: () => [
      { t:"cyan",   v:"┌─── PROCESS: aryanraj ─────────────────┐" },
      { t:"white",  v:"│" },
      { t:"bright", v:"│  Aryan Raj" },
      { t:"white",  v:"│  B.Tech Electrical Engineering" },
      { t:"white",  v:"│  Indian Institute of Technology, Mandi" },
      { t:"white",  v:"│  Mandi, Himachal Pradesh, India 🏔" },
      { t:"white",  v:"│" },
      { t:"dim",    v:"│  UID   : 2024EE___" },
      { t:"dim",    v:"│  SHELL : /bin/curiosity" },
      { t:"dim",    v:"│  TERM  : Build.Learn.Iterate.Repeat" },
      { t:"white",  v:"│" },
      { t:"green",  v:"│  → Always blending code, circuits &" },
      { t:"green",  v:"│    logic to turn theory into systems." },
      { t:"white",  v:"│" },
      { t:"cyan",   v:"└────────────────────────────────────────┘" },
    ]
  },
  skills: {
    fn: () => [
      { t:"cyan",   v:"╔═══════════════ SKILLS ════════════════╗" },
      { t:"cyan",   v:"║                                        ║" },
      { t:"amber",  v:"║  LANGUAGES                             ║" },
      { t:"white",  v:"║  C++      ████████████████░░░░  80%    ║" },
      { t:"white",  v:"║  Python   ████████████░░░░░░░░  60%    ║" },
      { t:"white",  v:"║  Bash     ████████░░░░░░░░░░░░  45%    ║" },
      { t:"cyan",   v:"║                                        ║" },
      { t:"amber",  v:"║  TOOLS                                 ║" },
      { t:"white",  v:"║  Git      ████████████░░░░░░░░  65%    ║" },
      { t:"white",  v:"║  Linux    ████████████░░░░░░░░  60%    ║" },
      { t:"white",  v:"║  Arduino  ██████████░░░░░░░░░░  55%    ║" },
      { t:"white",  v:"║  VS Code  ███████████████████░  95%    ║" },
      { t:"cyan",   v:"║                                        ║" },
      { t:"amber",  v:"║  LEARNING NOW                          ║" },
      { t:"white",  v:"║  DSA          [===========........]    ║" },
      { t:"white",  v:"║  Digital Elec [==========.........]    ║" },
      { t:"white",  v:"║  Embedded Sys [=========..........]    ║" },
      { t:"cyan",   v:"╚════════════════════════════════════════╝" },
    ]
  },
  cp: {
    fn: () => [
      { t:"cyan",  v:"┌─── COMPETITIVE PROGRAMMING ──────────┐" },
      { t:"",      v:"" },
      { t:"amber", v:"  ⚡ Codeforces" },
      { t:"white", v:"     Handle  : AryanRaj_1" },
      { t:"white", v:"     Status  : ACTIVE — grinding daily" },
      { t:"cyan",  v:"     URL     : codeforces.com/profile/AryanRaj_1" },
      { t:"",      v:"" },
      { t:"amber", v:"  ⚡ LeetCode" },
      { t:"white", v:"     Handle  : Dy9h5fmpvr" },
      { t:"white", v:"     Status  : ACTIVE — daily problems" },
      { t:"cyan",  v:"     URL     : leetcode.com/u/Dy9h5fmpvr" },
      { t:"",      v:"" },
      { t:"dim",   v:"  [ solving problems every day. no days off. ]" },
      { t:"",      v:"" },
      { t:"cyan",  v:"└──────────────────────────────────────┘" },
    ]
  },
  social: {
    fn: () => [
      { t:"cyan",  v:"┌─── NETWORK INTERFACES ───────────────┐" },
      { t:"",      v:"" },
      { t:"amber", v:"  GitHub   " },
      { t:"white", v:"  → github.com/Aryan1092raj" },
      { t:"",      v:"" },
      { t:"amber", v:"  LinkedIn " },
      { t:"white", v:"  → linkedin.com/in/aryan-raj-072138375" },
      { t:"",      v:"" },
      { t:"amber", v:"  Gmail    " },
      { t:"white", v:"  → aryanraj1092@gmail.com" },
      { t:"",      v:"" },
      { t:"dim",   v:"  All packets welcomed. Response time: ~24h" },
      { t:"",      v:"" },
      { t:"cyan",  v:"└──────────────────────────────────────┘" },
    ]
  },
  projects: {
    fn: () => [
      { t:"cyan",  v:"┌─── /home/aryan/projects ─────────────┐" },
      { t:"",      v:"" },
      { t:"amber", v:"  [*] ACTIVE" },
      { t:"white", v:"  → DSA Practice Repo (C++)" },
      { t:"dim",   v:"    Solving CF + LC problems systematically" },
      { t:"",      v:"" },
      { t:"white", v:"  → Embedded Systems Experiments" },
      { t:"dim",   v:"    Arduino-based hardware projects" },
      { t:"",      v:"" },
      { t:"white", v:"  → Digital Electronics Labs" },
      { t:"dim",   v:"    Logic gates, flip-flops, combinational circuits" },
      { t:"",      v:"" },
      { t:"amber", v:"  [+] UPCOMING" },
      { t:"dim",   v:"  → More to come. Stay tuned." },
      { t:"",      v:"" },
      { t:"cyan",  v:"└──────────────────────────────────────┘" },
    ]
  },
  ls: {
    fn: () => [
      { t:"cyan",  v:"drwxr-xr-x  aryan  skills/" },
      { t:"cyan",  v:"drwxr-xr-x  aryan  projects/" },
      { t:"cyan",  v:"drwxr-xr-x  aryan  competitive_programming/" },
      { t:"cyan",  v:"drwxr-xr-x  aryan  embedded_systems/" },
      { t:"white", v:"-rw-r--r--  aryan  readme.txt" },
      { t:"white", v:"-rw-r--r--  aryan  motivations.txt" },
      { t:"white", v:"-rw-r--r--  aryan  fun_fact.txt" },
      { t:"dim",   v:"-rwx------  aryan  secret.sh" },
    ]
  },
  uptime: {
    fn: () => {
      const now = new Date();
      const started = new Date('2024-08-01');
      const diff = Math.floor((now - started) / 1000);
      const days = Math.floor(diff / 86400);
      const hrs  = Math.floor((diff % 86400) / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      return [
        { t:"cyan",  v:"System uptime:" },
        { t:"bright",v:`  ${days}d ${hrs}h ${mins}m — learning non-stop since IIT Mandi admission` },
        { t:"dim",   v:"  Load avg: high  |  Motivation: 99.9%  |  Sleep: optional" },
      ];
    }
  },
  clear: { fn: () => "CLEAR" },
  reboot: { fn: () => "REBOOT" },
  matrix: { fn: () => "MATRIX" },
};

const CAT_FILES = {
  "readme.txt": [
    { t:"bright", v:"╔══════ readme.txt ══════════════════════╗" },
    { t:"white",  v:"║                                        ║" },
    { t:"white",  v:"║  Hi. I'm Aryan Raj.                    ║" },
    { t:"white",  v:"║  1st year EE at IIT Mandi.             ║" },
    { t:"white",  v:"║                                        ║" },
    { t:"white",  v:"║  I write code. I solder circuits.      ║" },
    { t:"white",  v:"║  I debug both.                         ║" },
    { t:"white",  v:"║                                        ║" },
    { t:"white",  v:"║  Theory is great. Working systems      ║" },
    { t:"white",  v:"║  are better. I build both.             ║" },
    { t:"white",  v:"║                                        ║" },
    { t:"cyan",   v:"╚════════════════════════════════════════╝" },
  ],
  "motivations.txt": [
    { t:"amber", v:"  > Why EE?" },
    { t:"white", v:"    Because electricity runs everything." },
    { t:"white", v:"    And I want to understand everything." },
    { t:"",      v:"" },
    { t:"amber", v:"  > Why code?" },
    { t:"white", v:"    It's the fastest way to test an idea." },
    { t:"white", v:"    Build → run → fail → fix → repeat." },
    { t:"",      v:"" },
    { t:"amber", v:"  > Why competitive programming?" },
    { t:"white", v:"    Sharpens thinking. Builds problem-solving reflexes." },
    { t:"white", v:"    The struggle IS the point." },
  ],
  "fun_fact.txt": [
    { t:"amber", v:"  Running fun_fact()..." },
    { t:"",      v:"" },
    { t:"bright",v:"  \"Always blending code, circuits & logic" },
    { t:"bright",v:"   to turn theory into working systems ⚡\"" },
    { t:"",      v:"" },
    { t:"dim",   v:"  class AryanRaj { string motto = \"Build.Learn.Iterate.Repeat.\"; }" },
  ],
};

// ── Boot sequence ──────────────────────────────────────────────────────────
const bootEl  = document.getElementById('boot-overlay');
const asciiEl = document.getElementById('boot-ascii');
const barEl   = document.getElementById('boot-bar');
const pctEl   = document.getElementById('boot-pct');

asciiEl.textContent = ASCII_LOGO;

let pct = 0;
const bootInterval = setInterval(() => {
  pct += Math.random() * 4 + 1;
  if (pct >= 100) { pct = 100; clearInterval(bootInterval); }
  barEl.style.width = pct + '%';
  pctEl.textContent = Math.floor(pct) + '%';
}, 60);

let msgIdx = 0;
function showBootMsg() {
  if (msgIdx < BOOT_MSGS.length) {
    const p = document.createElement('div');
    p.style.cssText = "color:#00aa2e;font-size:12px;font-family:'Share Tech Mono',monospace;margin-top:3px;";
    p.textContent = BOOT_MSGS[msgIdx++];
    asciiEl.after(p);
    setTimeout(showBootMsg, 90);
  } else {
    setTimeout(() => {
      bootEl.classList.add('fade');
      setTimeout(() => { bootEl.remove(); startTerminal(); }, 800);
    }, 600);
  }
}
setTimeout(showBootMsg, 600);

// ── Terminal engine ────────────────────────────────────────────────────────
const output = document.getElementById('output');
const promptRow = document.getElementById('prompt-row');
const cmdInput  = document.getElementById('cmd-input');
let cmdHistory = [], histIdx = -1;

function addLine(text, cls = '', delay = 0) {
  return new Promise(res => {
    setTimeout(() => {
      const d = document.createElement('div');
      d.className = 'line' + (cls ? ' ' + cls : '');
      d.textContent = text;
      output.appendChild(d);
      scrollBottom();
      res();
    }, delay);
  });
}

function scrollBottom() {
  const s = document.getElementById('screen');
  s.scrollTop = s.scrollHeight;
}

function addPromptLine(cmd) {
  const d = document.createElement('div');
  d.className = 'line cyan';
  d.textContent = 'aryan@aryanos:~$ ' + cmd;
  output.appendChild(d);
}

async function renderRows(rows) {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const cls = r.t || '';
    let text = r.v || '';
    if (r.suffix) {
      await addLine(text + r.suffix, cls, i * 18);
    } else {
      await addLine(text, cls, i * 18);
    }
  }
  await new Promise(res => setTimeout(res, rows.length * 18 + 50));
}

async function runCommand(raw) {
  const cmd = raw.trim().toLowerCase();
  const parts = cmd.split(' ');
  const base = parts[0];

  addPromptLine(raw);

  if (!cmd) { scrollBottom(); return; }

  if (cmdHistory[0] !== raw) cmdHistory.unshift(raw);
  histIdx = -1;

  if (base === 'clear') {
    output.innerHTML = '';
    return;
  }

  if (base === 'reboot') {
    await addLine('Rebooting AryanOS...', 'dim');
    await addLine('', '');
    setTimeout(() => location.reload(), 1200);
    return;
  }

  if (base === 'matrix') {
    await addLine('Entering the Matrix... type anything to exit.', 'amber');
    startMatrix();
    return;
  }

  if (base === 'cat') {
    const fname = parts[1];
    if (!fname) {
      await addLine('Usage: cat <file>', 'red');
      await addLine('Try: cat readme.txt', 'dim');
    } else if (CAT_FILES[fname]) {
      await renderRows(CAT_FILES[fname]);
    } else if (fname === 'secret.sh') {
      await addLine('Permission denied. (Nice try though)', 'red');
      await addLine('...okay fine: aryan@aryanos:~$ sudo ./secret.sh', 'dim');
      await addLine('ERROR: sudo requires motivation > 9000. You have: 8999.', 'dim');
    } else {
      await addLine(`cat: ${fname}: No such file or directory`, 'red');
    }
    return;
  }

  if (COMMANDS[base]) {
    const result = COMMANDS[base].fn();
    if (typeof result === 'string') return; // handled above
    await renderRows(result);
    return;
  }

  // Unknown command
  await addLine(`command not found: ${cmd}`, 'red');
  await addLine(`Type 'help' for available commands.`, 'dim');
}

async function startTerminal() {
  promptRow.classList.add('visible');
  await new Promise(res => setTimeout(res, 200));

  const welcome = [
    { t:"bright", v:"╔══════════════════════════════════════════╗" },
    { t:"bright", v:"║          WELCOME TO ARYANOS v1.0          ║" },
    { t:"bright", v:"║    Electrical Engineering @ IIT Mandi     ║" },
    { t:"bright", v:"╚══════════════════════════════════════════╝" },
    { t:"",       v:"" },
    { t:"dim",    v:"  Last login: today, IIT Mandi, HP, India" },
    { t:"dim",    v:"  Kernel   : AryanOS 1.0 (C++ / Python / Linux)" },
    { t:"dim",    v:"  Uptime   : since August 2024" },
    { t:"",       v:"" },
    { t:"amber",  v:"  Type 'help' to see all commands." },
    { t:"",       v:"" },
  ];
  await renderRows(welcome);
  cmdInput.focus();
}

cmdInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const val = cmdInput.value;
    cmdInput.value = '';
    promptRow.style.opacity = '0';
    await runCommand(val);
    promptRow.style.opacity = '1';
    cmdInput.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx < cmdHistory.length - 1) {
      histIdx++;
      cmdInput.value = cmdHistory[histIdx];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx > 0) {
      histIdx--;
      cmdInput.value = cmdHistory[histIdx];
    } else { histIdx = -1; cmdInput.value = ''; }
  }
});

document.getElementById('monitor').addEventListener('click', () => cmdInput.focus());

// ── Matrix rain ────────────────────────────────────────────────────────────
function startMatrix() {
  const canvas = document.getElementById('matrix-canvas');
  canvas.style.display = 'block';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const cols = Math.floor(canvas.width / 18);
  const drops = Array(cols).fill(1);
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01ABCDEFX#$@!IITMANDI⚡';

  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = '16px Share Tech Mono, monospace';
    for (let i = 0; i < drops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * 18, drops[i] * 18);
      if (drops[i] * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  const raf = setInterval(draw, 50);

  function stopMatrix() {
    clearInterval(raf);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
    canvas.removeEventListener('click', stopMatrix);
    document.removeEventListener('keydown', stopMatrix);
  }
  setTimeout(() => {
    canvas.addEventListener('click', stopMatrix);
    document.addEventListener('keydown', stopMatrix);
  }, 300);
}
</script>
</body>
</html>
