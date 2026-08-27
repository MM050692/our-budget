# Our DHAN v9

A private shared household money app for a couple. It runs on GitHub Pages with the existing Supabase Free project. It has no paid API, bank connection, AI runtime or ChatGPT subscription dependency.

## What is included

- Five simple areas: **Today**, **Money**, **Plan**, automatic **Timeline** and shared **Together**
- A friendly fast-expense form, plus iPhone Back Tap and Android/PWA shortcuts
- Bank, cash and wallet accounts with opening balances, linked transactions, daily statements and transparent balance corrections
- A safer daily-spending guide that protects goals, sinking funds, upcoming bills, debt minimums and a three-day essentials buffer
- One linked transfer that updates both accounts without inflating income or spending
- A household-wide debt plan with interest-saving and quick-win strategies, minimum protection and extra-payment simulation
- Goals with dated contributions that reserve existing cash without double-counting net worth
- Recurring salary, rent and bill templates with a monthly confirmation checklist
- A 40–30–20–10 plan: 40% essentials, 30% debt, 20% future, 10% wants
- A payday assistant that turns the four percentages into exact, recordable actions
- Emergency-fund guidance from the current essential category limits
- Actual daily net-worth snapshots and cautious/current/improved 12-month scenarios
- A 30/60/90-day cash-flow outlook from regular income, bills and debt minimums
- A shared monthly balance check-up with transparent corrections and Timeline history
- Sinking funds with monthly set-asides for annual bills, travel, gifts, repairs and other predictable costs
- A five-minute weekly money date, combined money calendar, emergency runway scenarios and monthly close
- Assets and free market-price refresh for metals and crypto
- Household-scoped Row Level Security, Realtime updates, local cache and an offline change queue
- Complete JSON backup, validated merge restore with an automatic safety copy, and transaction CSV export

## Data model and migration

Apply SQL files in `supabase/migrations/` in timestamp order. The v9 migration adds household sinking funds, weekly money dates and richer month closes with RLS, explicit authenticated grants, actor validation, indexes and Realtime publication. Earlier migrations retain linked accounts, transfers, recurring items, contributions, net-worth snapshots, decision tools and automatic debt/goal balance triggers.

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

Install the PWA from Chrome. Long-press **Our DHAN** and choose **Add spend**, or drag that shortcut to the home screen. On Pixel, Settings → System → Gestures → Quick Tap can open Our DHAN.

## Free deployment

Serve `main` through GitHub Pages. The app uses the existing GitHub Pages site, Supabase Free project and free Gold API endpoint. If ChatGPT Plus ends, the deployed app and all household data continue to work normally.

## Smoke test

1. Sign in and confirm all three existing accounts, the credit-card debt, vacation goal and gold bracelet are present.
2. Add income to an account, add a spend, and verify the running statement.
3. Transfer between two accounts and confirm income, spending and net worth do not change.
4. Record a debt payment and goal contribution; confirm the linked balances change once.
5. Confirm a recurring item and make sure it cannot be confirmed twice in one month.
6. Open the payday assistant and verify the four targets match the current month’s income.
7. Compare both debt strategies and test an extra monthly payment without saving it.
8. Complete the monthly money check and confirm any correction appears in the account statement and Timeline.
9. Preview 30, 60 and 90 days in Timeline and confirm regular items affect the expected cash balance.
10. Restore a recent backup and confirm the automatic safety copy downloads before the merge begins.
11. Sign in on the second phone and confirm settings and data update in realtime.
12. Go offline, save an expense, reconnect and confirm the waiting-sync message clears.
13. Add a sinking fund, record its monthly set-aside and confirm safe-to-spend remains protected before and after.
14. Complete a weekly money date and month close, then confirm both appear on the other phone and in Timeline.
