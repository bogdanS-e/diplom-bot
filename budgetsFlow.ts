import DB from "./mongo/database";
import { IBudget, IIncrementCategory, IShareBudgetRequest, IUser, TCategoryName } from "./types";
import BotContext, { Menu } from "./botContext";
import { ObjectId } from "mongodb";
//@ts-ignore
import fetch from 'node-fetch';
import moment from "moment";

const getCategoryIcon = (category: TCategoryName) => {
  switch (category) {
    case 'Transportation':
      return '🚘';
    case 'Bills':
      return '💵';
    case 'Entertainment':
      return '🔥';
    case 'Food':
      return '🍕';
    case 'Housing':
      return '🏠';
    case 'Medical & Healthcare':
      return '💊';
    case 'Personal Spending':
      return '🧍‍♂️';
    default:
      return '🎲';
  }
}

const getAllBudgets = async (user: IUser | null, chatId: number, isSpend = false) => {
  const context = BotContext.getInstance();
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

  keyboard.push([{ text: Menu.main }]);
  bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
  context.setMenu({
    name: Menu.viewBudgets,
    chatId,
    keyboard,
    message: isSpend ? 'Choose the budget:' : 'Choose specific budget to see detailed information:',
  });
};

const getSpecificBudget = async (user: IUser | null, budgetName: string = '', chatId: number, isSpend = false) => {
  const bot = BotContext.bot;
  const context = BotContext.getInstance();

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
  const categoriesString = categories.map((category, i) => `        ${getCategoryIcon(category.name)}${category.name} <code>${category.amount}</code> ${i + 1 === categoryLength ? '' : '\n'}`).join('');
  const usersString = users.map((user) => user);

  bot.sendMessage(
    chatId,
    `📖 <b>Name: "${name}"</b>\n💸 Total amount: <code>${amount}</code>\n💰 Available to spend: <code>${availableAmount}</code>\n👤 Visible by: ${usersString}\n💬 Categories:\n${categoriesString} \n🔑 ID: ${_id.toString()} \n\n`,
    { parse_mode: 'HTML' }
  );

  context.setMenu({
    name: Menu.viewSpecificBudget,
    chatId,
    payload: {
      budgetId: budget.id
    },
    message: isSpend ? 'Here is your budget' : '',
  });
}

const getBudgetHistory = async (user: IUser | null, chatId: number) => {
  const bot = BotContext.bot;
  const context = BotContext.getInstance();
  const db = await DB.getInstance();
  const budgetId = context.getMenu(chatId)?.payload?.budgetId;
  const budget = await db.collection('budgets').findOne<IBudget>({ users: user?.email, id: budgetId });

  if (!budget || !user) {
    bot.sendMessage(chatId, 'Error bot didn\'t found requested budget', { parse_mode: 'HTML' });

    return;
  }

  const { history } = budget;
  const s = history.map(({ date, title, history }) => (
    `<b>${title}         <code>${moment(date).fromNow()}</code></b>${history.map(({ title: historyTitle, oldValue, newValue }, index) => (
      `\n${index + 1})  ${historyTitle}\n     <code>${oldValue || '🟩'}</code>   ➡️   <code>${newValue || '🟥'}</code>`
    )).join('')}\n`
  ))
  bot.sendMessage(
    chatId,
    s.join('\n'),
    { parse_mode: 'HTML' }
  );
}

const spendMoney = async (user: IUser | null, chatId: number) => {
  const bot = BotContext.bot;
  const context = BotContext.getInstance();
  const db = await DB.getInstance();
  const budgetId = context.getMenu(chatId)?.payload?.budgetId;
  const budget = await db.collection('budgets').findOne<IBudget>({ users: user?.email, id: budgetId });

  if (!budget || !user) {
    bot.sendMessage(chatId, 'Error bot didn\'t found requested budget', { parse_mode: 'HTML' });

    return;
  }

  const keyboard = budget.categories.map(({ name }) => ([{ text: getCategoryIcon(name) + '  ' + name }]));
  //@ts-ignore
  keyboard.push([{ text: Menu.main }]);

  context.setMenu({
    name: Menu.spendMoney,
    chatId,
    keyboard,
  });
}

const spendMoneyOnCategory = async (user: IUser | null, chatId: number, amount: number) => {
  const bot = BotContext.bot;
  const context = BotContext.getInstance();
  const db = await DB.getInstance();
  const menu = context.getMenu(chatId);
  const budgetId = menu?.payload?.budgetId;
  const categoryName = menu?.payload?.categoryName;
  const budget = await db.collection('budgets').findOne<IBudget>({ users: user?.email, id: budgetId });

  if (!budget || !budgetId || !user || !categoryName) {
    bot.sendMessage(chatId, 'Error bot didn\'t found requested budget', { parse_mode: 'HTML' });

    return;
  }

  const category = budget.categories.find(({ name }) => categoryName === name);

  if (!category) {
    bot.sendMessage(chatId, 'No category', { parse_mode: 'HTML' });

    return;
  }

  const data: IIncrementCategory = {
    id: category?.id,
    amount,
    budgetId: budgetId,
  }

  const resp = await fetch(`${process.env.API_URL}/category/increment`, {
    method: 'patch',
    headers: {
      authorization: user.email + '|' + chatId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (resp.status === 200) {
    bot.sendMessage(chatId, `Amount ${amount} was added to category ${categoryName}`);
  } else {
    bot.sendMessage(chatId, 'Some error');
  }

  context.setMenu({
    name: Menu.main,
    chatId,
    payload: null,
    message: 'Let\'s continue:'
  });
}

const shareBudget = async (user: IUser | null, chatId: number, emails: string[]) => {
  const bot = BotContext.bot;
  const context = BotContext.getInstance();
  const db = await DB.getInstance();
  const budgetId = context.getMenu(chatId)?.payload?.budgetId;
  const budget = await db.collection('budgets').findOne<IBudget>({ users: user?.email, id: budgetId });

  if (!budget || !budgetId || !user) {
    bot.sendMessage(chatId, 'Error bot didn\'t found requested budget', { parse_mode: 'HTML' });

    return;
  }

  const data: IShareBudgetRequest = {
    id: budgetId,
    emails,
    message: ''
  }

  const resp = await fetch(`${process.env.API_URL}/user/share-budget`, {
    method: 'post',
    headers: {
      authorization: user.email + '|' + chatId,
      'Content-Type': 'application/json',
      origin: process.env.WEB_APP_URL,
    },
    body: JSON.stringify(data)
  });

  if (resp.status === 200) {
    bot.sendMessage(chatId, `Users ${emails.join(' ')} were added to the budget`);
  } else {
    bot.sendMessage(chatId, 'Some error');
  }

  context.setMenu({
    name: Menu.main,
    chatId,
    payload: null,
    message: 'Let\'s continue:'
  });

  for (const emailUser of emails) {    
    const userE = await db.collection('users').findOne<IUser>({ email: emailUser });
    
    if (!userE?.chatId) continue;

    bot.sendMessage(
      userE.chatId, 
      `‼️User <code>${user.name}</code> shared with you new budget: <code>${budget.name}</code>`,
      {parse_mode: 'HTML'}
    );
  }
}

export {
  getAllBudgets,
  getSpecificBudget,
  getBudgetHistory,
  spendMoney,
  spendMoneyOnCategory,
  shareBudget
};