require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.WEBHOOK_URL; // Your public URL
const port = process.env.PORT || 3000;

const bot = new TelegramBot(token);
bot.setWebHook(`${url}/bot${token}`);

const app = express();
app.use(bodyParser.json());

// Solana connection setup
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

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

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});