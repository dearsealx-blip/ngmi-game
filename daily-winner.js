
// NGMI Daily Tournament Winner Announcer
// Run this at midnight via cron: 0 0 * * *
// node daily-winner.js

const https = require('https');

const SUPABASE_URL = 'https://rfixnwwzkvkzcfidjzer.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaXhud3d6a3ZremNmaWRqemVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDI4MTYsImV4cCI6MjA4NzgxODgxNn0.PnaFSonJyViAFRmuclgWIcEaoLHltotbbFheMWDzS84';
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

function tgSend(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
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
  // Get yesterday's date (the tournament that just ended)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  console.log(`Fetching daily scores for ${dateStr}...`);

  // Query leaderboard table for today's top scorer
  let winner = null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/scores?order=score.desc&limit=1`;
    const data = await apiGet(url, {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`
    });
    if (Array.isArray(data) && data.length > 0) {
      winner = data[0];
    }
    console.log('Winner:', JSON.stringify(winner));
  } catch(e) {
    console.error('Leaderboard error:', e.message);
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (winner) {
    const name = winner.username || winner.name || winner.telegram_username || `Player #${winner.telegram_id || '???'}`;
    const score = winner.score || '???';
    const wallet = winner.wallet_address || winner.wallet || null;

    // Announce to channel
    const channelMsg =
      `🏆 <b>DAILY TOURNAMENT WINNER</b>\n\n` +
      `📅 ${today}\n\n` +
      `🥇 <b>${name}</b>\n` +
      `💯 Score: <b>${score} pts</b>\n\n` +
      `${wallet ? `💰 Prize wallet: <code>${wallet}</code>\n\n` : ''}` +
      `Think you can beat them? Play now 👇\n` +
      `t.me/NGMI_TON_BOT`;

    const channelResult = await tgSend(NGMI_BOT, CHANNEL, channelMsg);
    console.log('Channel announcement:', channelResult.ok ? 'OK' : JSON.stringify(channelResult));

    // DM Seal
    const sealMsg =
      `🏆 <b>Daily Winner — ${today}</b>\n\n` +
      `Player: <b>${name}</b>\n` +
      `Score: <b>${score} pts</b>\n` +
      `${wallet ? `Wallet: <code>${wallet}</code>\n\n💸 Send 5 TON prize to this address.` : '⚠️ No wallet submitted yet.'}`;

    await tgSend(AGENT_BOT, SEAL_ID, sealMsg);
    console.log('DM to Seal sent');

  } else {
    // No players today
    const noWinnerMsg =
      `📅 <b>Daily Tournament — ${today}</b>\n\n` +
      `No scores recorded today. Be the first to play tomorrow!\n\n` +
      `t.me/NGMI_TON_BOT`;

    await tgSend(NGMI_BOT, CHANNEL, noWinnerMsg);
    await tgSend(AGENT_BOT, SEAL_ID, `📊 Daily tournament ${today}: no scores recorded.`);
    console.log('No winner today, posted accordingly');
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
