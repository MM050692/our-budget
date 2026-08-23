# Our Budget v3

This build adds:
- Supabase email/password login
- automatic household membership lookup
- shared transactions
- shared budgets
- shared savings goals
- shared debts
- realtime refresh between both phones
- AED / MVR / INR / USD
- local cache

## Before using
Your SQL schema must already exist and both users must already be attached to the same household.

## To test
1. Host this folder over HTTPS.
2. Open the hosted URL on the iPhone.
3. Sign in with Swap's Supabase email/password.
4. Open the same URL on the Samsung.
5. Sign in with the wife's Supabase email/password.
6. Add an expense on one phone and confirm it appears on the other.

Do not put a Supabase secret key or database password into this app.
