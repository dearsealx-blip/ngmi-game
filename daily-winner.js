// NGMI Daily Tournament Winner Announcer
// Run at midnight via cron: 0 0 * * *
// Flow: find winner → DM winner asking for wallet → polling cron forwards wallet to Seal

const https = require('https');

const SUPABASE_URL = 'https://rfixnwwzkvkzcfidjzer.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaXhud3d6a3ZremNmaWRqemVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI0MjgxNiwiZXhwIjoyMDg3ODE4ODE2fQ.bCZJ9FXK8l2T-PikhWIL7tBUjAsV70SPgHhtACJkOl0';
const NGMI_BOT = '8733328088:AAE2CMtfiAL5RHU1jE6uUNnP7-tJ4h6pLAE';
const AGENT_BOT = '8548781901:AAHagzikMuTd9bfSYKjvPNWyHRHGdwFdT7E';
const SEAL_ID = 6446442088;
const CHANNEL = '@NGMI_Ton';

function apiGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET', headers }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.on('error', reject); req.end();
  });
}

function tgSend(token, chatId, text, extra = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function main() {
  const today = new Date().toISOString().split('T')[0]; // e.g. 2026-03-01
  const displayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  console.log(`Fetching daily scores for ${today}...`);

  // Get top scorer from daily_scores table for today
  let winner = null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/daily_scores?date=eq.${today}&order=score.desc&limit=1&select=username,score,tg_id`;
    const data = await apiGet(url, {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    });
    if (Array.isArray(data) && data.length > 0) winner = data[0];
    console.log('Winner:', JSON.stringify(winner));
  } catch(e) {
    console.error('Leaderboard error:', e.message);
  }

  if (winner) {
    const name = winner.username || 'Unknown';
    const score = winner.score || 0;
    const tgId = winner.tg_id;

    // 1. Announce winner to channel (no wallet shown publicly)
    await tgSend(NGMI_BOT, CHANNEL,
      `🏆 <b>DAILY WINNER — ${displayDate}</b>\n\n` +
      `🥇 <b>${name}</b>\n` +
      `💯 <b>${score} pts</b>\n\n` +
      `🎯 They've been contacted to claim their <b>5 TON</b> prize!\n\n` +
      `Think you can beat them? 👇\nt.me/NGMI_TON_BOT`
    );
    console.log('Channel announced');

    // 2. DM winner directly asking for their wallet (if we have their tg_id)
    if (tgId) {
      await tgSend(NGMI_BOT, tgId,
        `🏆 <b>Congratulations ${name}!</b>\n\n` +
        `You won today's NGMI daily challenge with <b>${score} pts</b>!\n\n` +
        `💰 Prize: <b>5 TON</b>\n\n` +
        `Reply to this message with your <b>TON wallet address</b> (UQ... or EQ...) to claim your prize.\n\n` +
        `Example: <code>UQC...your wallet here</code>`
      );
      console.log(`DM sent to winner (tg_id: ${tgId})`);

      // 3. Notify Seal that winner was contacted
      await tgSend(AGENT_BOT, SEAL_ID,
        `🏆 <b>NGMI Daily Winner — ${displayDate}</b>\n\n` +
        `Player: <b>${name}</b>\n` +
        `Score: <b>${score} pts</b>\n` +
        `Telegram ID: <code>${tgId}</code>\n\n` +
        `✅ DM sent asking for wallet. You'll get notified when they reply.`
      );
    } else {
      // No tg_id stored — alert Seal to handle manually
      await tgSend(AGENT_BOT, SEAL_ID,
        `🏆 <b>NGMI Daily Winner — ${displayDate}</b>\n\n` +
        `Player: <b>${name}</b>\n` +
        `Score: <b>${score} pts</b>\n\n` +
        `⚠️ No Telegram ID stored for this player — they weren't playing via the Mini App, or played before tg_id tracking was added.\n` +
        `Check Supabase daily_scores manually.`
      );
    }

  } else {
    // No scores today
    await tgSend(NGMI_BOT, CHANNEL,
      `📅 <b>Daily Tournament — ${displayDate}</b>\n\nNo scores today. Be the first to play!\n\nt.me/NGMI_TON_BOT`
    );
    await tgSend(AGENT_BOT, SEAL_ID, `📊 NGMI daily ${displayDate}: no scores recorded.`);
    console.log('No winner today');
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
