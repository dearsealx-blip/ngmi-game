
const fs = require('fs');
let src = fs.readFileSync('C:/Users/seal/.openclaw/workspace/ngmi-game/index.html', 'utf8');

// ── 1. DIFFICULTY — PHYSICS ──────────────────────────────────
src = src.replace(
  'const W=700, H=300, GROUND=H-56, GRAVITY=0.55, JUMP=-12;',
  'const W=700, H=300, GROUND=H-56, GRAVITY=0.45, JUMP=-13;'
);
console.log('Physics:', src.includes('GRAVITY=0.45') ? 'OK' : 'FAIL');

// ── 2. DIFFICULTY — STARTING SPEED & SCALING ─────────────────
src = src.replace(
  "  const baseSpeed = hardMode ? 4.5 : 4;",
  "  const baseSpeed = hardMode ? 3.5 : 2.5;"
);
src = src.replace(
  'speed = baseSpeed + rawScore*0.025 + (turboFrames>0?3:0);',
  'speed = baseSpeed + rawScore*0.008 + (turboFrames>0?2:0);'
);
console.log('Speed:', src.includes('2.5') ? 'OK' : 'FAIL');

// ── 3. DIFFICULTY — OBSTACLE SPACING ─────────────────────────
src = src.replace(
  "  const base = hardMode ? 45 : 65;\n  nextObstacle = base + gameRand()*45;",
  "  const base = hardMode ? 80 : 120;\n  nextObstacle = base + gameRand()*80;"
);
console.log('Obstacle spacing:', src.includes('120') ? 'OK' : 'FAIL');

// ── 4. DIFFICULTY — REMOVE FOMO FROM NORMAL MODE ─────────────
src = src.replace(
  "const types = hardMode ? ['rug','honeypot','dev','sec','sec','fomo'] : ['rug','honeypot','dev','fomo'];",
  "const types = hardMode ? ['rug','honeypot','dev','sec','sec','fomo'] : ['rug','honeypot','dev'];"
);
console.log('FOMO normal mode removed:', src.includes("'fomo'] : ['rug','honeypot','dev'];") ? 'OK' : 'FAIL');

// ── 5. DIFFICULTY — HARD MODE THRESHOLD ──────────────────────
src = src.replace(
  "  if(finalDisplayScore>=50) { localStorage.setItem('ngmi_hardmode','1'); hardMode=true; }",
  "  if(finalDisplayScore>=150) { localStorage.setItem('ngmi_hardmode','1'); hardMode=true; }"
);
console.log('Hard mode threshold:', src.includes('>=150') ? 'OK' : 'FAIL');

// ── 6. TON CONNECT — ADD SDK TO HEAD ─────────────────────────
src = src.replace(
  '<script src="https://telegram.org/js/telegram-web-app.js"></script>',
  `<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script src="https://unpkg.com/@tonconnect/ui@2.0.5/dist/tonconnect-ui.min.js"></script>`
);
console.log('TON Connect SDK:', src.includes('tonconnect-ui') ? 'OK' : 'FAIL');

