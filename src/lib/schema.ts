

import { pgTable, text, numeric, timestamp, pgEnum, integer, boolean } from "drizzle-orm/pg-core";

// An "enum" is a column that only allows specific values
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);

export const transactions = pgTable("transactions", {
  id:          text("id").primaryKey(),           // unique ID for each row
  userId:      text("user_id").notNull(),          // which user owns this
  name:        text("name").notNull(),             // e.g. "Spotify"
  amount:      numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type:        transactionTypeEnum("type").notNull(),
  category:    text("category").notNull(),
  currency:    text("currency").notNull().default("USD"),
  amountUsd:   numeric("amount_usd", { precision: 12, scale: 2 }).notNull(), // normalized for charts
  date:        timestamp("date").notNull(),
  note:        text("note"),
  createdAt:   timestamp("created_at").defaultNow(),
});

export const budgetLimits = pgTable("budget_limits", {
  id:          text("id").primaryKey(),
  userId:      text("user_id").notNull(),
  category:    text("category").notNull(),
  limitAmount: numeric("limit_amount", { precision: 12, scale: 2 }).notNull(),
  currency:    text("currency").notNull().default("USD"),
  month:       integer("month").notNull(),   // 1–12
  year:        integer("year").notNull(),
});

export const savingsGoals = pgTable("savings_goals", {
  id:          text("id").primaryKey(),
  userId:      text("user_id").notNull(),
  name:        text("name").notNull(),       // e.g. "Emergency Fund"
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  savedAmount:  numeric("saved_amount",  { precision: 12, scale: 2 }).notNull().default("0"),
  currency:    text("currency").notNull().default("USD"),
  color:       text("color").notNull().default("#378ADD"),
  completed:   boolean("completed").notNull().default(false),
  createdAt:   timestamp("created_at").defaultNow(),
});

// Reviews

export const reviews = pgTable("reviews", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull(),
  userName:  text("user_name").notNull(),
  rating:    integer("rating").notNull(),       // 1–5
  comment:   text("comment").notNull(),
  approved:  boolean("approved").notNull().default(true), // auto-approve for now
  createdAt: timestamp("created_at").defaultNow(),
});


export const loanFrequencyEnum = pgEnum("loan_frequency", ["monthly", "weekly", "biweekly"]);
export const recurringFrequencyEnum = pgEnum("recurring_frequency", ["monthly", "weekly", "biweekly"]);
export const ruleTypeEnum = pgEnum("rule_type", ["percentage", "fixed"]);
export const ruleBaseEnum = pgEnum("rule_base", ["gross_income", "net_income", "custom"]);

// ── Loans 

export const loans = pgTable("loans", {
  id:              text("id").primaryKey(),
  userId:          text("user_id").notNull(),
  name:            text("name").notNull(),              // e.g. "Car loan"
  lender:          text("lender"),                       // e.g. "Barclays"
  totalAmount:     numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  remainingBalance: numeric("remaining_balance", { precision: 12, scale: 2 }).notNull(),
  interestRate:    numeric("interest_rate", { precision: 5, scale: 2 }).default("0"), // annual %
  monthlyPayment:  numeric("monthly_payment", { precision: 12, scale: 2 }).notNull(),
  currency:        text("currency").notNull().default("USD"),
  startDate:       timestamp("start_date").notNull(),
  nextPaymentDate: timestamp("next_payment_date"),
  paidOff:         boolean("paid_off").notNull().default(false),
  notes:           text("notes"),
  createdAt:       timestamp("created_at").defaultNow(),
});

// Individual payment records against a loan
export const loanPayments = pgTable("loan_payments", {
  id:            text("id").primaryKey(),
  userId:        text("user_id").notNull(),
  loanId:        text("loan_id").notNull().references(() => loans.id, { onDelete: "cascade" }),
  amount:        numeric("amount", { precision: 12, scale: 2 }).notNull(),
  principalPaid: numeric("principal_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  interestPaid:  numeric("interest_paid",  { precision: 12, scale: 2 }).notNull().default("0"),
  date:          timestamp("date").notNull(),
  notes:         text("notes"),
  createdAt:     timestamp("created_at").defaultNow(),
});

// ── Recurring transactions (e.g. subscriptions, bills, paychecks)

export const recurringTransactions = pgTable("recurring_transactions", {
  id:            text("id").primaryKey(),
  userId:        text("user_id").notNull(),
  name:          text("name").notNull(),
  amount:        numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type:          transactionTypeEnum("type").notNull(),
  category:      text("category").notNull(),
  currency:      text("currency").notNull().default("USD"),
  frequency:     recurringFrequencyEnum("frequency").notNull(),
  // For monthly: day of month (1–31)
  // For weekly/biweekly: day of week (0=Sun, 1=Mon ... 6=Sat)
  dayOfPeriod:   integer("day_of_period").notNull().default(1),
  active:        boolean("active").notNull().default(true),
  lastProcessed: timestamp("last_processed"),
  nextDue:       timestamp("next_due"),
  notes:         text("notes"),
  createdAt:     timestamp("created_at").defaultNow(),
});

// ── Budget rules 

export const budgetRules = pgTable("budget_rules", {
  id:           text("id").primaryKey(),
  userId:       text("user_id").notNull(),
  name:         text("name").notNull(),         // e.g. "Tithe", "Savings", "Rent"
  category:     text("category").notNull(),
  ruleType:     ruleTypeEnum("rule_type").notNull(),    // "percentage" or "fixed"
  ruleBase:     ruleBaseEnum("rule_base").notNull().default("gross_income"),
  value:        numeric("value", { precision: 10, scale: 2 }).notNull(), // % or fixed amount
  currency:     text("currency").notNull().default("USD"),
  priority:     integer("priority").notNull().default(0), // order of application (tithe first, etc.)
  active:       boolean("active").notNull().default(true),
  description:  text("description"),
  createdAt:    timestamp("created_at").defaultNow(),
});