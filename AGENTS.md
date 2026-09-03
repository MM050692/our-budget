# Our DHAN project instructions

Before changing this project, read `OUR_DHAN_PRODUCT_CONTRACT.md` completely. Treat its product, privacy, data-correctness, portability and cost rules as acceptance criteria—not suggestions.

- Preserve existing user data and migrations. Never silently delete, aggregate away or reinterpret historical money records.
- Keep the production app usable without ChatGPT, an OpenAI subscription, a paid API or a bank connection.
- Keep secrets out of browser code, Git history, logs, screenshots and exports.
- Maintain compatibility with the documented backup format and the independent `recovery.html` tool.
- Test mobile layouts, offline save/sync, long-history pagination, statement totals and backup round-trips before publishing.
- When a requested change conflicts with an invariant, explain the conflict instead of quietly weakening the invariant.

