# Nuxt + Kirby Template — Architecture & Recipes

This repo is a template for websites built on a headless Kirby CMS (`kirby/`) and a Nuxt 4 frontend (`nuxt/`). This file describes the conventions and the standard recipes for new features. **Always build new features along these recipes** — backend and frontend have to stay in sync.

## Architecture

```
_blocks/<type>/ one folder = one block     _pages/<type>/ one folder = one page type
├── block.yml    ─► blueprint + palette    ├── page.yml   ─► page blueprint (tabs/sections)
├── resolver.php ─► blocks-resolver.php    ├── query.ts   ─► select + PageContent
└── Type.vue + types.ts ─► registry+union  └── Type.vue (+ parts/) ─► template registry

Kirby Panel (editor)                   Nuxt frontend (visitor)
        │                                      │
   blueprints from the packages       useKql(query) in page/plugin
   content as blocks/fields                    │
        │                              server proxy (/api/__kirby__)
        ▼                                      │  bearer token, never in the browser
   storage/content/*.txt   ◄──  POST /api/kql ─┘
        │
   toResolvedBlocks + blocks-resolver.php
        └─► clean JSON ─► KirbyPageBody.vue
                          ├─ template package? ─► #baukasten/pages
                          └─ otherwise KirbyBlocks ─► #baukasten/blocks
```

- **Data flow:** Nuxt pages fetch content over KQL (`useKql` from `nuxt-kirby`). Every request goes through the server proxy; `KIRBY_API_TOKEN` stays server-side.
- **Packages:** A block is **one folder under `_blocks/`**, a page type **one folder under `_pages/`** — both in the repo root, and both systems find them on their own. Kirby registers the blueprints through `site/plugins/baukasten/`, Nuxt generates registries and type unions through `modules/baukasten.ts`. There is **no** list anything has to be added to.
- **Content model:** A page = fixed meta fields (title, cover, SEO tab) + either a flexible `blocks` field (page builder) or the fixed fields of its page type. The folder name under `_blocks/` *is* the Kirby block type, the one under `_pages/` *is* the template name.
- **Languages:** Kirby multi-language (de default, en) ↔ `@nuxtjs/i18n` with `prefix_except_default`. KQL requests carry the language via the `language` option (`X-Language` header). UI strings (footer etc.) live in `nuxt/i18n/locales/*.json`; **all content comes from Kirby**.
- **Routing:** There are exactly two routes — `app/pages/index.vue` (renders `home`) and `app/pages/[...slug].vue` (every other Kirby page). Which component takes over is decided by `<KirbyPageBody>` based on `intendedTemplate`: new pages **and** new page types need no routing code.

## Important files

| File | Purpose |
| --- | --- |
| `_blocks/<type>/` | **One block package** — the only place you touch for a block |
| `_pages/<type>/` | **One page-type package** — Panel form, query and rendering of a template |
| `_pages/_shared/types.ts` | `KirbySharedPageData`, `KirbyPage<T>`, `KirbyPageSelect`, `KirbyI18nMeta` |
| `_pages/_shared/catalog.php` | Scans `_pages/` — used by the Kirby plugin |
| `_blocks/_shared/types.ts` | `KirbyBlock`, `ResolvedKirbyImage`, `HeadingLevel` for every block |
| `_blocks/_shared/resolvers.php` | Reusable resolvers (`link`, `richText`, `kirbytext`, `headingLevel`) |
| `_blocks/_shared/categories.yml` | Groups of the block palette in the page builder |
| `_blocks/_shared/catalog.php` | Scans `_blocks/` — shared by the Kirby plugin and the resolver |
| `kirby/site/plugins/baukasten/` | Registers block and page blueprints, assembles the `fields/blocks` field |
| `kirby/site/config/blocks-resolver.php` | Collects the `resolver.php` files of the block packages (keys become `blockType:field`) |
| `nuxt/modules/baukasten.ts` | Generates `#baukasten/blocks` and `#baukasten/pages` (registries + type unions) |
| `kirby/site/blueprints/tabs/seo.yml` | Reusable SEO tab (`seo: tabs/seo` in every page blueprint) |
| `kirby/site/config/config.php` | KQL auth, headless options, sitemap exclusions |
| `kirby/site/plugins/preview-token/` | Verifies Panel preview tokens, unlocks the draft version |
| `nuxt/app/queries/*.ts` | Global queries (site, error) — page-type queries live in their package |
| `nuxt/app/queries/page.ts` | `sharedQuerySelects` (SEO fragment, spread into every page query) + `getPageQuery()` |
| `nuxt/app/components/Kirby/PageBody.vue` | Renders a page: page-type component or block list |
| `nuxt/app/components/Kirby/Blocks.vue` | Renders a block list through the generated registry |
| `nuxt/app/composables/kirbyPage.ts` | `useKirbyPage(uri)` — the standard way to load page data (fetch + preview + canonical redirect + 404 + `setPage`) |
| `nuxt/app/composables/page.ts` | `usePage()` / `setPage()` (global page state + SEO meta + i18n slugs) |
| `nuxt/app/composables/preview.ts` | `useKirbyPreview()` for the Panel live preview |
| `nuxt/app/plugins/site.ts` | Loads global site data (nav, SEO defaults) per SSR request |

