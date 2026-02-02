
export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  CREDIT = 'CREDIT',
  DEBT = 'DEBT',
  UTILITY = 'UTILITY'
}

export enum Category {
  FOOD = 'Oziq-ovqat',
  TRANSPORT = 'Transport',
  UTILITIES = 'Kommunal',
  ENTERTAINMENT = 'Ko\'ngilochar',
  HEALTH = 'Sog\'liqni saqlash',
  SHOPPING = 'Shopping',
  LOAN_PAYMENT = 'Kredit to\'lovi',
  EDUCATION = 'Ta\'lim',
  INVESTMENT = 'Investitsiya',
  OTHERS = 'Boshqa'
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
  description: string;
  isRecurring: boolean;
  dueDate?: string;
}

export interface UserSettings {
  salary: number;
  currency: string;
}
