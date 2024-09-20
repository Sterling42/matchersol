require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const { Connection, PublicKey } = require('@solana/web3.js');

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.WEBHOOK_URL;
const port = process.env.PORT || 3000;

if (!token || !url) {
  console.error('Error: TELEGRAM_BOT_TOKEN and WEBHOOK_URL must be set in the environment variables.');
  process.exit(1);
}

const bot = new TelegramBot(token);
bot.setWebHook(`${url}/bot${token}`);

const app = express();
app.use(bodyParser.json());

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=87f73015-922d-4549-8eea-3253f7635385', 'confirmed');

bot.onText(/\/balance (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const address = match[1];

  try {
    const publicKey = new PublicKey(address);
    const solBalance = await connection.getBalance(publicKey);
    const balanceSOL = solBalance / 1e9; // Convert lamports to SOL
    const response = `Balance of ${address}:\nSOL: ${balanceSOL} SOL`;

    bot.sendMessage(chatId, response);
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the Solana Telegram Bot! Use /balance <address> to check the balance of a Solana address.');
});

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});