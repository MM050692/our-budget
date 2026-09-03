# Our DHAN portable backup format

Our DHAN backups are deliberately based on standard JSON, SHA-256, gzip, PBKDF2 and AES-GCM so the data can be recovered without a proprietary service.

## Readable `.json`

The top-level object contains:

- `format`: `our-dhan-portable-backup`
- `formatVersion`: currently `1`
- `appVersion`: the exporting app version
- `exportedAt`: ISO-8601 timestamp
- `household`: display label only
- `recovery`: human-readable recovery note
- `recordCounts`: counts by collection
- `data`: the complete normalized Our DHAN state
- `integrity`: `{ "algorithm": "SHA-256", "value": "<64 lowercase hex characters>" }`

To verify integrity, remove the `integrity` member, serialize the remaining value as canonical JSON, then calculate SHA-256 over its UTF-8 bytes. Canonical JSON here means:

1. Object keys are sorted by Unicode code-point order.
2. Arrays retain their original order.
3. No whitespace is inserted.
4. Primitive values use normal JSON encoding.
5. Undefined object members are omitted; undefined array members become `null`.

The result must equal `integrity.value`.

## Private `.odhan`

The file itself is JSON with:

- `format`: `our-dhan-private-backup`
- `formatVersion`: currently `1`
- `appVersion` and `createdAt`
- `encryption`: cipher, KDF, iteration count, Base64 salt and Base64 IV
- `compression`: `gzip` or `none`
- `ciphertext`: Base64 ciphertext including the AES-GCM authentication tag

Recovery order:

1. Base64-decode the 16-byte salt, 12-byte IV and ciphertext.
2. Derive a 256-bit key from the passphrase using PBKDF2-HMAC-SHA-256 and the recorded iteration count (currently 310,000).
3. Authenticate and decrypt with AES-256-GCM and the recorded IV.
4. Gunzip when `compression` is `gzip`.
5. Decode UTF-8 and parse the resulting readable-backup body.

The passphrase is intentionally never stored. Losing it makes a private backup unrecoverable. The dependency-free `recovery.html` page implements these steps locally and can produce a verified readable JSON copy.

## Compatibility rule

Future versions may add fields, but must not silently reinterpret or remove existing fields. A future format change requires a new `formatVersion`, a migration path, and continued read support for prior versions.

