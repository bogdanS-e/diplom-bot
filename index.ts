import express from 'express';
import fs from 'node:fs';
import http from 'http';
import https from 'https';

import 'dotenv/config';

import DB from './mongo/database';
import handleStartFlow from './startFlow';
import { IBudget, IUser, TCategoryName, allCategories } from './types';
import { getAllBudgets, getBudgetHistory, getSpecificBudget, shareBudget, spendMoney, spendMoneyOnCategory } from './budgetsFlow';
import BotContext, { Menu } from './botContext';
import { handleAnalytics } from './analytic';

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

const bot = BotContext.bot;

bot.setMyCommands([
  { command: '/start', description: 'lounch the bot' },
]);

bot.on('message', async ({ chat, text }) => {
  const db = await DB.getInstance();
  const chatId = chat.id;
  const context = BotContext.getInstance();
  const menu = context.getMenu(chatId);

  let user = await db.collection('users').findOne<IUser>({ chatId });

  if (text === Menu.main) {
    context.setMenu({
      name: Menu.main,
      chatId
    });

    return;
  }

  if (text?.startsWith('/start')) {
    handleStartFlow(user, chatId, text);

    return;
  }

  if (text?.startsWith('/chart')) {
    handleAnalytics(chatId);

    return;
  }

  if (text?.startsWith(Menu.viewBudgets)) {
    getAllBudgets(user, chatId);

    return
  }

  if (text === Menu.viewBudgetHistory) {
    getBudgetHistory(user, chatId);

    return;
  }

  if (text === Menu.spendMoney) {
    if (menu?.name === Menu.viewSpecificBudget) {
      spendMoney(user, chatId);

      return;
    }

    if (menu?.name === Menu.main) {
      await getAllBudgets(user, chatId, true);
      context.setMenu({ name: Menu.spendMoneyChoose, chatId })
      return;
    }
  }

  if (text === Menu.shareBudgetEnterEmails) {
    context.setMenu({
      name: Menu.shareBudgetEnterEmails,
      chatId,
    });

    return;
  }

  if (text === Menu.editData) {
    context.setMenu({
      name: Menu.editData,
      chatId,
    });

    return;
  }

  const clearText = text?.replace(/[^\x00-\x7F]/g, '').trim();

  if (clearText && menu?.payload?.budgetId && allCategories.includes(clearText as TCategoryName)) {
    context.setMenu({
      name: Menu.spendMoneyOnCategory,
      chatId,
      payload: {
        budgetId: menu?.payload?.budgetId,
        categoryName: clearText as TCategoryName,
      }
    });
    return;
  }

  if (menu?.name === Menu.shareBudgetEnterEmails) {
    const emails = text?.split(' ')!;
    const regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

    emails?.forEach((email) => {
      if (!regex.test(email)) {
        bot.sendMessage(
          chatId,
          `<code>${email}</code> is not a valid email.\nPlease add only valid emails`,
          { parse_mode: 'HTML' }
        );
        return;
      }
    });

    shareBudget(user, chatId, emails);
    return;
  }

  if (menu?.name === Menu.spendMoneyOnCategory) {
    const amount = parseInt(text || '');
    spendMoneyOnCategory(user, chatId, amount);
    return;
  }

  if (menu?.name === Menu.spendMoneyChoose) {
    await getSpecificBudget(user, text, chatId, true);
    spendMoney(user, chatId);
    return;
  }

  if (menu?.name === Menu.viewBudgets) {
    getSpecificBudget(user, text, chatId);
    return;
  }

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
}); 
