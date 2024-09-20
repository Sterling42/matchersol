require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your bot's token
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Solana connection setup
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

// Set up webhook
const webhookUrl = process.env.WEBHOOK_URL;
bot.setWebHook(`${webhookUrl}/bot${token}`);

// Handle incoming updates
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'POST') {
    const body = await request.json();
    bot.processUpdate(body);
    return new Response('OK');
  }
  return new Response('Not Found', { status: 404 });
}

// Command to get the balance of a Solana address
bot.onText(/\/balance (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const address = match[1];

  try {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    bot.sendMessage(chatId, `Balance of ${address}: ${balance} lamports`);
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the Solana Telegram Bot! Use /balance <address> to check the balance of a Solana address.');
});