## Conventions

- **Write field names in block blueprints lowercase** (`buttonlabel`, not `buttonLabel`) — Kirby returns block content keys lowercased, and the TS types have to match exactly.
- Heading blocks follow the pattern `level` (select: h2/h3/none) + `heading` (text); the shared `headingLevel` resolver always returns a string.
- Blocks **never** hardcode the tag of their heading: `<component :is="block.content.level">`. The hero does this with `level` (h1/h2, defaulting to h1), so a page keeps exactly one `h1` even when a hero sits in the middle of the page builder.
- Structure fields are **always** resolved into plain arrays in the resolver (`toStructure()->map(...)->values()`), never handed to the frontend raw.
- Link fields are resolved into URL strings; internal links become paths (`/bloecke`) so `<NuxtLink>` can use them directly.
- Package files (`_blocks/`, `_pages/`) live outside the Nuxt app: import your own files **relatively** (`../_shared/types`), never through `#shared`, and use **no npm packages** — `node_modules` only exists inside `nuxt/`. That is why `_pages/_shared/types.ts` brings its own `KirbyPageSelect` type instead of using `kirby-types`. The **generated aliases** `#baukasten/blocks` / `#baukasten/pages` are allowed though — that is how a page type gets at the `KirbyPageBlock` union type.
- Tailwind classes in package components are covered by `@source` in `app/assets/css/main.css` (`blocks`, `pages`) — keep that in mind for new folders outside those.
- Every page query spreads `...sharedQuerySelects` (SEO/cover fields); pages load their data through `useKirbyPage(uri)` (which calls `setPage()` internally).
- **Always look pages up in KQL with `site.find("...")`, never with `page("...")`** — the `page()` helper also serves unpublished drafts. Use `site.findPageOrDraft` in preview mode only (the backend rejects invalid preview headers with 403).
- `useKirbyPage` fetches through `$kql` inside its own `useAsyncData` (rather than through `useKql`), so the cache key stays unique per language/URI/preview and the second request of a page-type package can run conditionally. Since nuxt-kirby 4 the payload cache option is called `payloadCache` (formerly `cache`).
- After an `await` in a composable, Nuxt composables (`useState`, `useRoute`, …) are lost — use `nuxtApp.runWithContext(() => ...)` (see `useKirbyPage`).
- **Translated slugs:** A `Slug:` field in a translation content file (e.g. `default.en.txt`) gives the page its own URL in that language (`/bloecke` ↔ `/en/blocks`). So the language switcher and hreflang follow along, every page query selects `i18nMeta` (a page method from kirby-headless) and `setPage()` passes the URIs to Nuxt i18n via `useSetI18nParams()`.
- **The pages render `<NuxtLayout>` themselves**, not `app.vue`. A layout wrapped around `<NuxtPage>` renders its header *before* the page's async `setup()` has fetched the translated slugs — the language switcher would then point at the wrong URL.
- Kirby finds a page under the slug of **any** language, so `/en/bloecke` serves the same page as `/en/blocks`. `useKirbyPage` therefore 301-redirects anything but the canonical path of the active language (`/home` → `/` included); this is skipped in preview mode, because the Panel's query parameters would otherwise be lost.
- Every page blueprint sets `options.preview: "{{ page.frontendUrl }}"`, otherwise the Panel preview button does not work.
- Every page blueprint gets the reusable SEO tab: `tabs: { content: ..., seo: tabs/seo }`. Empty SEO fields automatically fall back to the site-wide SEO settings in the frontend (fallback chain in `setPage()`).
- Send rich text (writer/textarea with links) through `permalinksToUrls()` in the resolver, so `page://` UUIDs become URLs.
- Demo content lives in `kirby/storage/content/` (Kirby text format; `blocks` fields are single-line JSON arrays): `1_home` (the pitch), `2_bloecke` (every block type on one page, en slug `blocks`) with a subpage (en slug `subpage`), `3_team` (page-type package), `error`, and a draft under `_drafts/entwurf` for the preview button. Every page exists in de and en.

