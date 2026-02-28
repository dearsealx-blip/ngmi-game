# NGMI Game — Batch 2 Feature Brief
# Queue after batch 1 (12 features) is committed

## DESIGN RULES (CRITICAL)
- Every new obstacle flashes a WARNING 1 second before appearing (use showMsg with red/yellow color)
- Bosses always have a 3-second warning
- Nothing should feel cheap or unfair — telegraph everything
- Keep game easy and fun, difficulty comes from speed not from cheap obstacles
- New obstacles should be EASIER or SAME difficulty as existing ones

---

## NEW BOSSES

### Boss: Elon Whale 🐋
- Triggers at score 200 (between bear boss at 150 and whale boss at 300)
- Warning: "⚠ ELON JUST TWEETED..." 3 seconds before
- Effect: for 4 seconds, small "tweet" obstacles rain from the TOP of the screen (not ground level)
- They fall at y=0 and drift down — player must dodge by timing jumps
- After 4 seconds, Elon leaves, game returns to normal
- Score bonus: +25 if you survive Elon's tweet storm
- Variable: `elonSpawned = false`, `elonWarned = false`, `elonRainFrames = 0`
- During elonRainFrames: every 30 frames spawn a small falling obstacle {x: random W*0.3 to W*0.7, y: 0, vy: 2, w:20, h:20, type:'tweet', falling:true}
- Draw falling tweets as small red/white rectangles with "🐦" label
- Collision with falling tweets: same as regular obstacle (game over or shield destroys)

### Boss: CZ Slowdown 😶
- Triggers at score 250
- Warning: "⚠ CZ IS SELLING..." 3 seconds before  
- Effect: speed drops to 1.0 (from whatever current speed is) for 5 seconds — feels like walking through mud
- Show "📉 CZ DUMP" HUD label during slowdown
- After 5 seconds: speed snaps back, +20 score bonus, show "CZ LEFT THE CHAT ✓"
- Variable: `czSpawned = false`, `czWarned = false`, `czSlowFrames = 0`, `czOldSpeed = 0`
- During czSlowFrames: override speed = 1.0 + (current raw calc * 0.3) — still grows slowly
- Reset in startGame

### Boss: Scam Bot 🤖
- Triggers at score 350 (after whale boss)
- Warning: "⚠ SCAM BOT DETECTED" in purple
- Spawns 5 fake coins that LOOK like real coins but are colored red/dark
- Fake coins have `fake: true` flag
- If player collects fake coin: -10 pts and flash "SCAMMED! -10" in red
- If player avoids all 5 fake coins: +15 bonus "SCAM AVOIDED!"
- After 8 seconds scam bot leaves
- Variable: `scamBotSpawned = false`, `scamBotWarned = false`, `scamRainFrames = 0`
- Fake coins push to coins array with fake:true, rendered in #ff2222 color
- In coin collection: if c.fake → deduct points, show scam message, don't add to sessionCoins

---

## NEW OBSTACLES

### Obstacle: Liquidation Wave 🌊
- Type: 'liquidation'
- A wide, low-height obstacle (w:60, h:16) that sweeps across at ground level
- Very easy to jump over — gives plenty of warning
- Warning: showMsg("🌊 LIQUIDATION WAVE!", ...) 1 second before it appears
- Draw as a blue/cyan wave shape
- Spawn randomly mixed in with regular obstacles at score >= 30
- Add to spawnObstacle types array: hardMode ? [...existing, 'liquidation'] : [...existing, 'liquidation']
- In drawObstacle: add case for 'liquidation' — draw as cyan rectangle with wave pattern

### Obstacle: Paper Hands 📄
- Type: 'paperhands'  
- Starts at w:40, h:50 when spawned
- Shrinks by 0.5px per frame as it approaches — at frog's x position it's only w:20, h:25
- Update: `o.w = Math.max(20, o.origW - (W - o.x) * 0.1)` — shrinks as it gets closer
- Fun mechanic: looks scary but gets easier
- Warning: "📄 PAPER HANDS INCOMING" 1 second before
- Draw as white/grey rectangle getting smaller
- Spawn at score >= 50

### Obstacle: Red Candle Cluster 🕯️
- Type: 'candlecluster'
- Spawns 3 candle-like obstacles in a row, spaced 35px apart
- Not instadeath — medium height (h:35)
- Creates a rhythm jump challenge
- spawnCandleCluster() function: push 3 obstacles with x = W+20, W+55, W+90
- Warning: "🕯️ CANDLE PATTERN!" before cluster
- Draw same as existing rug/honeypot but red color
- Spawn at score >= 60

### Obstacle: Twitter Thread 🐦
- Type: 'thread'
- WIDE but SHORT obstacle (w:55, h:20) — forces player to jump OVER a wide low bar
- Easy to clear, looks dramatic
- Warning: "🐦 TWITTER THREAD INCOMING" in blue
- Draw as a blue wide bar with small bird icon
- Spawn at score >= 20

---

## SOCIAL FEATURES

### Live Rival Ghost 👤
- After daily challenge game over, record your input sequence to localStorage (array of frame numbers when jump occurred)
- Key: `ngmi_daily_ghost_${date}` = JSON array of frame numbers
- On next play of daily challenge: load yesterday's ghost, replay their jumps
- Draw ghost frog: translucent white/blue frog at 40% opacity, slightly behind real frog
- Ghost doesn't affect gameplay — visual only
- Show "👤 RIVAL GHOST" HUD label when ghost is active
- Ghost runs on its own physics simulation (separate y, vy, jumpCount variables)
- If ghost dies (hits a position where an obstacle would be... actually just simulate the ghost running for as many frames as their recorded score lasted)
- Ghost disappears when it "would have died" (after N frames equal to their score * 6)

### Clan Challenge Banner
- In showClanModal(): if player is in a clan, show a "THIS WEEK'S CHALLENGE" section
- Display: clan's total_score for the week, progress bar toward a target (e.g. 10,000 total clan pts)
- Target is hardcoded at 10,000 for MVP
- Progress bar: filled portion = clan total_score / 10000
- Show "CHALLENGE COMPLETE! 🏆" if >= 10,000
- Show "X PTS TO GO" if not yet

### One-tap Share After Great Run
- After game over, if score >= 50: show a "[ 📣 SHARE TO GROUP ]" button
- On click: opens Telegram share with pre-filled text: "I scored {score} pts on $NGMI Chart Surfer! Can you beat me? 🐸 @NGMI_TON_BOT"
- Use: `tg?.switchInlineQuery(...)` or `tg?.openTelegramLink('https://t.me/share/url?...')`

---

## AFTER ALL CHANGES:
1. git add -A
2. git commit -m "feat: new bosses (elon/cz/scambot), new obstacles (wave/paperhands/cluster/thread), social (ghost/clan challenge/share)"
3. git push
4. Send Telegram message to 6446442088 via bot token 8548781901:AAHagzikMuTd9bfSYKjvPNWyHRHGdwFdT7E:
   "✅ Batch 2 done! Elon/CZ/ScamBot bosses, 4 new obstacles, ghost rival, clan challenge, share button — all pushed!"
