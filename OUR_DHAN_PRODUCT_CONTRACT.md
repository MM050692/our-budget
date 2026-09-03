# Our DHAN product contract

This file is the durable brief for future work. It records the decisions Dhani and Sakhi have already made so they do not need to repeat them.

## Purpose and people

- Product name: **Our DHAN**.
- It is a private household money app for Dhani and Sakhi—not a public finance platform.
- Its job is to make day-to-day recording easy, show the whole household picture, motivate progress, and help savings, investments, goals and debt work together.
- The experience must be calm, friendly and understandable to a non-technical user. Optional guided practice may use short Marathi help, but the app must not add automatic translation or an asterisk/help marker to every control.

## Permanent cost and independence rules

- Normal use must remain free for this two-person household.
- The deployed app must not require ChatGPT Plus, an OpenAI API, an AI runtime, a paid bank feed or another paid subscription.
- Ending a ChatGPT plan must not affect the website, sign-in, stored data, calculations, backups or email logic.
- A free external service may be used only when there is a portable fallback and the app clearly reports when its one-time setup is incomplete.

## Interaction and visual rules

- Keep the visual language clean, spacious and product-like, inspired by Apple’s clarity rather than a dense accounting dashboard.
- Use gentle, purposeful animation and small moments of celebration; never make important figures harder to find.
- Phone entry is step-by-step. Spending order is: date → amount and currency → paid-from account → reason → who paid → optional short suggested note → save. Equivalent forms follow the same progressive pattern.
- Manual numeric, currency, account, category/reason and person selection must use inline vertical up/down wheel-style controls. Do not use sideways swipe controls or large pop-up wheels.
- Notes should offer a short category-based suggestion that the user can replace.

## Planning method and core screens

- The household method is exactly **40–30–20–10**: 40% essentials, 30% debt, 20% future savings/goals/investments, 10% wants.
- **Today** shows today’s income and spending, category budget remaining, safe-to-spend, regular items and a bold purple previous-month balance with a constructive next job.
- **Money** combines account balances, other assets and the net-worth dashboard. It includes a live-rate refresh button, an explanation/list or pie view for each headline figure, account statements with daily running balances, a one-year trajectory and tappable wealth points with a summary of what changed.
- **Plan** keeps budgets, payday allocation, debt payoff, goals, emergency savings, sinking funds and recurring items simple and connected.
- **Timeline** auto-populates from all relevant pages and includes a period-selectable statement of income and spending.
- **Together** supports a short weekly/monthly money check, a shared win and one next action.

## Accounting invariants

- Accounts are the source of current bank, cash and wallet balances. Salary is income flowing into an account—not the account balance itself.
- Transfers between owned accounts never count as income or spending and never change net worth.
- Balance corrections remain visible and are excluded from income/spending reports.
- Goal savings remain inside accounts and are marked reserved; never add the same cash to net worth twice.
- Debt payments reduce linked cash and debt exactly once. Principal and interest remain distinguishable.
- Market assets use explicit quantities/manual values and saved currency rates. A failed live-rate refresh must not erase the last known values.
- Historical records are immutable in meaning. Fixes use visible edits/corrections; storage optimization must never discard raw history.

## Monthly statement delivery

- External delivery is off by default. The signed-in household owner must explicitly turn it on after accepting the relay/mailbox privacy tradeoff.
- When an authenticated household member saves an **Income → Salary** record, request the completed previous calendar month’s statement.
- Deliver at most once per household and statement month, even after retries or repeated taps.
- Send only to the verified login email selected by the household owner. The browser must never accept an arbitrary destination for this automation.
- Include income, spending, balance, a 40–30–20–10 guide and a CSV attachment. Exclude transfers and balance corrections from totals.
- The delivery database log stores metadata only—never statement HTML, CSV contents or financial totals.
- The email API key is a server-side secret. It must never appear in `config.js`, browser storage, Git or a backup.
- Email is not end-to-end private: the relay and recipient mailbox process the content. State this plainly and keep a one-tap pause control.

## Ten-year durability and recovery

- Keep every daily record queryable after at least ten years of normal household use. Use keyset pagination; never rely on a service’s default 1,000-row response.
- Keep the phone cache compressed in IndexedDB once it grows; localStorage is only a small-cache/queue convenience.
- Keep offline financial changes in a second durable queue until Supabase confirms them.
- Never store statement files or full backup blobs in the database. One delivery metadata row per month is enough.
- Offer two portable backups:
  - `.odhan`: gzip-compressed and AES-256-GCM encrypted locally with a user passphrase.
  - `.json`: readable, documented data with a SHA-256 integrity value.
- A restore always downloads a safety copy first, validates links and integrity, merges in dependency order and uploads large histories in bounded batches.
- Keep `recovery.html` dependency-free and able to verify/decrypt backups locally without sign-in or a network call.
- Recommend two user-controlled copies in different places. Supabase is the live source of truth, but it must never be the only recoverable copy.

## Security baseline

- All household tables exposed through the API require Row Level Security and least-privilege grants.
- Only a server function with a verified user JWT may use service-role access for email delivery.
- Restrict browser origins, validate household membership and recipient membership server-side, and never trust a browser-provided household, recipient, period or totals.
- Keep production data and backups out of public repositories. Do not log statement bodies, passphrases, tokens, email addresses or financial rows.
- Re-run database security and performance advisors after schema changes.
