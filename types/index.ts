export interface IUser {
  email: string;
  name: string;
  onboarded: boolean;
  budgets: IBudget[];
  moneyBoxes: IMoneyBox[];
  chatId?: string;
  _id: string;
}

export interface IBudget {
  id: string;
  users: [string],
  name: string;
  amount: number;
  categories: ICreateCategory[],
  availableAmount: number;
  history: IHistory[];
}

export interface IMoneyBox {
  id: string;
  users: [string],
  name: string;
  goal: number;
  goalDate: string;
  actualAmount: number;
  startDate: string;
  completed: boolean;
  image: string | null;
}

export interface IHistoryData {
  title: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

export interface IHistory {
  date: string;
  title: string;
  history: IHistoryData[];
}

export type TCategoryName =
  'Housing' |
  'Transportation' |
  'Food' |
  'Medical & Healthcare' |
  'Personal Spending' |
  'Entertainment' |
  'Bills' |
  'Other';

export interface ICategory {
  name: TCategoryName;
  id: number;
}

export interface ICreateCategory extends ICategory {
  amount: number | null;
}

export interface IIncrementCategory {
  id: number;
  amount: number;
  budgetId: number;
}

export interface ISetCategoryRequest {
  budgetId: string;
  categories: ICreateCategory[];
}
