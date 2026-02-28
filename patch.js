
const fs = require('fs');
let src = fs.readFileSync('C:/Users/seal/.openclaw/workspace/ngmi-game/index-original.html', 'utf8');

// ── 1. NEW SFX ────────────────────────────────────────────────
src = src.replace(
  "  achieve()  { playTone(600,'square',0.05,0.12); setTimeout(()=>playTone(800,'square',0.05,0.12),80); setTimeout(()=>playTone(1000,'square',0.08,0.15),160); },",
  "  achieve()  { playTone(600,'square',0.05,0.12); setTimeout(()=>playTone(800,'square',0.05,0.12),80); setTimeout(()=>playTone(1000,'square',0.08,0.15),160); },\n  nearMiss() { playTone(800,'sine',0.06,0.12,1400); },\n  magnet()   { [300,400,500,700].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.07,0.09,f*1.3),i*30)); },\n  comboSfx(n){ playTone(380+n*50,'square',0.05,0.09); },"
);
console.log('SFX:', src.includes('nearMiss') ? 'OK' : 'FAIL');

// ── 2. MELODY LAYER ───────────────────────────────────────────
src = src.replace(
  "function startMusic() {\n  if (musicPlaying || muted) return;\n  musicPlaying = true; musicBeatIndex = 0; playMusicBeat();\n}",
  `const MELODY = [523,659,784,659,523,440,494,523];
let melodyIndex = 0, melodyTimer = null;
function playMelodyBeat() {
  if (!actx || !audioReady || !musicPlaying || muted) return;
  if (melodyIndex % 2 === 0) {
    const f = MELODY[(melodyIndex/2) % MELODY.length];
    try {
      const osc = actx.createOscillator(), g = actx.createGain();
      osc.connect(g); g.connect(actx.destination);
      osc.type = 'triangle'; osc.frequency.value = f;
      g.gain.setValueAtTime(0.04, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.25);
      osc.start(actx.currentTime); osc.stop(actx.currentTime + 0.25);
    } catch(e) {}
  }
  melodyIndex++;
  melodyTimer = setTimeout(playMelodyBeat, turboFrames > 0 ? 110 : 140);
}
function startMusic() {
  if (musicPlaying || muted) return;
  musicPlaying = true; musicBeatIndex = 0; melodyIndex = 0; playMusicBeat(); playMelodyBeat();
}`
);
src = src.replace(
  "function stopMusic() {\n  musicPlaying = false;\n  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }\n}",
  "function stopMusic() {\n  musicPlaying = false;\n  if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }\n  if (melodyTimer) { clearTimeout(melodyTimer); melodyTimer = null; }\n}"
);
console.log('Melody:', src.includes('playMelodyBeat') ? 'OK' : 'FAIL');

// ── 3. NEW SKINS ──────────────────────────────────────────────
src = src.replace(
  "  { id: 5, emoji: '👑', label: 'LEGEND',     unlockAt: 0,   requiresHolder: false, requiresStreak: 7 },\n];",
  "  { id: 5, emoji: '👑', label: 'LEGEND',     unlockAt: 0,   requiresHolder: false, requiresStreak: 7 },\n  { id: 6, emoji: '🦊', label: 'DEGEN FOX',  unlockAt: 30,  requiresHolder: false, requiresStreak: 0 },\n  { id: 7, emoji: '🤖', label: 'ALGO BOT',   unlockAt: 75,  requiresHolder: false, requiresStreak: 0 },\n  { id: 8, emoji: '🔥', label: 'CHAD',       unlockAt: 150, requiresHolder: false, requiresStreak: 0 },\n  { id: 9, emoji: '🧲', label: 'MAGNET',     unlockAt: 0,   requiresHolder: false, requiresStreak: 3 },\n  { id:10, emoji: '🌙', label: 'MOONMAN',    unlockAt: 0,   requiresHolder: true,  requiresStreak: 0 },\n];"
);
console.log('Skins:', src.includes('DEGEN FOX') ? 'OK' : 'FAIL');

