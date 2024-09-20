// server.js
const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./telegramBot');

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});