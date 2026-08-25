# Our Budget v5

A private, shared household budget app for Dhani and Sakhi. It runs on GitHub Pages and the existing Supabase Free project, with no paid services required.

## Included

- Email/password login and household-scoped Row Level Security
- Shared transactions with edit and delete
- Separate Budget, Net Worth, Debt, Goals and Assets pages
- Per-category budgets with their original currencies preserved
- Cash, manual assets, metals and cryptocurrency tracking
- Free market-price refresh on sign-in or on demand
- Household/account-scoped local cache and safe offline pending changes
- Realtime updates between both phones
- Automatic net-worth calculation, motivation and rule-based money suggestions

## One-time database setup

The production migration is stored at `supabase/migrations/20260825090000_harden_household_finance.sql`.

It tightens existing policies and grants without deleting household data. The repository uses only the public Supabase publishable key. Never add a secret or service-role key to `config.js`.

## Free hosting

Serve the `main` branch through GitHub Pages. Supabase, GitHub Pages and the real-time Gold API endpoint are used within their free offerings. No background jobs, paid database branches or premium APIs are required.

## Verification

1. Sign in as Dhani and add, edit and delete a transaction.
2. Sign in as Sakhi on the other phone and confirm the changes appear.
3. Set budgets in different currencies, change dashboard currency and confirm values convert rather than being relabelled.
4. Add a cash asset, a metal and a cryptocurrency.
5. Temporarily go offline, save a change, reconnect and confirm the pending-sync message clears.
