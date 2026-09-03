# Monthly statement function

`index.ts` is the production-safe placeholder. It requires a valid Supabase JWT at deployment, accepts no destination, reads no financial data and makes no external request. It reports `setup_required`, allowing the browser to retain a Salary-triggered request without silently failing or disclosing anything.

`resend-provider.example.ts` is an inactive reviewed implementation of the intended delivery workflow. It must not replace `index.ts` until the household owner explicitly approves all of the following:

1. The verified owner login email will be the recipient.
2. Statement HTML and CSV will pass through Resend and the recipient mailbox.
3. Resend's normal free service currently retains message content for 30 days.
4. A Resend API key will be stored only as the `RESEND_API_KEY` Supabase Function secret.

After approval, review current provider terms and Supabase Edge Function guidance again, replace the entrypoint deliberately, deploy with `verify_jwt: true`, and run the security advisor. Never deploy the example merely because the file exists.

