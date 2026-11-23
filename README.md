# Worknexa – worknexa.eu

Static site + Cloudflare Pages Functions.

- `public/` – the website (11 languages), admin panel in `public/admin/`
- `functions/` – API: registration form, photo/video uploads, admin API, text overrides
- `lib/core.js` – shared helpers (database schema, login, sessions)

## Cloudflare Pages settings
- Build command: *(none)*
- Build output directory: `public`
- Bindings: D1 database → `DB`, R2 bucket → `FILES`

Tables are created automatically on the first request.
The first visit to `/admin/` asks to create the administrator e-mail and password.
