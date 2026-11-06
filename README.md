# Splitwise Clone

Full-stack group expense splitter: create groups, add shared expenses with different split types, and settle up with the **minimum number of payments**.

## Stack
**Backend:** Node.js · Express · MongoDB (Mongoose) · JWT auth · bcrypt · Helmet · rate-limiting
**Frontend:** React · Vite · Tailwind CSS · React Router · Axios

## Features
- **JWT auth** with hashed passwords
- **Groups** with members
- **Expenses** split three ways: equal, exact amounts, or percentages
- **Balance calculation** — who owes whom across all group expenses
- **Debt simplification** — a greedy algorithm that reduces a tangle of debts to the fewest transfers (e.g. A→B and B→C collapses to A→C)
- Settlements to record payments

## The interesting part: debt simplification
`backend/utils/simplifyDebts.js` turns per-expense balances into the minimum set of payments. It nets each person to a single balance, then repeatedly matches the largest debtor against the largest creditor. This is the greedy heuristic for the "minimum cash flow" problem — not always provably optimal (that's NP-hard), but it collapses redundant chains in practice.

## Architecture
```
backend/
  models/        User, Group, Expense, Settlement
  controllers/   auth, groups, expenses, settlements
  utils/         calculateBalances.js, simplifyDebts.js
  routes/        /api/auth, /api/groups, /api/expenses, /api/settlements
frontend/
  src/pages/     Login, Register, Dashboard, GroupDetail
  src/api/       axios client + per-resource API modules
  src/context/   AuthContext
```

## Running locally
```bash
cd backend && cp .env.example .env   # MONGODB_URI, JWT_SECRET
npm install && npm start             # http://localhost:5000
cd ../frontend && npm install && npm run dev
```
