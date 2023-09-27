import TelegramBot, { KeyboardButton } from "node-telegram-bot-api";

export enum Menu {
  main = '⬅️ To main menu',
  viewBudgets = '🔎 View your budgets',
  spendMoney = '💵 Spend money',
}

const token = '6244331493:AAGG-iCddpzHwXgZuZxwp6mxK8CZosxjYcc';

const baseMenuConfig = {
  is_persistent: true,
  resize_keyboard: true,
}

class BotContext {
  private static instance: BotContext;
  public static bot = new TelegramBot(token, { polling: true });
  private static menu: Map<number, Menu> = new Map();

  constructor() {
    if (!BotContext.instance) {
      BotContext.instance = this;

      return;
    }

    return BotContext.instance;
  }

  public getMenu(chatId: number) {
    return BotContext.menu.get(chatId);
  }

  public setMenu(menu: Menu, chatId: number, keyboard?: KeyboardButton[][]) {
    BotContext.menu.set(chatId, menu);
    
    if (menu === Menu.main) {
      BotContext.bot.sendMessage(
        chatId,
        'Let\'s get started:',
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

      return;
    }

    if (menu === Menu.viewBudgets && keyboard) {
      setTimeout(() => {
        BotContext.bot.sendMessage(
          chatId,
          'Choose specific budget to see detailed information:',
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
  }
}

export default BotContext;
