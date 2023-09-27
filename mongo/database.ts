import { MongoClient, Db as DataBase } from 'mongodb';

class DB {
  private static instance: DataBase;

  public static async getInstance() {
    if (this.instance) return this.instance;

    if (!process.env.MONGO_URL) throw new Error('ENV ERROOR');;

    const client = new MongoClient(process.env.MONGO_URL, {});

    await client.connect();
    console.log('Connected successfully to the db');
    
    const db = client.db('money-management');
    this.instance = db;

    return this.instance;
  }
}

export default DB;
