# Our Budget v7

A private shared household money app for a couple. It runs on GitHub Pages with the existing Supabase Free project. It has no paid API, bank connection, AI runtime or ChatGPT subscription dependency.

## What is included

- Four simple areas: **Today**, **Money**, **Plan** and an automatic **Timeline**
- A friendly fast-expense form, plus iPhone Back Tap and Android/PWA shortcuts
- Bank, cash and wallet accounts with opening balances, linked transactions, daily statements and transparent balance corrections
- One linked transfer that updates both accounts without inflating income or spending
- Debts with APR, minimum payments, principal/interest records and automatic remaining balances
- Goals with dated contributions that reserve existing cash without double-counting net worth
- Recurring salary, rent and bill templates with a monthly confirmation checklist
- A 40–30–20–10 plan: 40% essentials, 30% debt, 20% future, 10% wants
- Emergency-fund guidance from the current essential category limits
- Actual daily net-worth snapshots and a separate 12-month direction chart
- Assets and free market-price refresh for metals and crypto
- Household-scoped Row Level Security, Realtime updates, local cache and an offline change queue
- Complete JSON backup and transaction CSV export

## Data model and migration

Apply SQL files in `supabase/migrations/` in timestamp order. The v7 migration adds shared settings, recurring items, goal contributions, net-worth snapshots, linked transfers and linked debt-payment fields. It also adds RLS policies, explicit authenticated grants, household-link validation, indexes and automatic debt/goal balance triggers.

The repository uses only the public Supabase publishable/anon key. Never put a secret or service-role key in `config.js`.

## Balance rules

1. Add each real bank, cash or wallet balance under **Money → Accounts**.
2. Use the balance immediately before the selected tracking date as the opening balance.
3. Link salary and spending to the account they enter or leave.
4. Use **Transfer** when moving money between your own accounts.
5. Use **Correct balance** if the app and bank differ; the correction remains visible in history.
6. Gold, investments, crypto and property belong under **Other assets**. Goal savings stay in Accounts and are marked as reserved, so they are not added twice.

## Phone shortcuts

### iPhone Back Tap

1. In Apple Shortcuts, create a shortcut named **Log Spend**.
2. Add **Open URLs** with `https://mm050692.github.io/our-budget/?quick=expense`.
3. Open Settings → Accessibility → Touch → Back Tap → Double Tap and choose **Log Spend**.

### Android

Install the PWA from Chrome. Long-press **Our Budget** and choose **Add spend**, or drag that shortcut to the home screen. On Pixel, Settings → System → Gestures → Quick Tap can open Our Budget.

## Free deployment

Serve `main` through GitHub Pages. The app uses the existing GitHub Pages site, Supabase Free project and free Gold API endpoint. If ChatGPT Plus ends, the deployed app and all household data continue to work normally.

## Smoke test

1. Sign in and confirm all three existing accounts, the credit-card debt, vacation goal and gold bracelet are present.
2. Add income to an account, add a spend, and verify the running statement.
3. Transfer between two accounts and confirm income, spending and net worth do not change.
4. Record a debt payment and goal contribution; confirm the linked balances change once.
5. Confirm a recurring item and make sure it cannot be confirmed twice in one month.
6. Sign in on the second phone and confirm settings and data update in realtime.
7. Go offline, save an expense, reconnect and confirm the waiting-sync message clears.
