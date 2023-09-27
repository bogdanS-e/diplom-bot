import TelegramBot from "node-telegram-bot-api";
import DB from "./mongo/database";
import { IBudget, IUser } from "./types";

const getAllBudgets = async (user: IUser | null, bot: TelegramBot, chatId: number) => {
  if (!user) {
    bot.sendMessage(chatId, `<b>We didn't found your user</b>. Please, go to our app to link with telegram:\n<a href='${process.env.WEB_APP_URL}'>${process.env.WEB_APP_URL}</a>`, { parse_mode: 'HTML' });

    return;
  }

  const db = await DB.getInstance();
  const budgets = await db.collection('budgets').find<IBudget>({ users: user.email }, { projection: { _id: 0 } }).toArray();

  let response = '';

  budgets.forEach((budget) => {
    const obj = {
      name: budget.name,
      amount: budget.amount,
      availableAmount: budget.availableAmount
    }
    response += `\n${JSON.stringify(obj, null, 2)}`;
  });

  
  bot.sendMessage(
    chatId,
    `<pre>${response}</pre>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'See more info', web_app: { url: `https://127.0.0.1/budgets/?chatId=${chatId}` } }]
        ]
      }
    }
  );
};

export {
  getAllBudgets
};