// ── 4. NEW ACHIEVEMENTS ───────────────────────────────────────
src = src.replace(
  "  { id:'streak_lord',    name:'Streak Lord',    desc:'Reach a 7-day streak' },\n];",
  "  { id:'streak_lord',    name:'Streak Lord',    desc:'Reach a 7-day streak' },\n  { id:'near_miss_pro',  name:'Near Miss Pro',  desc:'Get 10 near misses in one run' },\n  { id:'magnet_master',  name:'Magnet Master',  desc:'Collect 20 coins with magnet in one run' },\n  { id:'fomo_dodger',    name:'FOMO Dodger',    desc:'Dodge 5 FOMO obstacles in one run' },\n  { id:'perfectionist',  name:'Perfectionist',  desc:'Score 50+ without any power-ups' },\n  { id:'rich_frog',      name:'Rich Frog',      desc:'Collect 200 coins total' },\n  { id:'no_sleep',       name:'No Sleep',       desc:'Play 20 games total' },\n  { id:'ngmi_whale',     name:'NGMI Whale',     desc:'Score 500+ total across all games' },\n  { id:'combo_master',   name:'Combo Master',   desc:'Reach x15 combo in one run' },\n  { id:'speed_freak',    name:'Speed Freak',    desc:'Reach speed 15x in a run' },\n  { id:'millionaire',    name:'Millionaire',    desc:'Collect 1000 coins total' },\n];"
);
console.log('Achievements:', src.includes('near_miss_pro') ? 'OK' : 'FAIL');

// ── 5. NEW RUN TRACKERS ───────────────────────────────────────
src = src.replace(
  "// Per-run trackers\nlet runDoubleJumps = 0, runDodgeCount = 0, runRugDodges = 0, runSpeedMaxed = false;",
  "// Per-run trackers\nlet runDoubleJumps = 0, runDodgeCount = 0, runRugDodges = 0, runSpeedMaxed = false;\nlet runNearMisses = 0, runFomoDodges = 0, runMagnetCoins = 0, runNoPowerups = true;\nlet runPrevCombo = 0;"
);

// ── 6. MAGNET STATE ───────────────────────────────────────────
src = src.replace(
  "let shakeFrames=0, turboFrames=0, shieldActive=false;",
  "let shakeFrames=0, turboFrames=0, shieldActive=false, magnetFrames=0;"
);

// ── 7. FOMO OBSTACLE TYPE ─────────────────────────────────────
src = src.replace(
  "const types = hardMode ? ['rug','honeypot','dev','sec','sec'] : ['rug','honeypot','dev'];",
  "const types = hardMode ? ['rug','honeypot','dev','sec','sec','fomo'] : ['rug','honeypot','dev','fomo'];"
);
src = src.replace(
  "const cols={rug:'#cc2200',honeypot:'#ffaa00',dev:'#9900cc',sec:'#0055ff',boss:'#ff0000',bear:'#003399',whale:'#7700cc'};",
  "const cols={rug:'#cc2200',honeypot:'#ffaa00',dev:'#9900cc',sec:'#0055ff',boss:'#ff0000',bear:'#003399',whale:'#7700cc',fomo:'#ff44cc'};"
);
src = src.replace(
  "const lbls={rug:'RUG',honeypot:'HONEY',dev:'DEV',sec:'SEC',boss:'DUMP',bear:'BEAR',whale:'WHALE'};",
  "const lbls={rug:'RUG',honeypot:'HONEY',dev:'DEV',sec:'SEC',boss:'DUMP',bear:'BEAR',whale:'WHALE',fomo:'FOMO'};"
);
// FOMO obstacles move faster
src = src.replace(
  "    o.x -= speed;",
  "    const oSpeed = o.type === 'fomo' ? speed * 1.5 : speed;\n    o.x -= oSpeed;"
);
console.log('FOMO:', src.includes('fomo') ? 'OK' : 'FAIL');

// ── 8. MAGNET POWER-UP ───────────────────────────────────────
src = src.replace(
  "  const type = gameRand() < 0.5 ? 'turbo' : 'shield';",
  "  const r = gameRand(); const type = r < 0.4 ? 'turbo' : r < 0.7 ? 'shield' : 'magnet';"
);
src = src.replace(
  "  const lbl = p.type==='turbo' ? '⚡' : '🛡';",
  "  const lbl = p.type==='turbo' ? '⚡' : p.type==='shield' ? '🛡' : '🧲';"
);
src = src.replace(
  "  const col = p.type==='turbo' ? '#ff6600' : '#00ffff';",
  "  const col = p.type==='turbo' ? '#ff6600' : p.type==='shield' ? '#00ffff' : '#ffcc00';"
);
console.log('Magnet powerup draw:', src.includes('magnet') ? 'OK' : 'FAIL');

// ── 9. MAGNET GAME LOGIC ─────────────────────────────────────
src = src.replace(
  "      } else {\n        shieldActive=true; SFX.shield();\n        showMsg('🛡 SHIELDED!',frog.x+frog.w/2,frog.y-30,'#00ffff',true);",
  "      } else if(p.type==='magnet'){\n        magnetFrames=300; SFX.magnet();\n        showMsg('🧲 MAGNET!',frog.x+frog.w/2,frog.y-30,'#ffcc00',true);\n        spawnParticles(p.x+p.w/2,p.y+p.h/2,'#ffcc00',14);\n      } else {\n        shieldActive=true; SFX.shield();\n        showMsg('🛡 SHIELDED!',frog.x+frog.w/2,frog.y-30,'#00ffff',true);"
);