## Recipe 1: Add a new block type

**One folder under `_blocks/` — that is all.** There is no registration, no union, no registry entry. The folder name *is* the Kirby block type. Example: a `testimonial` block with a quote, a name and an image.

```
_blocks/testimonial/
  block.yml          required — Panel form + baukasten metadata
  types.ts           required — BlockContent
  Testimonial.vue    required — exactly one .vue per folder
  resolver.php       optional — only for structure/link/rich-text fields
```

1. **`block.yml`** — the `baukasten` block is split off before the blueprint is registered; everything below it is a normal Kirby block blueprint:
   ```yaml
   baukasten:
     category: sections     # group from _blocks/_shared/categories.yml
     order: 40              # position within the group

   name:
     en: Testimonial
     de: Testimonial
   icon: chat
   preview: fields
   wysiwyg: true
   fields:
     quote:
       label:
         en: Quote
         de: Zitat
       type: textarea
       buttons: false
       required: true
     name:
       label: Name
       type: text
     image:
       label:
         en: Image
         de: Bild
       type: files
       max: 1
       uploads:
         template: blocks/image
   ```
2. **`types.ts`** — the content only; the `id`/`type`/`isHidden` envelope comes from the module:
   ```ts
   import type { ResolvedKirbyImage } from '../_shared/types'

   export interface BlockContent {
     quote: string
     name?: string
     image: ResolvedKirbyImage[] | null
   }
   ```
3. **`Testimonial.vue`** — the props pattern is always identical:
   ```vue
   <script setup lang="ts">
   import type { KirbyBlock } from '../_shared/types'
   import type { BlockContent } from './types'

   defineProps<{
     block: KirbyBlock<BlockContent, 'testimonial'>
   }>()
   </script>
   ```
4. **`resolver.php`** — only create it when fields need transforming. Single `files` fields are resolved automatically by the `defaultResolvers.files` fallback:
   ```php
   <?php

   return fn (array $r) => [
       'link' => $r['link'],
   ];
   ```
   The keys automatically become `testimonial:link`. Custom logic goes in as a closure, `fn (Field $field, Block $block) => …` (example: `_blocks/faq/resolver.php`).

**Kirby's built-in blocks** (`text`, `heading`, `image`, …) carry `baukasten.builtin: true` and no `fields` — they use Kirby's own blueprint and only contribute a component and its types. They do carry `name` and `icon`: the page-builder palette is assembled from those.

The dev server restarts by itself when a folder is added; Kirby reads the catalog on every request. If one of the three required files is missing, the Nuxt build stops with a clear message.

## Recipe 2: Add a new page type (own tabs, sections, rendering)

**One folder under `_pages/` — that is all.** As with blocks: no route, no query re-export, no registry. The folder name *is* the Kirby template name; the catch-all route renders every page using that template through the package component. The `team` page type is the complete example in this template.

```
_pages/team/
  page.yml           required — Kirby page blueprint: tabs, sections, fields
  query.ts           required — PageContent + KQL select
  Team.vue           required — entry component, PascalCase of the folder name
  parts/*.vue        optional — sections belonging to this page type
```

1. **`page.yml`** — a normal Kirby page blueprint. Reference the reusable building blocks from `kirby/site/blueprints/`:
   ```yaml
   title: Team
   icon: users

   options:
     preview: "{{ page.frontendUrl }}"     # otherwise no preview button

   tabs:
     content:
       label: { en: Content, de: Inhalt }
       columns:
         - width: 2/3
           fields:
             members:
               type: structure
               fields: { name: { type: text }, role: { type: text } }
         - width: 1/3
           sections:
             cover: sections/cover
             images: sections/images
     seo: tabs/seo                          # every page type gets the SEO tab
   ```
2. **`query.ts`** — what this type needs on top of the shared fields. `sharedQuerySelects` (title, SEO, cover) is merged in by `useKirbyPage` itself:
   ```ts
   import type { KirbyPageSelect } from '../_shared/types'

   export interface PageContent {
     headline: string
     members: Array<{ name: string, role: string }>
   }

   export const select: KirbyPageSelect = {
     headline: true,
     members: 'page.members.toStructure',
   }
   ```
   Note: `toStructure` returns the items raw — resolve nested images/links through a nested `select` (`{ query: 'page.field.toFile', select: [...] }`).
