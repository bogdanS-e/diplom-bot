import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import fs from 'node:fs';
import http from 'http';
import https from 'https';

import 'dotenv/config';

import DB from './mongo/database';
import handleStartFlow from './startFlow';
import { IBudget, IUser } from './types';
import { getAllBudgets } from './budgetsFlow';

const app = express();
const port = 5000;

var privateKey = fs.readFileSync('key.pem', 'utf8');
var certificate = fs.readFileSync('cert.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };
app.set('view engine', 'ejs');

app.get('/budgets', async (req, res) => {
  const { chatId } = req.query;

  if (req.get('host') !== process.env.CURRENT_HOST || !chatId) {
    res.status(401);

    return;
  }

  const db = await DB.getInstance();
  const user = await db.collection('users').findOne<IUser>({ chatId: +chatId });
  const budgets = await db.collection('budgets').find<IBudget>({ users: user?.email }, { projection: { _id: 0 } }).toArray();

  res.render('budgets', { budgets });
});

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(port);
httpsServer.listen(443, () => {
  console.log(`App run on https://${process.env.CURRENT_HOST}`)
});

const token = '6244331493:AAGG-iCddpzHwXgZuZxwp6mxK8CZosxjYcc';

const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
  { command: '/budgets', description: 'receive a list of all your budgets' },
]);

bot.on('message', async ({ chat, text }) => {
  const db = await DB.getInstance();
  const chatId = chat.id;

  let user = await db.collection('users').findOne<IUser>({ chatId });

  if (text?.startsWith('/start')) {
    const response = await handleStartFlow(user, chatId, text);
    bot.sendMessage(chatId, response);

    return;
  }

  if (text?.startsWith('/budgets')) {
    getAllBudgets(user, bot, chatId);

    return
  }

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});