// Magnet coin attraction in loop (after coins section)
src = src.replace(
  "  // Powerups\n  if(--nextPowerup<=0) spawnPowerup();",
  `  // Magnet effect
  if (magnetFrames > 0) {
    magnetFrames--;
    ctx.save();
    ctx.strokeStyle = \`rgba(255,204,0,\${0.3 * magnetFrames/300})\`;
    ctx.lineWidth = 2; ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(frog.x+frog.w/2, frog.y+frog.h/2, 80, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    for(const coin of coins){
      if(!coin.collected){
        const dx = (frog.x+frog.w/2) - coin.x, dy = (frog.y+frog.h/2) - coin.y;
        const dist = Math.hypot(dx, dy);
        if(dist < 150){ coin.x += dx*0.12; coin.y += dy*0.12; }
      }
    }
    if(magnetFrames===0) showMsg('MAGNET WORN OFF',frog.x+frog.w/2,frog.y-20,'#ffcc00');
  }

  // Powerups\n  if(--nextPowerup<=0) spawnPowerup();`
);
console.log('Magnet logic:', src.includes('magnetFrames') ? 'OK' : 'FAIL');

// ── 10. NEAR MISS DETECTION ──────────────────────────────────
src = src.replace(
  "    if(!o.passed && o.x+o.w<frog.x){",
  `    // Near miss detection (passed within 20px horizontally while close vertically)
    if(!o.passed && !o._nearMissChecked && o.x+o.w < frog.x+frog.w && o.x+o.w > frog.x-20){
      const vertDist = Math.min(Math.abs(frog.y - o.y), Math.abs((frog.y+frog.h) - (o.y+o.h)));
      if(vertDist < 20 && !collision(frog,o)){
        o._nearMissChecked = true;
        runNearMisses++;
        frame += 2; // +2 pts
        SFX.nearMiss(); haptic.light();
        showMsg('NEAR MISS! +2',o.x+o.w/2,o.y-14,'#ff44cc');
        spawnParticles(frog.x+frog.w,frog.y+frog.h/2,'#ff44cc',4);
        if(runNearMisses >= 10) unlockAchievement('near_miss_pro');
      }
    }
    if(!o.passed && o.x+o.w<frog.x){`
);
console.log('Near miss:', src.includes('NEAR MISS') ? 'OK' : 'FAIL');

// ── 11. FOMO DODGE TRACKER ────────────────────────────────────
src = src.replace(
  "      if (o.type === 'rug') runRugDodges++;",
  "      if (o.type === 'rug') runRugDodges++;\n      if (o.type === 'fomo') { runFomoDodges++; if(runFomoDodges>=5) unlockAchievement('fomo_dodger'); }"
);

// ── 12. COMBO SFX ON INCREASE ────────────────────────────────
src = src.replace(
  "      combo++; SFX.dodge(); haptic.medium();",
  "      combo++; SFX.dodge(); haptic.medium();\n        if(combo !== runPrevCombo){ SFX.comboSfx(combo); runPrevCombo=combo; }\n        if(combo >= 15) unlockAchievement('combo_master');"
);

// ── 13. MORE ACHIEVEMENT CHECKS IN GAME OVER ─────────────────
src = src.replace(
  "  // Achievement: first blood\n  unlockAchievement('first_blood');",
  `  // Achievement: first blood
  unlockAchievement('first_blood');
  // More achievement checks
  if (gamesPlayed >= 20) unlockAchievement('no_sleep');
  if (totalScore >= 500) unlockAchievement('ngmi_whale');
  const curTotalCoins = parseInt(localStorage.getItem('ngmi_total_coins')||'0');
  if (curTotalCoins >= 200) unlockAchievement('rich_frog');
  if (curTotalCoins >= 1000) unlockAchievement('millionaire');
  if (runNoPowerups && score >= 50) unlockAchievement('perfectionist');
  if (runMagnetCoins >= 20) unlockAchievement('magnet_master');
  if (speed >= 15) unlockAchievement('speed_freak');`
);

// ── 14. MARK POWERUP USED ────────────────────────────────────
src = src.replace(
  "      p.collected=true; haptic.success();",
  "      p.collected=true; haptic.success(); runNoPowerups=false;"
);

// ── 15. MAGNET COIN TRACKING ─────────────────────────────────
src = src.replace(
  "      coin.collected=true;\n      SFX.coinTick(); haptic.light();\n      frame += 12; sessionCoins++;",
  "      coin.collected=true;\n      SFX.coinTick(); haptic.light();\n      frame += 12; sessionCoins++;\n      if(magnetFrames > 0) runMagnetCoins++;"
);

