
// This file defines the database tables using Drizzle ORM.
// Think of each "pgTable" call as creating one table in the db.

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