# Our Budget v6

A private, shared household money app for Dhani and Sakhi. It runs on GitHub Pages with the existing Supabase Free project, so no paid service, ChatGPT subscription or external AI is required after deployment.

## Included

- Email/password login with household-scoped Row Level Security
- Shared salary and expense entries with edit, delete and realtime updates
- Bank, cash and wallet accounts with a starting balance and automatic running balance
- Simple account correction that keeps an adjustment in the shared history
- One easy **Money & Wealth** page combining accounts, assets, debts and net worth
- A clear **40–30–20–10** monthly guide: 40% essentials, 30% debt, 20% goals and savings, 10% wants
- A built-in pie-style allocation graphic and 12-month net-worth trajectory with no chart subscription
- An automatic **Timeline** populated by transactions, accounts, budgets, assets, debts and goals
- Per-category budgets with their original currencies preserved
- Free market-price refresh for metals and cryptocurrency
- Household/account-scoped local cache and safe offline pending changes
- Rule-based suggestions that run entirely in the browser

## Database migrations

Apply the SQL files in `supabase/migrations/` in timestamp order. The v6 account migration adds `accounts`, links transactions through `account_id`, enables RLS and adds the table to Supabase Realtime.

The repository uses only the public Supabase publishable key. Never add a secret or service-role key to `config.js`.

## Free hosting

Serve the `main` branch through GitHub Pages. The app uses GitHub Pages, the existing Supabase Free project and the free Gold API endpoint. It has no paid database branch, background job, premium API, advertising SDK or ChatGPT runtime dependency.

## Balance setup

1. Open **Money** and add the main bank, cash or wallet account.
2. Enter its balance from just before the first transaction you want the app to track.
3. Choose that account when adding salary or spending.
4. If the app and real balance differ, use **Correct balance**; the app records a transparent adjustment.
5. Keep gold, crypto, property and investments under **Other assets** so bank money is not counted twice.

## Verification

1. Sign in as Dhani, add an account and record salary into it.
2. Add an expense from the same account and confirm its running balance changes.
3. Sign in as Sakhi on the other phone and confirm the account, Money page and Timeline update.
4. Confirm the 40–30–20–10 amounts and 12-month trajectory react to the current month’s salary.
5. Correct an account balance and confirm the adjustment appears in History and Timeline.
6. Temporarily go offline, save a change, reconnect and confirm the pending-sync message clears.
