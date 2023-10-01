import { IHistory, IHistoryData, IBudget } from "./types";

class MoneyHistory implements IHistory {
  date: string;
  history: IHistoryData[];
  title: string;

  constructor(oldBudget: IBudget | null, newBudget: IBudget, user: string) {
    const parsedHistory = this.parseHistory(oldBudget, newBudget, user);
    
    this.date = parsedHistory.date;
    this.history = parsedHistory.history;
    this.title = parsedHistory.title;
  }

  private parseHistory(oldBudget: IBudget | null, newBudget: IBudget, user: string): IHistory {
    const date = new Date().toISOString();
    const history: IHistoryData[] = [];

    if (!oldBudget) {
      return {
        date,
        title: `User ${user}:`,
        history: [{
          title: `created budget ${newBudget.name} with amount ${newBudget.amount}`,
          oldValue: '',
          newValue: newBudget.name,
        }]
      }
    }

    if (oldBudget.name !== newBudget.name) {
      history.push({
        title: 'changed the budget\'s name',
        oldValue: oldBudget.name,
        newValue: newBudget.name,
      });
    }

    oldBudget.categories.forEach((oldCategory) => {
      if (!newBudget.categories.find((newCategory) => newCategory.id === oldCategory.id)) {
        history.push({
          title: 'deleted the category ' + oldCategory.name,
          oldValue: oldCategory.name,
          newValue: null,
        });
      }

    });

    newBudget.categories.forEach((newCategory) => {
      const oldCategoryObj = oldBudget.categories.find((oldCategory) => newCategory.id === oldCategory.id);

      if (!oldCategoryObj) {
        history.push({
          title: `created the category ${newCategory.name} with amount ${newCategory.amount}`,
          oldValue: null,
          newValue: newCategory.name,
        });

        return;
      }

      if (newCategory.amount !== oldCategoryObj.amount) {
        history.push({
          title: 'changed amount of the category  ' + newCategory.name,
          oldValue: oldCategoryObj.amount,
          newValue: newCategory.amount,
        });
      }
    });

    oldBudget.users.forEach((oldUser) => {
      if (!newBudget.users.find((newUser) => oldUser === newUser)) {
        history.push({
          title: 'deleted user ' + oldUser,
          oldValue: oldUser,
          newValue: null,
        });
      }
    });

    newBudget.users.forEach((newUser) => {   
      if (!oldBudget.users.find((oldUser) => oldUser === newUser)) {
        history.push({
          title: 'added new user ' + newUser,
          oldValue: null,
          newValue: newUser,
        });
      }
    });

    if (oldBudget.amount !== newBudget.amount) {
      history.push({
        title: 'changed the budget\'s amount',
        oldValue: oldBudget.amount,
        newValue: newBudget.amount,
      });
    }

    if (oldBudget.availableAmount !== newBudget.availableAmount) {
      history.push({
        title: 'changed the budget\'s availableAmount',
        oldValue: oldBudget.availableAmount,
        newValue: newBudget.availableAmount,
      });
    }

    return {
      date,
      title: `User ${user}:`,
      history,
    }
  }
}

export default MoneyHistory;
