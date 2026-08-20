# Nuxt + Kirby Template

A starter template for websites that pair a **headless [Kirby CMS](https://getkirby.com)** backend with a **[Nuxt 4](https://nuxt.com)** frontend. Editors work in the Kirby Panel; content reaches the frontend over [KQL](https://github.com/getkirby/kql) as ready-made JSON.

The idea behind it: **a block or a page type is one folder.** Its Panel form, its data resolver, its Vue component and its TypeScript types live side by side, and both Kirby and Nuxt discover it on their own. There is no registry, no union type and no route to keep in sync.

```
├── _blocks/   → block packages: one folder = one block  (blueprint + resolver + Vue + types)
├── _pages/    → page-type packages: one folder = one template (blueprint + query + Vue)
├── kirby/     → headless CMS  (Kirby 5 + KQL + kirby-headless)
├── nuxt/      → frontend      (Nuxt 4 + nuxt-kirby + Tailwind 4 + i18n)
└── CLAUDE.md  → architecture guide and step-by-step recipes (German, also for AI agents)
```

## Features

- **A block is one folder, not a checklist.** In most headless setups a new content block means touching five files: a blueprint, a registration list, a resolver, a frontend component and a type union. Here you create `_blocks/testimonial/` with three files. Kirby reads the block catalog on every request; the Nuxt module regenerates the component registry and the `KirbyPageBlock` union. A missing file is a build error with a clear message, not a block that silently fails to render.
- **A page type is a folder too — and it serves any number of pages.** When fixed fields beat a block list (team pages, blog articles, locations), `_pages/<type>/` bundles the Panel blueprint, the KQL select and the rendering. Dispatch happens on the Kirby template name, so one package covers every page using it.
- **Fixed fields and a page builder can coexist** on the same page type — the demo team page has both.
- **Editors never wait for a deployment.** Any page on the `default` blueprint is rendered by the catch-all route, so new pages, new sections and reordered blocks go live on publish. Frontend work is only needed for genuinely new *kinds* of content.
- **Typed end to end.** Every block package declares its content shape and the generated union feeds `<KirbyBlocks>`. A field renamed in a blueprint but not in `types.ts` fails `pnpm test:types` instead of rendering `undefined` in production.
- **Clean JSON, not CMS internals.** Resolvers run inside Kirby: structure fields become plain arrays, file fields become `{ url, width, height, srcset, alt }`, `page://` permalinks become paths a `<NuxtLink>` accepts. The frontend never parses UUIDs or Kirby field objects.
- **The API token never reaches the browser.** All KQL traffic goes through a Nuxt server proxy; the bearer token exists only in the server runtime.
- **Live preview that actually works.** The Panel preview button opens the real frontend with a signed token, which the frontend hands back to Kirby as a header — drafts included. Implemented end to end, token verification and all.
- **Two languages, including translated slugs.** Kirby multi-language and Nuxt i18n are wired together (`prefix_except_default`). A page can carry a different slug per language — `/bloecke` ↔ `/en/blocks` — and the language switcher, the hreflang tags and the sitemap all follow.
- **One page, one URL.** Kirby answers to a page's slug in every language, so anything but the canonical path of the active language is 301-redirected instead of serving duplicate content.
- **SEO complete from the first commit.** Meta/OG/Twitter tags with a page → site fallback chain, canonical URLs, a sitemap built from Kirby data, an environment-aware `robots.txt` and redirects maintained in the Panel.
- **Image handling included.** Kirby generates WebP thumbnails and srcsets; `@nuxt/image` and `@nuxt/fonts` are wired up in the frontend.

## Built on

This template stands on Johann Schopplich's work and follows the structure of his **[cacao-kit-backend](https://github.com/johannschopplich/cacao-kit-backend)** and **[cacao-kit-frontend](https://github.com/johannschopplich/cacao-kit-frontend)** starter kits. What it adds on top is the package architecture (`_blocks/`, `_pages/`), an end-to-end live preview, translated slugs with canonical redirects, and the demo content.

The main packages doing the heavy lifting:

**Backend** (`kirby/`, PHP ≥ 8.3):

| Package | Version | What it does |
| --- | --- | --- |
| [getkirby/cms](https://github.com/getkirby/kirby) | 5.5 | The CMS and its Panel |
| [getkirby/kql](https://github.com/getkirby/kql) | 3.0 | The query language the frontend speaks |
| [johannschopplich/kirby-headless](https://kirby.tools/docs/headless) | 8.1 | Bearer-token API, `toResolvedBlocks`, sitemap endpoint, `frontendUrl` |
| [vlucas/phpdotenv](https://github.com/vlucas/phpdotenv) | 5 | `.env` support for the config |

**Frontend** (`nuxt/`, Node ≥ 20 + pnpm):

| Package | Version | What it does |
| --- | --- | --- |
| [nuxt](https://nuxt.com) | 4.5 | The framework, SSR and routing |
| [nuxt-kirby](https://nuxt-kirby.byjohann.dev) | 4.1 | `useKql` / `$kql` plus the server proxy that hides the token |
| [kirby-types](https://github.com/johannschopplich/kirby-types) | 1.6 | TypeScript types for KQL queries and responses |
| [@nuxtjs/i18n](https://i18n.nuxtjs.org) | 10.6 | Locales, prefixes, hreflang, translated route params |
| [tailwindcss](https://tailwindcss.com) | 4.1 | Styling, via `@tailwindcss/vite` |
| [@nuxt/image](https://image.nuxt.com) · [@nuxt/fonts](https://fonts.nuxt.com) | 2.1 · 0.14 | Responsive images, self-hosted fonts |
| [sitemap](https://github.com/ekalinin/sitemap.js) | 9.0 | Renders `/sitemap.xml` from Kirby's data |
| [typescript](https://www.typescriptlang.org) · [@antfu/eslint-config](https://github.com/antfu/eslint-config) | 6.0 · 9.3 | Types and lint rules |

TypeScript is pinned to 6.x on purpose: `vue-tsc` cannot load TypeScript 7 yet, which would break `pnpm test:types`.

## Setup

### 1. Backend

```bash
cd kirby
composer install
cp .env.example .env
```

Generate the three secrets and paste them into `.env`:

```bash
openssl rand -hex 32   # → KIRBY_CONTENT_SALT
openssl rand -hex 32   # → KIRBY_COOKIE_KEY
openssl rand -hex 32   # → KIRBY_HEADLESS_API_TOKEN
```

Start it and create your Panel account:

```bash
composer start   # → http://localhost:8000
```

Open http://localhost:8000/panel, create the account, then set `KIRBY_PANEL_INSTALL=false` in `.env`.

### 2. Frontend

```bash
cd nuxt
pnpm install
cp .env.example .env
# KIRBY_API_TOKEN must equal KIRBY_HEADLESS_API_TOKEN from the backend
pnpm dev         # → http://localhost:3000
```

That is the whole setup — the template ships with demo content, so http://localhost:3000 shows a working site immediately.

## What the demo content shows

| Page | Demonstrates |
| --- | --- |
| `/` (`home` blueprint) | The pitch, assembled from blocks: hero, list, line, text, FAQ, CTA. Has its own cover, so its `og:image` is page-level. |
| `/bloecke` · `/en/blocks` | **Every block type on one page** — text, list, quote, line, image, video, hero, FAQ, call to action. Also shows a **translated slug**, and has no SEO image of its own, so its `og:image` falls back to the site default. |
| `/bloecke/unterseite` · `/en/blocks/subpage` | Nesting: a multi-segment URL served by the catch-all route with no routing code, translated on both levels. |
| `/team` (`team` package) | A page type of its own: fixed Panel fields (`headline`, `intro`, a `members` structure) rendered by `_pages/team/Team.vue`, **plus** a page-builder tab whose blocks render below. |
| "Entwurf" (draft) | An unpublished page. Public requests get a 404; the Panel preview button shows it in the real frontend. |
| Error page | 404 content maintained in the Panel. |
| Site → Redirects tab | `/alte-startseite` → `/` as a 301, handled by the Nuxt server middleware. |
| `/en/bloecke`, `/home` | Non-canonical URLs — both 301 to the canonical one instead of duplicating content. |

Every page exists in German and English. The placeholder images are generated JPEGs — replace them along with the rest of the demo content.

## Commands

| Command | Where | Purpose |
| --- | --- | --- |
| `composer start` | `kirby/` | Kirby dev server (port 8000) |
| `pnpm dev` | `nuxt/` | Nuxt dev server (port 3000) |
| `pnpm build` | `nuxt/` | Production build (Node server in `.output/`) |
| `pnpm lint` / `pnpm lint:fix` | `nuxt/` | ESLint (@antfu config) |
| `pnpm test:types` | `nuxt/` | TypeScript check — covers `_blocks/` and `_pages/` too |

## Adding a block

Create `_blocks/testimonial/` containing:

- `block.yml` — a Kirby block blueprint, prefixed with a `baukasten:` section that places it in the palette
- `types.ts` — the `BlockContent` interface
- `Testimonial.vue` — the component, receiving a single `block` prop
- `resolver.php` — optional, only for structure, link or rich-text fields

Nothing else. A page type works the same way under `_pages/<type>/` with `page.yml`, `query.ts` and a component.

Full recipes, conventions and the reasoning behind them are in **[CLAUDE.md](CLAUDE.md)** (German).

## Deployment

**Kirby** runs on ordinary PHP hosting (Apache/nginx, PHP ≥ 8.3):

- point the webroot at `kirby/public/`
- upload `site/`, `public/`, `vendor/` and — importantly — the repo-root `_blocks/` and `_pages/` folders into the Kirby project root; `site/plugins/baukasten/package-root.php` finds them next to `kirby/` in a checkout as well as directly in the Kirby root on a server
- keep `.env` on the server and make `storage/` writable
- set `KIRBY_HEADLESS_FRONTEND_URL` to the public frontend URL, or the preview button will not work

**Nuxt** builds to a portable Node server (`node .output/server/index.mjs`) and runs on any Node host; switch Nitro presets with `NITRO_PRESET`.

On **Vercel**, set the Root Directory to `nuxt` and enable **"Include source files outside of the Root Directory in the Build Step"** — the build needs `_blocks/` and `_pages/` from the repo root. Without it the build stops with exactly that message rather than shipping an empty registry.

`KIRBY_BASE_URL` and `KIRBY_API_TOKEN` are read at **build time**. Override them at runtime with:

```bash
NUXT_KIRBY_URL=https://cms.example.com
NUXT_KIRBY_TOKEN=<token>
NUXT_PUBLIC_SITE_URL=https://www.example.com
NUXT_PUBLIC_I18N_BASE_URL=https://www.example.com
```

## Security notes

- The KQL API is bearer-authenticated; the token lives in `.env` on both sides and never enters the client bundle.
- `storage/` (content, accounts, sessions, logs) sits outside the webroot, and `.env` is git-ignored on both sides.
- Panel preview tokens are verified with a timing-safe comparison; a request carrying preview headers with an invalid token is rejected with 403, which also protects drafts.
- Editor-managed redirect targets are restricted to site-relative paths and absolute `http(s)` URLs.
- Set `KIRBY_PANEL_INSTALL=false` once your account exists, and keep `KIRBY_DEBUG=false` in production.
- Rich text from the Panel is rendered with `v-html`, so Panel accounts are trusted by design — grant them accordingly.

## How it fits together

1. A Nuxt page calls `useKirbyPage(uri)` → server proxy → `POST /api/kql` on Kirby with a bearer token
2. Kirby runs the query; `toResolvedBlocks` uses `blocks-resolver.php` to turn UUIDs, images, links and structure fields into plain JSON
3. `<KirbyPageBody :page>` looks at the Kirby template: either the component from `_pages/<type>/`, or `<KirbyBlocks>`, which maps each `type` to a component from `_blocks/<type>/`
4. `setPage(page)` fills the global page state, every SEO meta tag, and hands Nuxt i18n the page's slug in each language

Pages render `<NuxtLayout>` themselves rather than being wrapped by it in `app.vue`. That ordering matters: the header's language switcher needs the translated slugs, and a layout wrapped around `<NuxtPage>` renders before the page's async setup has fetched them.

## License

MIT — see [LICENSE](LICENSE).
