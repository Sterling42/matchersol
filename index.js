require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');

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

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

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

bot.onText(/\/holdings (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const address = match[1];

  try {
    const publicKey = new PublicKey(address);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") });

    if (tokenAccounts.value.length === 0) {
      bot.sendMessage(chatId, `No token holdings found for ${address}`);
      return;
    }

    let response = `Token holdings for ${address}:\n`;
    tokenAccounts.value.forEach(account => {
      const tokenAmount = account.account.data.parsed.info.tokenAmount.uiAmount;
      const tokenMint = account.account.data.parsed.info.mint;
      response += `Token Mint: ${tokenMint}, Amount: ${tokenAmount}\n`;
    });

    bot.sendMessage(chatId, response);
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the Solana Telegram Bot! Use /balance <address> to check the balance of a Solana address. Use /holdings <address> to check the token holdings of a Solana address.');
});

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});