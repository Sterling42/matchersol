require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const { Connection, PublicKey } = require('@solana/web3.js');
const { TOKENS } = require('./config');

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

const connection = new Connection('https://rpc.shyft.to/?api_key=z_6H7yr5crXP_eHJ', 'confirmed');

bot.onText(/\/balance (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const address = match[1];

  try {
    const publicKey = new PublicKey(address);
    const balanceLamports = await connection.getBalance(publicKey);
    const balanceSOL = balanceLamports / 1e9;

    let balances = `Balance of ${address}:\nSOL: ${balanceSOL} SOL\n`;

    for (const token of TOKENS) {
      if (token.name !== 'SOL') {
        const tokenBalance = await getTokenBalance(publicKey, token.mint);
        balances += `${token.name}: ${tokenBalance} ${token.name}\n`;
      }
    }

    bot.sendMessage(chatId, balances);
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

async function getTokenBalance(publicKey, mintAddress) {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: new PublicKey(mintAddress) });
  if (tokenAccounts.value.length === 0) {
    return 0;
  }
  return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
}