3. **`Team.vue`** — the props pattern is always identical; import sections from `parts/` relatively:
   ```vue
   <script setup lang="ts">
   import type { KirbyPage } from '../_shared/types'
   import type { PageContent } from './query'
   import Members from './parts/Members.vue'

   defineProps<{
     page: KirbyPage<PageContent>
   }>()
   </script>
   ```
4. Create the page in the Panel (pick the "Team" blueprint) or add demo content in `kirby/storage/content/`.

**How the rendering is found:** `<KirbyPageBody>` looks `page.intendedTemplate` up in the generated registry — if a package claims it, its component renders, otherwise the block list does. A page type therefore applies to **any number** of pages (blog articles, locations), not just to one URI.

**Cost:** Pages with their own page type need two KQL requests — the first returns the template, the second the fields of the package (both server-side). Block-based pages stay at one.

**Fixed fields *and* page builder:** Both in one page type works — `team` shows how. Add a tab with `sections: { blocks: sections/blocks }` in `page.yml`, select `blocks: 'page.blocks.toResolvedBlocks'` in `query.ts`, add `blocks: KirbyPageBlock[]` (from `#baukasten/blocks`) to `PageContent`, and render `<KirbyBlocks :blocks="page.blocks" />` in the component. The tab automatically picks up every new block type, because `fields/blocks` is assembled from `_blocks/`.

**What does *not* belong in a package:** Page types without their own rendering (`default`, `home`, `error`) stay as blueprints in `kirby/site/blueprints/pages/`. The same goes for the reusable Panel building blocks (`tabs/seo`, `sections/cover`, `fields/*`) — they are pure Panel configuration and are only referenced by the packages.

## Recipe 3: Add a field to an existing page type

All three in the same package, right next to each other:

1. Add the field in `_pages/<type>/page.yml` (for `default`/`home`/`error`: in `kirby/site/blueprints/pages/<type>.yml`).
2. Select the field in `_pages/<type>/query.ts` — scalar: `fieldname: true`; structure: `'page.field.toStructure'`; image: `{ query: 'page.field.toFile?.resize(1200)', select: [...] }`.
3. Extend `PageContent` in the same `query.ts` and render it in the component.

## Recipe 4: Global site field (nav, footer, settings)

1. Add the field in `kirby/site/blueprints/site.yml`.
2. Select it in `nuxt/app/queries/site.ts` (`siteQuery` + `KirbySiteData`).
3. Available everywhere via `useSite().value.<field>` (loaded by `app/plugins/site.ts`).

## Live preview (do not break it!)

The Panel preview button hangs on a chain that has to stay intact through any change:

1. The blueprint option `preview: "{{ page.frontendUrl }}"` → Kirby appends `?_token=…&_version=…` to the frontend URL.
2. `useKirbyPreview()` reads the query params; the page sends them as `X-Preview-*` headers (plus `X-Cacheable: false`) with the KQL request and uses `getPageQuery(uri, { draft: true })` (which also finds drafts).
3. The backend plugin `preview-token` verifies the token and switches `VersionId::$render` to the requested version; invalid preview headers are rejected with 403.

`useKirbyPage()` covers this for every page — including the second request of a page-type package. Always load custom routes through `useKirbyPage()`, never directly through `$kql`.

## Deployment (what goes where)

`_blocks/` and `_pages/` sit in the repo root but are needed by both sides. Both deployment paths account for that:

- **Kirby → server:** Besides `site/`, `public/` and `vendor/`, `_blocks/` and `_pages/` have to be uploaded into the Kirby root. `site/plugins/baukasten/package-root.php` finds them in both places — next to `kirby/` in a checkout, in the Kirby root on a server. Personal rsync/SSH scripts belong in `kirby/scripts/` and are excluded from the repo via `.gitignore` (they hold server credentials).
- **Nuxt → Vercel:** The root directory stays `nuxt`, but **"Include source files outside of the Root Directory in the Build Step" has to be enabled**, otherwise the packages are missing from the build. The module stops with exactly that message in that case, instead of shipping an empty registry.

## Checks before wrapping up

```bash
cd nuxt
pnpm lint        # ESLint
pnpm test:types  # TypeScript (covers _blocks/ and _pages/ as well)
```

For backend changes: `php -l` on the changed PHP files; blueprints are YAML (mind the indentation). With both dev servers running (`composer start` in `kirby/`, `pnpm dev` in `nuxt/`), check the changes in the browser at http://localhost:3000.

**Known limitation:** ESLint does not cover `_blocks/` and `_pages/` — the config lives in `nuxt/` and ESLint checks no files above its config directory. `pnpm test:types` does cover both folders, so for style in package components follow the existing packages.
