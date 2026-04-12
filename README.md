# WalletWise

A full-stack personal budget tracking application built with modern web technologies. Track income and expenses, set budget limits, manage savings goals, and visualise your finances with beautiful animated charts — all in multiple currencies.

🌐 **Live Demo:** [wallet-wise-bice-two.vercel.app](https://wallet-wise-bice-two.vercel.app/)

---

## Features

* **Transaction Management** — Add, edit, and delete income and expenses with full search and filtering
* **Auto-categorization** — Transactions are automatically categorised based on keywords (e.g. "Netflix" → Entertainment)
* **Multi-currency Support** — Track transactions in 12+ currencies with live exchange rates via open.er-api.com
* **Budget Limits & Alerts** — Set monthly spending limits per category with visual warnings at 80% and over-limit alerts
* **Savings Goals** — Create goals with target amounts, track progress, add funds, and mark complete
* **Analytics Dashboard** — Income vs expenses bar chart, spending by category donut chart, daily spending line chart
* **User Reviews** — Real users can leave star ratings and reviews shown on the landing page
* **In-app Notifications** — Bell icon alerts when budget categories reach 80% or exceed limits
* **Responsive Design** — Mobile-first UI with bottom tab navigation on mobile and sidebar on desktop
* **Smooth Animations** — Page transitions, animated charts, progress bars, and hover effects via Framer Motion
* **Authentication** — Secure sign in / sign up with Clerk, supporting email and social login

---

## Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Framework      | Next.js 15 (App Router)                 |
| Language       | TypeScript                              |
| Styling        | Tailwind CSS                            |
| Animations     | Framer Motion                           |
| Database       | Neon (serverless Postgres)              |
| ORM            | Drizzle ORM                             |
| Auth           | Clerk                                   |
| Charts         | Recharts                                |
| Icons          | Lucide React                            |
| Deployment     | Vercel                                  |
| Exchange Rates | open.er-api.com (free, no key required) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analytics/        # Chart data endpoint
│   │   ├── budgets/          # Budget limits CRUD
│   │   ├── exchange-rates/   # Cached currency rates
│   │   ├── goals/            # Savings goals CRUD
│   │   ├── reviews/          # User reviews CRUD
│   │   └── transactions/     # Transactions CRUD
│   ├── dashboard/
│   │   ├── budgets/          # Budgets page
│   │   ├── goals/            # Goals page
│   │   ├── settings/         # Settings + review form
│   │   ├── transactions/     # Transactions page
│   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   └── page.tsx          # Overview / dashboard home
│   ├── sign-in/              # Clerk sign in page
│   ├── sign-up/              # Clerk sign up page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── dashboard/
│   │   ├── NotificationBell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   └── TransactionForm.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── PageTransition.tsx
│       └── Select.tsx
├── hooks/
│   ├── useAnalytics.ts
│   ├── useCurrency.ts
│   ├── useGoals.ts
│   └── useTransactions.ts
└── lib/
    ├── categories.ts         # Category definitions + auto-categorize logic
    ├── currencies.ts         # Supported currencies + conversion helpers
    ├── db.ts                 # Neon + Drizzle connection
    ├── schema.ts             # Database schema
    └── utils.ts              # Shared utilities
```

---

## Getting Started

### Prerequisites

* Node.js 18+
* A [Neon](https://neon.tech/) account (free)
* A [Clerk](https://clerk.com/) account (free)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/danielamissah/wallet-wise.git
cd wallet-wise
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

Create a `.env.local` file in the root of the project:

```env
DATABASE_URL="neon-connection-string"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**4. Push the database schema**

```bash
npx dotenv-cli -e .env.local -- npx drizzle-kit push
```

**5. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000/) in your browser.

---

## Database Schema

| Table            | Key Columns                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `transactions` | id, userId, name, amount, type, category, currency, amountUsd, date, note |
| `budgetLimits` | id, userId, category, limitAmount, currency, month, year                  |
| `savingsGoals` | id, userId, name, targetAmount, savedAmount, currency, color, completed   |
| `reviews`      | id, userId, userName, rating, comment, approved, createdAt                |

> All monetary values are stored in their original currency. An `amountUsd` column stores a normalised USD equivalent used for cross-currency analytics and chart aggregation.

---

## API Routes

| Method | Endpoint                   | Description                    | Auth Required |
| ------ | -------------------------- | ------------------------------ | ------------- |
| GET    | `/api/transactions`      | List transactions with filters | ✅            |
| POST   | `/api/transactions`      | Create a transaction           | ✅            |
| PATCH  | `/api/transactions/[id]` | Update a transaction           | ✅            |
| DELETE | `/api/transactions/[id]` | Delete a transaction           | ✅            |
| GET    | `/api/budgets`           | Get budget limits for a month  | ✅            |
| POST   | `/api/budgets`           | Set or update a budget limit   | ✅            |
| DELETE | `/api/budgets`           | Remove a budget limit          | ✅            |
| GET    | `/api/goals`             | List savings goals             | ✅            |
| POST   | `/api/goals`             | Create a savings goal          | ✅            |
| PATCH  | `/api/goals/[id]`        | Update goal or add funds       | ✅            |
| DELETE | `/api/goals/[id]`        | Delete a goal                  | ✅            |
| GET    | `/api/analytics`         | Aggregated chart data          | ✅            |
| GET    | `/api/exchange-rates`    | Live rates, cached 1 hour      | ❌            |
| GET    | `/api/reviews`           | Public approved reviews        | ❌            |
| POST   | `/api/reviews`           | Submit a review                | ✅            |

---

## Multi-currency

Transactions can be recorded in any of 12 supported currencies:

`USD` `EUR` `GBP` `CAD` `AUD` `JPY` `INR` `BRL` `MXN` `NGN` `ZAR` `KES`

The app stores the original amount and currency on every transaction, then converts and stores an `amountUsd` value at write time using live exchange rates. Chart aggregations read `amountUsd` for consistency. The UI converts totals to the user's preferred display currency at render time.

Exchange rates are cached server-side for one hour to avoid hitting rate limits.

---

## Responsive Design

| Viewport           | Layout                                |
| ------------------ | ------------------------------------- |
| Mobile (< 768px)   | Fixed top bar + bottom tab navigation |
| Desktop (≥ 768px) | Left sidebar with full navigation     |

Modals slide up from the bottom on mobile (native sheet pattern) and appear centred on desktop.

---

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

---

## Roadmap

* [ ] Dark mode
* [ ] Recurring transactions
* [ ] CSV / PDF export
* [ ] Email notifications (weekly spending summary)
* [ ] React Native mobile app
* [ ] Bank connection via Plaid

---

## License

MIT License — free to use, modify, and distribute.
