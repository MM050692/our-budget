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
- Household-scoped Row Level Security, Realtime updates, a compressed IndexedDB cache and a second durable offline-change queue
- Keyset-paginated history loading so records beyond a service's first 1,000 rows remain available
- Private compressed `.odhan` backups, readable integrity-checked JSON, validated batched restore, transaction CSV export and a dependency-free recovery page
- Salary-triggered delivery of the completed previous month's statement, with one delivery record per month and no financial contents stored in its database log

## Data model and migration

Apply SQL files in `supabase/migrations/` in timestamp order. The latest durability migration adds private statement-delivery metadata, backup-integrity metadata and long-history cursor indexes. The v9 migrations add household sinking funds, weekly money dates and richer month closes with RLS, explicit authenticated grants, actor validation, indexes and Realtime publication. Earlier migrations retain linked accounts, transfers, recurring items, contributions, net-worth snapshots, decision tools and automatic debt/goal balance triggers.

The repository uses only the public Supabase publishable/anon key. Never put a secret or service-role key in `config.js`.

## Monthly statement email

Saving an Income → Salary entry now prepares the completed previous month's money story locally. The first view is a plain-language summary with money received, money spent, net change, an interactive daily graph, spending areas, a 40–30–20–10 guide and one next action. On supported phones, **Share simple summary** opens the system share sheet with an easy PNG picture attached; the fallback saves the picture and opens an email draft addressed to the signed-in login email. A clearer CSV remains available separately as **Detailed records**. This needs no paid service and does not keep a statement file online.

Fully unattended external email is intentionally **not connected**. The deployed `email-monthly-statement` function is an authenticated non-sending placeholder: it accepts no destination, reads no financial rows and reports `setup_required`. Finance data, manual statement generation, CSV downloads and private backups continue normally.

`supabase/functions/email-monthly-statement/resend-provider.example.ts` preserves the reviewed delivery implementation without activating it. It verifies the user, household, Salary record, period and owner recipient; prepares the completed previous calendar month; excludes transfers and balance corrections; and prevents a second delivery for the same month. Do not deploy it until the owner explicitly approves the disclosure tradeoff described in the adjacent function README.

If approved later, the email API key belongs only in a Supabase Function secret—never browser code or Git. Email is not zero-disclosure: the relay and recipient mailbox process the message; Resend currently retains email content for 30 days. The current privacy-first placeholder avoids that disclosure entirely.

## Long-term recovery

Use **Money → Backup data** to make a private encrypted backup at least monthly and keep two copies in different places you control. Keep the passphrase in a password manager; it cannot be recovered by the app. A readable JSON backup is also available for maximum portability but is not private unless stored in an encrypted location.

`recovery.html` has no external dependency, login or network call. Save it with the backups. It can authenticate/decrypt `.odhan`, verify readable JSON and produce a standard JSON copy even if the main app or its hosting changes. The exact format is documented in `BACKUP_FORMAT.md`.

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
15. Add a Salary entry and confirm the previous month's money story opens once, shows the correct totals and daily graph, explains a selected day, shares or saves a private summary picture, and still downloads safe detailed CSV records.
16. Create a private `.odhan` backup, unlock it in `recovery.html`, download the recovered JSON and verify that the app accepts it for restore.
17. Test with more than 1,000 generated records and confirm the oldest and newest entries both load and export.