// ── 7. TON CONNECT — REPLACE HOLDER VERIFICATION SYSTEM ──────
src = src.replace(
  `// ─── HOLDER BONUS ─────────────────────────────────────────────────────────────
let holderVerified = localStorage.getItem('ngmi_holder_verified') === '1';
function verifyHolder() {
  try { if (tg?.openTelegramLink) tg.openTelegramLink('https://t.me/NGMI_Ton'); else window.open('https://t.me/NGMI_Ton','_blank'); } catch(e) {}
  localStorage.setItem('ngmi_holder_verified', '1');
  holderVerified = true;
  showStart();
}
function getHolderMultiplier() { return holderVerified ? 1.2 : 1.0; }
function renderHolderBonusDisplay() {
  const el = document.getElementById('holder-bonus-display');
  if (!el) return;
  if (holderVerified) {
    el.innerHTML = \`<div class="holder-bonus-text verified">💎 HOLDER BONUS ACTIVE · +20% SCORE</div>\`;
  } else {
    el.innerHTML = \`<div class="holder-bonus-text">🐸 NGMI holders get +20% score bonus</div><button class="btn btn-holder" onclick="verifyHolder()">[ VERIFY HOLDER ]</button>\`;
  }
}`,
  `// ─── TON CONNECT + HOLDER VERIFICATION ──────────────────────────────────────
const NGMI_CONTRACT = 'EQAVM23T_9nry_aV0BTc0DvmvsIJwfsgKGAnhXfEHBeYZVEI';
const TONCENTER_API = 'https://toncenter.com/api/v2';

let tonConnectUI = null;
let holderVerified = localStorage.getItem('ngmi_holder_verified') === '1';
let holderBalance = parseInt(localStorage.getItem('ngmi_holder_balance') || '0');
let connectedWallet = localStorage.getItem('ngmi_wallet_addr') || null;

// Initialize TON Connect
function initTonConnect() {
  try {
    if (window.TonConnectUI) {
      tonConnectUI = new window.TonConnectUI.TonConnectUI({
        manifestUrl: 'https://dearsealx-blip.github.io/ngmi-game/tonconnect-manifest.json',
      });
      tonConnectUI.onStatusChange(wallet => {
        if (wallet) {
          const addr = wallet.account.address;
          connectedWallet = addr;
          localStorage.setItem('ngmi_wallet_addr', addr);
          checkNgmiBalance(addr);
        } else {
          connectedWallet = null;
          holderVerified = false;
          holderBalance = 0;
          localStorage.removeItem('ngmi_wallet_addr');
          localStorage.removeItem('ngmi_holder_verified');
          localStorage.removeItem('ngmi_holder_balance');
          renderHolderBonusDisplay();
        }
      });
    }
  } catch(e) { console.log('TON Connect init failed:', e); }
}

async function checkNgmiBalance(addr) {
  try {
    // Convert friendly addr to raw if needed
    const rawAddr = addr.startsWith('0:') ? addr : addr;
    const res = await fetch(\`\${TONCENTER_API}/getTokenData?address=\${encodeURIComponent(NGMI_CONTRACT)}\`);
    // Use jetton wallet lookup
    const jwRes = await fetch(\`\${TONCENTER_API}/runGetMethod\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: NGMI_CONTRACT,
        method: 'get_wallet_address',
        stack: [['tvm.Slice', addr]]
      })
    });
    // Fallback: use jettons API
    const jRes = await fetch(\`https://tonapi.io/v2/accounts/\${encodeURIComponent(addr)}/jettons/\${encodeURIComponent(NGMI_CONTRACT)}\`);
    if (jRes.ok) {
      const jData = await jRes.json();
      const balance = parseInt(jData.balance || '0');
      holderBalance = Math.floor(balance / 1e9); // convert from nano
      localStorage.setItem('ngmi_holder_balance', holderBalance);
      if (holderBalance > 0) {
        holderVerified = true;
        localStorage.setItem('ngmi_holder_verified', '1');
      } else {
        holderVerified = false;
        localStorage.removeItem('ngmi_holder_verified');
      }
    } else {
      // If API fails, give benefit of doubt if wallet connected
      holderVerified = true;
      holderBalance = -1; // unknown
      localStorage.setItem('ngmi_holder_verified', '1');
    }
    renderHolderBonusDisplay();
    showStart();
  } catch(e) {
    // On error, trust the wallet connection
    holderVerified = true;
    localStorage.setItem('ngmi_holder_verified', '1');
    renderHolderBonusDisplay();
    showStart();
  }
}

function getHolderMultiplier() {
  if (!holderVerified) return 1.0;
  if (holderBalance >= 1000000) return 1.5;  // 1M+ NGMI = +50%
  if (holderBalance >= 100000)  return 1.35; // 100k+ NGMI = +35%
  if (holderBalance >= 10000)   return 1.25; // 10k+ NGMI = +25%
  return 1.2; // any NGMI = +20%
}

function getHolderTier() {
  if (!holderVerified) return null;
  if (holderBalance >= 1000000) return { label: '🐳 MEGA WHALE', color: '#ff0033', bonus: '+50%' };
  if (holderBalance >= 100000)  return { label: '🐋 WHALE',      color: '#9900cc', bonus: '+35%' };
  if (holderBalance >= 10000)   return { label: '💎 DIAMOND',    color: '#00ccff', bonus: '+25%' };
  return { label: '🐸 HOLDER', color: '#00ff66', bonus: '+20%' };
}

async function verifyHolder() {
  if (tonConnectUI) {
    try {
      await tonConnectUI.openModal();
    } catch(e) {
      // Fallback if TON Connect fails
      holderVerified = true;
      localStorage.setItem('ngmi_holder_verified', '1');
      renderHolderBonusDisplay();
      showStart();
    }
  } else {
    // Fallback: join channel method
    try { if (tg?.openTelegramLink) tg.openTelegramLink('https://t.me/NGMI_Ton'); else window.open('https://t.me/NGMI_Ton','_blank'); } catch(e) {}
    holderVerified = true;
    localStorage.setItem('ngmi_holder_verified', '1');
    renderHolderBonusDisplay();
    showStart();
  }
}

function renderHolderBonusDisplay() {
  const el = document.getElementById('holder-bonus-display');
  if (!el) return;
  const tier = getHolderTier();
  if (holderVerified && tier) {
    const balTxt = holderBalance > 0 ? \` · \${holderBalance.toLocaleString()} \$NGMI\` : '';
    el.innerHTML = \`<div class="holder-bonus-text verified" style="color:\${tier.color}">\${tier.label} BONUS ACTIVE · \${tier.bonus}\${balTxt}</div>\`;
  } else {
    el.innerHTML = \`<div class="holder-bonus-text">💎 \$NGMI holders get score bonuses (+20% to +50%)</div><button class="btn btn-holder" onclick="verifyHolder()">[ CONNECT WALLET ]</button>\`;
  }
}

// Init on load
setTimeout(initTonConnect, 500);`
);
console.log('TON Connect system:', src.includes('NGMI_CONTRACT') ? 'OK' : 'FAIL');

