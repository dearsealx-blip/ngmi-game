// NGMI Tournament Bot
// Commands: /startournament /endtournament /tournament
// Handles Stars payment, score tracking, winner announcement

const https = require('https');

const NGMI_BOT = '8733328088:AAE2CMtfiAL5RHU1jE6uUNnP7-tJ4h6pLAE';
const AGENT_BOT = '8548781901:AAHagzikMuTd9bfSYKjvPNWyHRHGdwFdT7E';
const SEAL_ID = 6446442088;
const CHANNEL = '@NGMI_Ton';
const ENTRY_STARS = 5;
const DURATION_HOURS = 6;
const SUPABASE_URL = 'https://rfixnwwzkvkzcfidjzer.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaXhud3d6a3ZremNmaWRqemVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI0MjgxNiwiZXhwIjoyMDg3ODE4ODE2fQ.bCZJ9FXK8l2T-PikhWIL7tBUjAsV70SPgHhtACJkOl0';

function sb(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(SUPABASE_URL + path, {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } }); });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
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

function tgCall(token, method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(data); req.end();
  });
}

async function getActiveTournament() {
  const rows = await sb('/rest/v1/tournaments?status=eq.active&limit=1');
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function startTournament() {
  const existing = await getActiveTournament();
  if (existing) return { error: 'Tournament already running! End it first with /endtournament' };

  const endsAt = new Date(Date.now() + DURATION_HOURS * 3600 * 1000).toISOString();
  const rows = await sb('/rest/v1/tournaments', 'POST', {
    status: 'active',
    ends_at: endsAt,
    entry_stars: ENTRY_STARS,
    total_stars: 0
  });
  const t = Array.isArray(rows) ? rows[0] : rows;

  // Announce to channel
  await tgSend(NGMI_BOT, CHANNEL,
    `🏆 <b>TOURNAMENT STARTED!</b>\n\n` +
    `⏱ Duration: <b>${DURATION_HOURS} hours</b>\n` +
    `💫 Entry: <b>${ENTRY_STARS} Stars</b>\n` +
    `🥇 Prize: <b>90% of star pool</b>\n\n` +
    `Top score when timer ends wins!\n\n` +
    `👉 Enter now → t.me/NGMI_TON_BOT`
  );

  return { ok: true, tournament: t, ends_at: endsAt };
}

async function endTournament() {
  const t = await getActiveTournament();
  if (!t) return { error: 'No active tournament' };

  // Get winner
  const entries = await sb(`/rest/v1/tournament_entries?tournament_id=eq.${t.id}&order=score.desc&limit=1`);
  const winner = Array.isArray(entries) && entries.length ? entries[0] : null;
  const totalStars = t.total_stars || 0;
  const prizePct = Math.floor(totalStars * 0.9);

  // Mark ended
  await sb(`/rest/v1/tournaments?id=eq.${t.id}`, 'PATCH', {
    status: 'ended',
    winner_username: winner?.username || null,
    winner_tg_id: winner?.tg_id || null,
    winner_score: winner?.score || 0
  });

  if (winner) {
    // Announce to channel
    await tgSend(NGMI_BOT, CHANNEL,
      `🏆 <b>TOURNAMENT OVER!</b>\n\n` +
      `🥇 Winner: <b>${winner.username}</b>\n` +
      `💯 Score: <b>${winner.score} pts</b>\n` +
      `💫 Prize: <b>${prizePct} Stars (90% of pool)</b>\n\n` +
      `GGs! Next tournament coming soon 👀\n\nt.me/NGMI_TON_BOT`
    );

    // DM winner asking for wallet
    if (winner.tg_id) {
      await tgSend(NGMI_BOT, winner.tg_id,
        `🏆 <b>You won the NGMI Tournament!</b>\n\n` +
        `Score: <b>${winner.score} pts</b>\n` +
        `Prize: <b>${prizePct} Stars</b>\n\n` +
        `Reply with your <b>TON wallet</b> to receive your prize (we convert Stars → TON).`
      );
    }

    // Notify Seal
    await tgSend(AGENT_BOT, SEAL_ID,
      `🏆 <b>Tournament ended!</b>\n\n` +
      `Winner: <b>${winner.username}</b>\n` +
      `Score: <b>${winner.score} pts</b>\n` +
      `Total stars collected: <b>${totalStars}</b>\n` +
      `Prize (90%): <b>${prizePct} Stars</b>\n` +
      `House (10%): <b>${totalStars - prizePct} Stars</b>\n\n` +
      `DM sent to winner asking for wallet. Forward prize when received.`
    );
  } else {
    await tgSend(NGMI_BOT, CHANNEL, `Tournament ended with no entries. Better luck next time! 🐸`);
    await tgSend(AGENT_BOT, SEAL_ID, `Tournament ended — no entries.`);
  }

  return { ok: true, winner, totalStars, prizePct };
}

async function handleUpdate(update) {
  const msg = update.message || update.channel_post;
  if (!msg) return;

  const text = (msg.text || '').trim();
  const fromId = msg.from?.id;
  const chatId = msg.chat.id;

  // ── Admin commands (Seal only) ──
  if (fromId === SEAL_ID || chatId === SEAL_ID) {
    if (text === '/startournament' || text === '/starttournament') {
      const r = await startTournament();
      if (r.error) {
        await tgSend(AGENT_BOT, SEAL_ID, `❌ ${r.error}`);
      } else {
        const ends = new Date(r.ends_at).toLocaleTimeString('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' });
        await tgSend(AGENT_BOT, SEAL_ID, `✅ Tournament started! Ends at ${ends} Amsterdam time.\nID: ${r.tournament.id}`);
      }
      return;
    }
    if (text === '/endtournament') {
      const r = await endTournament();
      if (r.error) {
        await tgSend(AGENT_BOT, SEAL_ID, `❌ ${r.error}`);
      } else {
        await tgSend(AGENT_BOT, SEAL_ID, `✅ Tournament ended. Winner: ${r.winner?.username || 'none'}`);
      }
      return;
    }
    if (text === '/tournament') {
      const t = await getActiveTournament();
      if (!t) {
        await tgSend(AGENT_BOT, SEAL_ID, `No active tournament. Send /startournament to begin.`);
      } else {
        const entries = await sb(`/rest/v1/tournament_entries?tournament_id=eq.${t.id}&order=score.desc&limit=5`);
        const top = Array.isArray(entries) ? entries.map((e,i)=>`${i+1}. ${e.username} — ${e.score} pts`).join('\n') : 'none';
        const endsIn = Math.max(0, Math.floor((new Date(t.ends_at) - Date.now()) / 60000));
        await tgSend(AGENT_BOT, SEAL_ID,
          `🏆 <b>Active Tournament</b>\n\nEnds in: <b>${endsIn} min</b>\nStars collected: <b>${t.total_stars}</b>\nEntries: <b>${Array.isArray(entries) ? entries.length : 0}</b>\n\nTop scores:\n${top}`
        );
      }
      return;
    }
  }

  // ── Pre-checkout query (approve Stars payment) ──
  if (update.pre_checkout_query) {
    await tgCall(NGMI_BOT, 'answerPreCheckoutQuery', {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true
    });
    return;
  }

  // ── Successful Stars payment ──
  if (msg.successful_payment) {
    const payment = msg.successful_payment;
    const tgId = String(fromId);
    const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
    const paymentId = payment.telegram_payment_charge_id;

    const t = await getActiveTournament();
    if (!t) {
      await tgSend(NGMI_BOT, chatId, `⚠️ No active tournament right now. Your Stars will be refunded by Telegram.`);
      return;
    }

    // Check if already entered
    const existing = await sb(`/rest/v1/tournament_entries?tournament_id=eq.${t.id}&tg_id=eq.${tgId}&limit=1`);
    if (Array.isArray(existing) && existing.length > 0) {
      await tgSend(NGMI_BOT, chatId, `You're already entered! Play your best game 🐸`);
      return;
    }

    // Register entry
    await sb('/rest/v1/tournament_entries', 'POST', {
      tournament_id: t.id,
      username,
      tg_id: tgId,
      score: 0,
      payment_id: paymentId
    });

    // Add stars to pool
    await sb(`/rest/v1/tournaments?id=eq.${t.id}`, 'PATCH', {
      total_stars: (t.total_stars || 0) + ENTRY_STARS
    });

    const endsIn = Math.max(0, Math.floor((new Date(t.ends_at) - Date.now()) / 60000));
    await tgSend(NGMI_BOT, chatId,
      `✅ <b>You're in the tournament!</b>\n\n` +
      `⏱ ${endsIn} minutes left\n` +
      `🎯 Play your best score — top score wins!\n\n` +
      `👉 Open the game and play now: t.me/NGMI_TON_BOT/play`
    );
    return;
  }

  // ── /enter command — send Stars invoice ──
  if (text === '/enter' || text === '/join') {
    const t = await getActiveTournament();
    if (!t) {
      await tgSend(NGMI_BOT, chatId, `No tournament running right now. Follow @NGMI_Ton for announcements! 🐸`);
      return;
    }
    const endsIn = Math.max(0, Math.floor((new Date(t.ends_at) - Date.now()) / 60000));
    await tgCall(NGMI_BOT, 'sendInvoice', {
      chat_id: chatId,
      title: '🏆 NGMI Tournament Entry',
      description: `Join the tournament! ${endsIn} minutes left. Top score wins 90% of the Star pool.`,
      payload: `tournament_${t.id}`,
      currency: 'XTR',
      prices: [{ label: 'Tournament Entry', amount: ENTRY_STARS }],
      provider_token: ''
    });
    return;
  }

  // ── Wallet reply from winner ──
  const TON_WALLET_RE = /[UE]Q[A-Za-z0-9_-]{46}/;
  const wallet = text.match(TON_WALLET_RE)?.[0];
  if (wallet) {
    const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
    await tgSend(NGMI_BOT, chatId, `✅ Wallet received! Prize will be sent within 24h. Thanks for playing! 🐸`);
    await tgSend(AGENT_BOT, SEAL_ID,
      `💰 <b>Tournament Prize Claim</b>\n\nPlayer: <b>${username}</b>\nWallet: <code>${wallet}</code>\n\n💸 Send prize Stars → TON equivalent.`
    );
  }
}

// ── Long polling loop ──
let offset = 0;
async function poll() {
  try {
    const r = await tgCall(NGMI_BOT, 'getUpdates', { offset, limit: 50, timeout: 25, allowed_updates: ['message', 'pre_checkout_query'] });
    if (r.ok && r.result.length) {
      for (const u of r.result) {
        offset = u.update_id + 1;
        handleUpdate(u).catch(e => console.error('Update error:', e.message));
      }
    }
  } catch(e) { console.error('Poll error:', e.message); }
  setTimeout(poll, 500);
}

console.log('🏆 NGMI Tournament bot starting...');
poll();
