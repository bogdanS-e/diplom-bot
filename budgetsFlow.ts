import TelegramBot from "node-telegram-bot-api";
import DB from "./mongo/database";
import { IBudget, IUser } from "./types";
import BotContext, { Menu } from "./botContext";
import { ObjectId } from "mongodb";

const getAllBudgets = async (user: IUser | null, chatId: number) => {
  const context = new BotContext();
  const bot = BotContext.bot;

  if (!user) {
    bot.sendMessage(chatId, `<b>We didn't found your user</b>. Please, go to our app to link with telegram:\n<a href='${process.env.WEB_APP_URL}'>${process.env.WEB_APP_URL}</a>`, { parse_mode: 'HTML' });

    return;
  }

  const db = await DB.getInstance();
  const budgets = await db.collection('budgets').find<IBudget>({ users: user.email }, { projection: { _id: 0 } }).toArray();

  let response = '';

  budgets.forEach(({ name, availableAmount, amount, users }) => {
    response += `📖 <b>Name: "${name}"</b>\n💸 Total amount: <code>${amount}</code>\n💰 Available to spend: <code>${availableAmount}</code>\n👤 Visible by: ${users.map((user) => user)} \n\n`;
  });

  const keyboard = budgets.map((budget) => ([{ text: budget.name }]));

  keyboard.push([{text: Menu.main}]);
  bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
  context.setMenu(Menu.viewBudgets, chatId, keyboard);
};

const getSpecificBudget = async (user: IUser | null, budgetName: string = '', chatId: number) => {
  const bot = BotContext.bot;

  if (!user) {
    bot.sendMessage(chatId, `<b>We didn't found your user</b>. Please, go to our app to link with telegram:\n<a href='${process.env.WEB_APP_URL}'>${process.env.WEB_APP_URL}</a>`, { parse_mode: 'HTML' });

    return;
  }

  const db = await DB.getInstance();
  const budget = await db.collection('budgets').findOne<IBudget & { _id: ObjectId }>({ users: user.email, name: budgetName });

  if (!budget) {
    bot.sendMessage(chatId, 'Error bot didn\'t found requested budget', { parse_mode: 'HTML' });

    return;
  }

  const {
    name,
    amount,
    availableAmount,
    users,
    _id,
    categories,
  } = budget;

  const categoryLength = categories.length;
  const categoriesString = categories.map((category, i) => `        ${category.name} <code>${category.amount}</code> ${i + 1 === categoryLength ? '' : '\n'}`).join('');
  const usersString = users.map((user) => user).join('');

  bot.sendMessage(
    chatId,
    `📖 <b>Name: "${name}"</b>\n💸 Total amount: <code>${amount}</code>\n💰 Available to spend: <code>${availableAmount}</code>\n👤 Visible by: ${usersString}\n💬 Categories:\n${categoriesString} \n🔑 ID: ${_id.toString()} \n\n`,
    { parse_mode: 'HTML' }
  );
}

export {
  getAllBudgets,
  getSpecificBudget
};