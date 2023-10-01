import TelegramBot, { KeyboardButton } from "node-telegram-bot-api";
import { TCategoryName } from "./types";

export enum Menu {
  main = '⬅️ To main menu',
  viewBudgets = '🔎 View your budgets',
  viewSpecificBudget = 'viewSpecificBudget',
  spendMoney = '💵 Spend money',
  spendMoneyChoose = 'spendMoneyChoose',
  spendMoneyOnCategory = 'spendMoneyOnCategory',
  viewBudgetHistory = '📋 See budget history',
  shareBudgetEnterEmails = '👤 Share this budget',
  editData = '✏️ Edit data',
  editDataChangeTitle = 'Change name',
  editDataDeleteUser = 'Delete user',
}

interface IMenuPayload {
  budgetId?: string;
  categoryName?: TCategoryName;
}

interface IMenuWithPayload {
  name: Menu;
  payload?: IMenuPayload | null
}

interface ISetMenuArguments {
  name: Menu;
  chatId: number;
  keyboard?: KeyboardButton[][];
  payload?: IMenuPayload | null;
  message?: string;
}

const token = '6244331493:AAGG-iCddpzHwXgZuZxwp6mxK8CZosxjYcc';

const baseMenuConfig = {
  is_persistent: true,
  resize_keyboard: true,
}

class BotContext {
  private static instance: BotContext;
  public static bot = new TelegramBot(token, { polling: true });
  private static menu: Map<number, IMenuWithPayload> = new Map();

  private constructor() { }

  public static getInstance() {
    if (!BotContext.instance) {
      BotContext.instance = new this;
    }

    return BotContext.instance;
  }

  public getMenu(chatId: number) {
    return BotContext.menu.get(chatId);
  }

  public setMenu({ name, chatId, keyboard, payload, message }: ISetMenuArguments) {
    const activeMenu = BotContext.menu.get(chatId);

    if (activeMenu) {
      activeMenu.name = name;

      if (payload || payload === null) {
        activeMenu.payload = payload;
      }
    }

    if (name === Menu.main) {
      BotContext.bot.sendMessage(
        chatId,
        message || 'Let\'s get started:',
        {
          reply_markup: {
            keyboard: [
              [{ text: Menu.viewBudgets }],
              [{ text: Menu.spendMoney }],
            ],
            ...baseMenuConfig,
          }
        }
      );
      BotContext.menu.set(chatId, { name: Menu.main, payload: null });

      return;
    }

    if (name === Menu.viewBudgets && keyboard) {
      setTimeout(() => {
        BotContext.bot.sendMessage(
          chatId,
          message || 'Choose specific budget to see detailed information:',
          {
            reply_markup: {
              keyboard,
              ...baseMenuConfig,
              input_field_placeholder: 'Choose...'
            }
          }
        );
      }, 500);

      return;
    }

    if (name === Menu.viewSpecificBudget && payload) {
      BotContext.menu.set(chatId, { name, payload });

      setTimeout(() => {
        BotContext.bot.sendMessage(
          chatId,
          message || 'Choose what you would like to do with:',
          {
            reply_markup: {
              keyboard: [
                [{ text: Menu.viewBudgetHistory }],
                [{ text: Menu.spendMoney }],
                [{ text: Menu.shareBudgetEnterEmails }],
                [{ text: Menu.editData }],
                [{ text: Menu.main }],
              ],
              ...baseMenuConfig,
            }
          }
        );
      }, 500);

      return;
    }

    if (name === Menu.spendMoney && keyboard) {
      setTimeout(() => {
        BotContext.bot.sendMessage(
          chatId,
          'Choose category in what you have spent money:',
          {
            reply_markup: {
              keyboard,
              ...baseMenuConfig,
              input_field_placeholder: 'Choose...'
            }
          }
        );
      }, 500);

      return;
    }

    if (name === Menu.spendMoneyOnCategory && activeMenu) {
      setTimeout(() => {
        BotContext.bot.sendMessage(
          chatId,
          `Enter how much money have you spent in ${activeMenu.payload?.categoryName} category`,
          {
            reply_markup: {
              input_field_placeholder: "Enter...",
              force_reply: true,
            }
          }
        );
      }, 500);

      return;
    }

    if (name === Menu.shareBudgetEnterEmails) {
      setTimeout(() => {
        BotContext.bot.sendMessage(
          chatId,
          'Enter emails that you want to add',
          {
            reply_markup: {
              input_field_placeholder: "Enter...",
              force_reply: true,
            }
          }
        );
      }, 500);

      return;
    }

    if (name === Menu.editData) {
      setTimeout(() => {
        BotContext.bot.sendMessage(
          chatId,
          'Choose what you want to manage:',
          {
            reply_markup: {
              keyboard: [
                [{ text: Menu.editDataChangeTitle }],
                [{ text: Menu.editDataDeleteUser }],
                [{ text: Menu.main }],
              ],
              ...baseMenuConfig,
            }
          }
        );
      }, 500);

      return;
    }
  }
}

export default BotContext;
