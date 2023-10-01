import { ObjectId } from "mongodb";

import DB from './mongo/database';
import { IUser } from "./types";
import BotContext, { Menu } from "./botContext";

export default async function handleStartFlow(user: IUser | null, chatId: number, text: string) {
  const db = await DB.getInstance();
  const context = BotContext.getInstance();
  const bot = BotContext.bot;

  if (user) {
    await bot.sendMessage(chatId, `Hey, ${user.name}`);
    context.setMenu({
      name: Menu.main, 
      chatId,
    });
    
    return;
  }

  const [, userId] = text.split(' ');

  const linkedUser = await db.collection('users').findOne<IUser>({ _id: new ObjectId(userId) });

  if (!linkedUser) {
    bot.sendMessage(chatId, 'Hey hey');
    return ;
  }

  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { chatId } });
  await bot.sendMessage(chatId, `Hey, ${linkedUser.name}`);
  context.setMenu({
    name: Menu.main, 
    chatId,
  });
}