import { ObjectId } from "mongodb";

import DB from './mongo/database';
import { IUser } from "./types";

export default async function handleStartFlow(user: IUser | null, chatId: number, text: string) {
  const db = await DB.getInstance();

  if (user) {
    return `Hey, ${user.name}`;
  }

  const [, userId] = text.split(' ');

  const linkedUser = await db.collection('users').findOne<IUser>({ _id: new ObjectId(userId) });

  if (!linkedUser) {
    return 'Hey hey';
  }

  await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { chatId } });

  return `Hey, ${linkedUser.name}`;
}