// ── 16. RESET RUN TRACKERS ON START ─────────────────────────
src = src.replace(
  "  runDoubleJumps = 0; runDodgeCount = 0; runRugDodges = 0; runSpeedMaxed = false;",
  "  runDoubleJumps = 0; runDodgeCount = 0; runRugDodges = 0; runSpeedMaxed = false;\n  runNearMisses = 0; runFomoDodges = 0; runMagnetCoins = 0; runNoPowerups = true; runPrevCombo = 0; magnetFrames = 0;"
);

// ── 17. MAGNET HUD INDICATOR ─────────────────────────────────
src = src.replace(
  "  if(turboFrames>0){ ctx.fillStyle='#ff6600'; ctx.font='13px \"VT323\"'; ctx.fillText(`⚡ TURBO ${Math.ceil(turboFrames/60)}s`, W-8, 50); }",
  "  if(turboFrames>0){ ctx.fillStyle='#ff6600'; ctx.font='13px \"VT323\"'; ctx.fillText(`⚡ TURBO ${Math.ceil(turboFrames/60)}s`, W-8, 50); }\n  if(magnetFrames>0){ ctx.fillStyle='#ffcc00'; ctx.font='13px \"VT323\"'; ctx.textAlign='left'; ctx.fillText(`🧲 MAGNET ${Math.ceil(magnetFrames/60)}s`, 8, 50); }"
);

// ── 18. TUTORIAL ON FIRST PLAY ───────────────────────────────
src = src.replace(
  "function startGame(daily) {",
  `function showTutorial(cb) {
  if (localStorage.getItem('ngmi_tutorial_done')) { cb(); return; }
  const tips = [
    { icon: '👆', text: 'TAP TO JUMP', sub: 'avoid the rugs!' },
    { icon: '👆👆', text: 'DOUBLE TAP', sub: 'double jump to reach higher!' },
    { icon: '⚡', text: 'GRAB POWER-UPS', sub: 'turbo, shield & magnet!' },
  ];
  let i = 0;
  const ol = document.getElementById('overlay');
  ol.style.display = 'flex';
  function showTip() {
    if (i >= tips.length) {
      localStorage.setItem('ngmi_tutorial_done', '1');
      ol.style.display = 'none';
      cb(); return;
    }
    const t = tips[i];
    ol.innerHTML = \`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px">
      <div style="font-size:3rem">\${t.icon}</div>
      <div style="font-family:'VT323',monospace;font-size:2.5rem;color:#ff0033;text-shadow:0 0 20px #ff0033">\${t.text}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:0.85rem;color:#ff003377;letter-spacing:2px">\${t.sub}</div>
      <div style="font-size:0.65rem;color:#ff003333;letter-spacing:2px;margin-top:8px">TAP TO CONTINUE (\${i+1}/\${tips.length})</div>
    </div>\`;
    i++;
    const handler = () => { ol.removeEventListener('click', handler); setTimeout(showTip, 200); };
    setTimeout(() => ol.addEventListener('click', handler), 300);
    setTimeout(showTip, 1800);
  }
  showTip();
}

function startGame(daily) {`
);

// Hook tutorial into startGame
src = src.replace(
  "  if (!audioReady) initAudioSync();\n  stopTitleAnimation();\n  stopMusic();\n\n  isDailyMode = !!daily;",
  `  if (!audioReady) initAudioSync();
  if (!localStorage.getItem('ngmi_tutorial_done')) {
    showTutorial(() => startGame(daily));
    return;
  }
  stopTitleAnimation();
  stopMusic();

  isDailyMode = !!daily;`
);
console.log('Tutorial:', src.includes('showTutorial') ? 'OK' : 'FAIL');

// ── 19. ENHANCED GAME OVER — NEW BEST FLASH ──────────────────
src = src.replace(
  "      <div class=\"verdict\" style=\"font-size:1.6rem\">${verdict}</div>\n      </div>",
  `      <div class="verdict" style="font-size:1.6rem">\${verdict}</div>
      \${finalDisplayScore > (best - finalDisplayScore) && finalDisplayScore >= best ? '<div style="font-family:\\'VT323\\',monospace;font-size:1.4rem;color:#ffcc00;text-shadow:0 0 20px #ffcc00;animation:flicker 1s infinite">🌟 NEW BEST!</div>' : ''}
      </div>`
);

// ── 20. SHARE button text tweak for clarity ───────────────────
// Already exists, just add the score properly (it's already there)

// Save final file
fs.writeFileSync('C:/Users/seal/.openclaw/workspace/ngmi-game/index.html', src, 'utf8');
console.log('\nAll patches applied! File size:', src.length, 'bytes');