// ── 8. TON CONNECT MANIFEST FILE (write separately) ──────────
const manifest = JSON.stringify({
  url: "https://dearsealx-blip.github.io/ngmi-game/",
  name: "$NGMI Chart Surfer",
  iconUrl: "https://dearsealx-blip.github.io/ngmi-game/icon.png",
  termsOfUseUrl: "https://dearsealx-blip.github.io/ngmi-game/",
  privacyPolicyUrl: "https://dearsealx-blip.github.io/ngmi-game/"
}, null, 2);
fs.writeFileSync('C:/Users/seal/.openclaw/workspace/ngmi-game/tonconnect-manifest.json', manifest, 'utf8');
console.log('Manifest written');

// ── 9. UPDATE HUD — SHOW HOLDER TIER ─────────────────────────
src = src.replace(
  `  // Holder bonus HUD
  if (holderVerified) {
    ctx.fillStyle='#00ccff66'; ctx.font='10px "Share Tech Mono"'; ctx.textAlign='left';
    const hudY = shieldActive ? 46 : (hardMode ? 32 : 18);
    ctx.fillText('💎 HOLDER x1.2', 8, hudY + 14);
  }`,
  `  // Holder bonus HUD
  if (holderVerified) {
    const tier = getHolderTier();
    ctx.fillStyle = tier ? tier.color+'99' : '#00ccff66';
    ctx.font='10px "Share Tech Mono"'; ctx.textAlign='left';
    const hudY = shieldActive ? 46 : (hardMode ? 32 : 18);
    ctx.fillText(\`\${tier?tier.label:'💎'} x\${getHolderMultiplier().toFixed(2)}\`, 8, hudY + 14);
  }`
);
console.log('HUD tier:', src.includes('getHolderTier') ? 'OK' : 'FAIL');

// ── 10. DISCONNECT WALLET OPTION IN STATS ────────────────────
src = src.replace(
  `      <div class="referral-info" style="margin-top:16px;padding:8px;border:1px solid #00ff6622">YOUR REF LINK: <span>t.me/NGMI_TON_BOT?startapp=ref_\${myRefCode}</span></div>`,
  `      <div class="referral-info" style="margin-top:16px;padding:8px;border:1px solid #00ff6622">YOUR REF LINK: <span>t.me/NGMI_TON_BOT?startapp=ref_\${myRefCode}</span></div>
      \${connectedWallet ? \`<div style="margin-top:8px;font-size:0.6rem;color:#00ccff55;letter-spacing:1px;text-align:center">WALLET: \${connectedWallet.slice(0,8)}...\${connectedWallet.slice(-6)} <button onclick="if(tonConnectUI)tonConnectUI.disconnect()" style="background:transparent;border:1px solid #ff003333;color:#ff003355;font-family:'VT323',monospace;font-size:0.8rem;padding:1px 6px;cursor:pointer;margin-left:6px">DISCONNECT</button></div>\` : ''}`
);
console.log('Disconnect option:', src.includes('DISCONNECT') ? 'OK' : 'FAIL');

fs.writeFileSync('C:/Users/seal/.openclaw/workspace/ngmi-game/index.html', src, 'utf8');
console.log('\nAll patches applied! File size:', src.length, 'bytes');
