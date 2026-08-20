# Nuxt + Kirby Template — Architektur & Rezepte

Dieses Repo ist ein Template für Websites mit headless Kirby CMS (`kirby/`) und Nuxt-4-Frontend (`nuxt/`). Diese Datei beschreibt die Konventionen und die Standard-Rezepte für neue Features. **Neue Features immer nach diesen Rezepten bauen** — Backend und Frontend müssen synchron bleiben.

## Architektur

```
_blocks/<typ>/ ein Ordner = ein Block      _pages/<typ>/ ein Ordner = ein Seitentyp
├── block.yml    ─► Blueprint + Palette    ├── page.yml   ─► Page-Blueprint (Tabs/Sections)
├── resolver.php ─► blocks-resolver.php    ├── query.ts   ─► select + PageContent
└── Typ.vue + types.ts ─► Registry+Union   └── Typ.vue (+ parts/) ─► Template-Registry

Kirby Panel (Redakteur)                Nuxt Frontend (Besucher)
        │                                      │
   Blueprints aus den Paketen         useKql(query) in Page/Plugin
   Content als Blöcke/Felder                   │
        │                              Server-Proxy (/api/__kirby__)
        ▼                                      │  Bearer-Token, nie im Browser
   storage/content/*.txt   ◄──  POST /api/kql ─┘
        │
   toResolvedBlocks + blocks-resolver.php
        └─► sauberes JSON ─► KirbyPageBody.vue
                             ├─ Template-Paket? ─► #baukasten/pages
                             └─ sonst KirbyBlocks ─► #baukasten/blocks
```

- **Datenfluss:** Nuxt-Seiten holen Inhalte per KQL (`useKql` aus `nuxt-kirby`). Alle Requests laufen über den Server-Proxy; `KIRBY_API_TOKEN` bleibt serverseitig.
- **Pakete:** Ein Block ist **ein Ordner unter `_blocks/`**, ein Seitentyp **ein Ordner unter `_pages/`** — beide im Repo-Root, beide Systeme finden sie von selbst. Kirby registriert die Blueprints über `site/plugins/baukasten/`, Nuxt erzeugt Registries und Type-Unions über `modules/baukasten.ts`. Es gibt **keine** Liste, in die etwas eingetragen werden müsste.
- **Content-Modell:** Eine Seite = feste Meta-Felder (title, cover, SEO-Tab) + entweder ein flexibles `blocks`-Feld (Page-Builder) oder die festen Felder ihres Seitentyps. Der Ordnername unter `_blocks/` *ist* der Kirby-Block-Typ, der unter `_pages/` *ist* der Template-Name.
- **Sprachen:** Kirby-Multilanguage (de Standard, en) ↔ `@nuxtjs/i18n` mit `prefix_except_default`. KQL-Requests senden die Sprache via `language`-Option (`X-Language`-Header). UI-Texte (Footer etc.) liegen in `nuxt/i18n/locales/*.json`, **alle Inhalte kommen aus Kirby**.
- **Routing:** Es gibt genau zwei Routen — `app/pages/index.vue` (rendert `home`) und `app/pages/[...slug].vue` (jede andere Kirby-Seite). Welche Komponente greift, entscheidet `<KirbyPageBody>` anhand von `intendedTemplate`: neue Seiten **und** neue Seitentypen brauchen keinen Routing-Code.

## Wichtige Dateien

| Datei | Zweck |
| --- | --- |
| `_blocks/<typ>/` | **Ein Block-Paket** — die einzige Stelle, die man für einen Block anfasst |
| `_pages/<typ>/` | **Ein Seitentyp-Paket** — Panel-Formular, Query und Rendering eines Templates |
| `_pages/_shared/types.ts` | `KirbySharedPageData`, `KirbyPage<T>`, `KirbyPageSelect` |
| `_pages/_shared/catalog.php` | Scannt `_pages/` — vom Kirby-Plugin genutzt |
| `_blocks/_shared/types.ts` | `KirbyBlock`, `ResolvedKirbyImage`, `HeadingLevel` für alle Blöcke |
| `_blocks/_shared/resolvers.php` | Wiederverwendbare Resolver (`link`, `richText`, `kirbytext`, `headingLevel`) |
| `_blocks/_shared/categories.yml` | Gruppen der Block-Palette im Page-Builder |
| `_blocks/_shared/catalog.php` | Scannt `_blocks/` — von Kirby-Plugin und Resolver gemeinsam genutzt |
| `kirby/site/plugins/baukasten/` | Registriert Block- und Page-Blueprints, baut das `fields/blocks`-Feld |
| `kirby/site/config/blocks-resolver.php` | Sammelt die `resolver.php` der Block-Pakete ein (Keys werden zu `blockTyp:feld`) |
| `nuxt/modules/baukasten.ts` | Erzeugt `#baukasten/blocks` und `#baukasten/pages` (Registries + Type-Unions) |
| `kirby/site/blueprints/tabs/seo.yml` | Wiederverwendbarer SEO-Tab (`seo: tabs/seo` in jedem Page-Blueprint) |
| `kirby/site/config/config.php` | KQL-Auth, Headless-Optionen, Sitemap-Ausschlüsse |
| `kirby/site/plugins/preview-token/` | Verifiziert Panel-Preview-Tokens, schaltet Draft-Version frei |
| `nuxt/app/queries/*.ts` | Globale Queries (Site, Error) — Seitentyp-Queries liegen im Paket |
| `nuxt/app/queries/page.ts` | `sharedQuerySelects` (SEO-Fragment, in jede Page-Query spreaden) + `getPageQuery()` |
| `nuxt/app/components/Kirby/PageBody.vue` | Rendert eine Seite: Seitentyp-Komponente oder Blockliste |
| `nuxt/app/components/Kirby/Blocks.vue` | Rendert eine Blockliste über die generierte Registry |
| `nuxt/app/composables/kirbyPage.ts` | `useKirbyPage(uri)` — Standard-Weg, Seitendaten zu laden (Fetch + Preview + 404 + `setPage`) |
| `nuxt/app/composables/page.ts` | `usePage()` / `setPage()` (globaler Page-State + SEO-Meta) |
| `nuxt/app/composables/preview.ts` | `useKirbyPreview()` für Panel-Live-Preview |
| `nuxt/app/plugins/site.ts` | Lädt globale Site-Daten (Nav, SEO-Defaults) pro SSR-Request |

## Konventionen

- **Feldnamen in Block-Blueprints klein schreiben** (`buttonlabel`, nicht `buttonLabel`) — Kirby liefert Block-Content-Keys lowercase; die TS-Types müssen exakt passen.
- Überschriften-Blöcke nutzen das Muster `level` (select: h2/h3/none) + `heading` (text); der geteilte Resolver `headingLevel` liefert immer einen String.
- Blöcke rendern ihre Überschrift **nie** mit fest verdrahtetem Tag: `<component :is="block.content.level">`. Der Hero macht das mit `level` (h1/h2, Default h1), damit eine Seite genau ein `h1` behält, auch wenn ein Hero mitten im Page-Builder steht.
- Structure-Felder werden **immer** im Resolver zu einfachen Arrays aufgelöst (`toStructure()->map(...)->values()`), nie roh ans Frontend gegeben.
- Link-Felder werden im Resolver zu URL-Strings aufgelöst; interne Links werden zu Pfaden (`/bloecke`), damit `<NuxtLink>` sie direkt nutzen kann.
- Paket-Dateien (`_blocks/`, `_pages/`) liegen außerhalb der Nuxt-App: eigene Dateien **relativ** importieren (`../_shared/types`), nie über `#shared`, und **keine npm-Pakete** — `node_modules` gibt es nur in `nuxt/`. Deshalb bringt `_pages/_shared/types.ts` seinen eigenen `KirbyPageSelect`-Typ mit, statt `kirby-types` zu benutzen. Erlaubt sind dagegen die **generierten Aliase** `#baukasten/blocks` / `#baukasten/pages` — so kommt ein Seitentyp an den `KirbyPageBlock`-Union-Typ.
- Tailwind-Klassen in Paket-Komponenten sind über `@source` in `app/assets/css/main.css` abgedeckt (`blocks`, `pages`) — bei neuen Ordnern außerhalb davon daran denken.
- Jede Page-Query spreadet `...sharedQuerySelects` (SEO/Cover-Felder); Seiten laden ihre Daten über `useKirbyPage(uri)` (ruft intern `setPage()` auf).
- **Seiten in KQL immer mit `site.find("...")` suchen, nie mit `page("...")`** — der `page()`-Helper liefert auch unveröffentlichte Entwürfe aus. `site.findPageOrDraft` nur im Preview-Modus verwenden (das Backend lehnt ungültige Preview-Header mit 403 ab).
- `useKirbyPage` fetcht über `$kql` in einem eigenen `useAsyncData` (statt über `useKql`), damit der Cache-Key pro Sprache/URI/Preview eindeutig bleibt und die zweite Anfrage eines Seitentyp-Pakets bedingt laufen kann. Die Payload-Cache-Option heißt seit nuxt-kirby 4 `payloadCache` (vorher `cache`).
- Nach einem `await` in Composables gehen Nuxt-Composables (`useState`, `useRoute`, …) verloren — `nuxtApp.runWithContext(() => ...)` verwenden (siehe `useKirbyPage`).
- **Übersetzte Slugs:** Ein `Slug:`-Feld in einer Übersetzungs-Content-Datei (z. B. `default.en.txt`) gibt der Seite in dieser Sprache eine eigene URL (`/bloecke` ↔ `/en/blocks`). Damit Sprachumschalter und hreflang folgen, selektiert jede Page-Query `i18nMeta` (Page-Method aus kirby-headless) und `setPage()` reicht die URIs per `useSetI18nParams()` an Nuxt i18n weiter.
- **`<NuxtLayout>` rendern die Seiten selbst**, nicht `app.vue`. Ein Layout um `<NuxtPage>` rendert seinen Header, *bevor* das async `setup()` der Seite die übersetzten Slugs geholt hat — der Sprachumschalter zeigt dann auf die falsche URL.
- Kirby findet eine Seite unter dem Slug **jeder** Sprache, `/en/bloecke` liefert also dieselbe Seite wie `/en/blocks`. `useKirbyPage` leitet deshalb alles außer dem kanonischen Pfad der aktiven Sprache per 301 um (auch `/home` → `/`); im Preview-Modus wird das übersprungen, weil die Query-Parameter des Panels sonst verloren gingen.
- Jedes Page-Blueprint setzt `options.preview: "{{ page.frontendUrl }}"`, sonst funktioniert der Panel-Preview-Button nicht.
- Jedes Page-Blueprint bekommt den wiederverwendbaren SEO-Tab: `tabs: { content: ..., seo: tabs/seo }`. Leere SEO-Felder fallen im Frontend automatisch auf die Site-SEO-Einstellungen zurück (Fallback-Kette in `setPage()`).
- Rich-Text (writer/textarea mit Links) im Resolver durch `permalinksToUrls()` schicken, damit `page://`-UUIDs zu URLs werden.
- Demo-/Beispielinhalte liegen in `kirby/storage/content/` (Kirby-Textformat; `blocks`-Felder sind einzeilige JSON-Arrays): `1_home` (Pitch), `2_bloecke` (alle Block-Typen auf einer Seite, en-Slug `blocks`) mit Unterseite (en-Slug `subpage`), `3_team` (Seitentyp-Paket), `error` und ein Entwurf unter `_drafts/entwurf` für den Preview-Button. Jede Seite existiert auf de und en.

## Rezept 1: Neuen Block-Typ hinzufügen

**Ein Ordner unter `_blocks/` — mehr nicht.** Es gibt keine Registrierung, keine Union, keinen Registry-Eintrag. Der Ordnername *ist* der Kirby-Block-Typ. Beispiel: Block `testimonial` mit Zitat, Name und Bild.

```
_blocks/testimonial/
  block.yml          Pflicht — Panel-Formular + Baukasten-Metadaten
  types.ts           Pflicht — BlockContent
  Testimonial.vue    Pflicht — genau eine .vue pro Ordner
  resolver.php       optional — nur für Structure-/Link-/Rich-Text-Felder
```

1. **`block.yml`** — der `baukasten`-Block wird vor der Blueprint-Registrierung abgetrennt, alles darunter ist ein normales Kirby-Block-Blueprint:
   ```yaml
   baukasten:
     category: sections     # Gruppe aus _blocks/_shared/categories.yml
     order: 40              # Position innerhalb der Gruppe

   name:
     en: Testimonial
     de: Testimonial
   icon: chat
   preview: fields
   wysiwyg: true
   fields:
     quote:
       label: Zitat
       type: textarea
       buttons: false
       required: true
     name:
       label: Name
       type: text
     image:
       label: Bild
       type: files
       max: 1
       uploads:
         template: blocks/image
   ```
2. **`types.ts`** — nur der Inhalt; die `id`/`type`/`isHidden`-Hülle kommt vom Modul:
   ```ts
   import type { ResolvedKirbyImage } from '../_shared/types'

   export interface BlockContent {
     quote: string
     name?: string
     image: ResolvedKirbyImage[] | null
   }
   ```
3. **`Testimonial.vue`** — Props-Pattern immer identisch:
   ```vue
   <script setup lang="ts">
   import type { KirbyBlock } from '../_shared/types'
   import type { BlockContent } from './types'

   defineProps<{
     block: KirbyBlock<BlockContent, 'testimonial'>
   }>()
   </script>
   ```
4. **`resolver.php`** — nur anlegen, wenn Felder Transformation brauchen. Einzelne `files`-Felder löst der `defaultResolvers.files`-Fallback automatisch auf:
   ```php
   <?php

   return fn (array $r) => [
       'link' => $r['link'],
   ];
   ```
   Die Keys werden automatisch zu `testimonial:link`. Eigene Logik als Closure `fn (Field $field, Block $block) => …` (Beispiel: `_blocks/faq/resolver.php`).

**Kirby-Standardblöcke** (`text`, `heading`, `image`, …) haben `baukasten.builtin: true` und kein `fields` — sie nutzen Kirbys eigenes Blueprint und liefern nur Komponente und Types. `name` und `icon` tragen sie trotzdem: daraus baut sich die Palette im Page-Builder.

Der Dev-Server startet bei einem neuen Ordner automatisch neu; Kirby liest den Katalog bei jedem Request. Fehlt eine der drei Pflichtdateien, bricht der Nuxt-Build mit einer klaren Meldung ab.

## Rezept 2: Neuen Seitentyp (eigene Tabs, Sections, Rendering) hinzufügen

**Ein Ordner unter `_pages/` — mehr nicht.** Wie bei den Blöcken: keine Route, kein Query-Re-Export, keine Registry. Der Ordnername *ist* der Kirby-Template-Name; die Catch-all-Route rendert jede Seite mit diesem Template über die Paket-Komponente. Der Seitentyp `team` ist das vollständige Beispiel im Template.

```
_pages/team/
  page.yml           Pflicht — Kirby-Page-Blueprint: Tabs, Sections, Felder
  query.ts           Pflicht — PageContent + KQL-select
  Team.vue           Pflicht — Einstiegskomponente, PascalCase des Ordnernamens
  parts/*.vue        optional — eigene Sections dieses Seitentyps
```

1. **`page.yml`** — ein normales Kirby-Page-Blueprint. Wiederverwendbare Bausteine aus `kirby/site/blueprints/` referenzieren:
   ```yaml
   title: Team
   icon: users

   options:
     preview: "{{ page.frontendUrl }}"     # sonst kein Preview-Button

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
     seo: tabs/seo                          # jeder Seitentyp bekommt den SEO-Tab
   ```
2. **`query.ts`** — was dieser Typ zusätzlich zu den geteilten Feldern braucht. `sharedQuerySelects` (Titel, SEO, Cover) mischt `useKirbyPage` selbst dazu:
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
   Hinweis: `toStructure` liefert die Items roh — verschachtelte Bilder/Links über ein nested `select` (`{ query: 'page.feld.toFile', select: [...] }`) auflösen.
3. **`Team.vue`** — Props-Pattern immer identisch, Sections aus `parts/` relativ importieren:
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
4. Seite im Panel anlegen (Blueprint „Team" wählen) oder Demo-Content in `kirby/storage/content/` ergänzen.

**Wie das Rendering findet:** `<KirbyPageBody>` schlägt `page.intendedTemplate` in der generierten Registry nach — gibt es ein Paket, rendert dessen Komponente, sonst die Blockliste. Damit gilt ein Seitentyp für **beliebig viele** Seiten (Blog-Artikel, Standorte), nicht nur für eine URI.

**Kosten:** Seiten mit eigenem Seitentyp brauchen zwei KQL-Requests — der erste liefert das Template, der zweite die Felder des Pakets (beide SSR-seitig). Block-basierte Seiten bleiben bei einem.

**Feste Felder *und* Page-Builder:** Beides in einem Seitentyp geht — `team` macht es vor. Im `page.yml` einen Tab mit `sections: { blocks: sections/blocks }` ergänzen, in `query.ts` `blocks: 'page.blocks.toResolvedBlocks'` selektieren und `blocks: KirbyPageBlock[]` (aus `#baukasten/blocks`) in `PageContent` aufnehmen, in der Komponente `<KirbyBlocks :blocks="page.blocks" />` rendern. Der Tab bekommt automatisch jeden neuen Block-Typ, weil `fields/blocks` aus `_blocks/` zusammengebaut wird.

**Was *nicht* ins Paket gehört:** Seitentypen ohne eigenes Rendering (`default`, `home`, `error`) bleiben als Blueprint in `kirby/site/blueprints/pages/`. Ebenso die wiederverwendbaren Panel-Bausteine (`tabs/seo`, `sections/cover`, `fields/*`) — sie sind reine Panel-Konfiguration und werden von den Paketen nur referenziert.

## Rezept 3: Feld zu bestehendem Seitentyp hinzufügen

Alles drei im selben Paket, direkt nebeneinander:

1. Feld in `_pages/<typ>/page.yml` ergänzen (bei `default`/`home`/`error`: in `kirby/site/blueprints/pages/<typ>.yml`).
2. Feld in `_pages/<typ>/query.ts` selektieren — Skalar: `feldname: true`; Structure: `'page.feld.toStructure'`; Bild: `{ query: 'page.feld.toFile?.resize(1200)', select: [...] }`.
3. `PageContent` im selben `query.ts` erweitern und in der Komponente rendern.

## Rezept 4: Globales Site-Feld (Nav, Footer, Settings)

1. Feld in `kirby/site/blueprints/site.yml` ergänzen.
2. In `nuxt/app/queries/site.ts` (`siteQuery` + `KirbySiteData`) selektieren.
3. Überall via `useSite().value.<feld>` verfügbar (wird von `app/plugins/site.ts` geladen).

## Live-Preview (nicht kaputt machen!)

Der Panel-Preview-Button hängt an einer Kette, die bei Änderungen intakt bleiben muss:

1. Blueprint-Option `preview: "{{ page.frontendUrl }}"` → Kirby hängt `?_token=…&_version=…` an die Frontend-URL.
2. `useKirbyPreview()` liest die Query-Params; die Seite sendet sie als `X-Preview-*`-Header (+ `X-Cacheable: false`) mit der KQL-Anfrage und nutzt `getPageQuery(uri, { draft: true })` (findet auch Entwürfe).
3. Das Backend-Plugin `preview-token` verifiziert den Token und schaltet `VersionId::$render` auf die angeforderte Version; ungültige Preview-Header werden mit 403 abgelehnt.

`useKirbyPage()` deckt das für alle Seiten ab — auch für die zweite Anfrage eines Seitentyp-Pakets. Eigene Routen daher immer über `useKirbyPage()` laden, nie direkt über `$kql`.

## Deployment (was wo hin muss)

`_blocks/` und `_pages/` liegen im Repo-Root, werden aber von beiden Seiten gebraucht. Beide Deploy-Wege sind darauf eingestellt:

- **Kirby → Server:** Neben `site/`, `public/` und `vendor/` müssen auch `_blocks/` und `_pages/` in den Kirby-Root hochgeladen werden. `site/plugins/baukasten/package-root.php` findet sie an beiden Stellen — neben `kirby/` im Checkout, im Kirby-Root auf dem Server. Eigene rsync-/SSH-Skripte gehören nach `kirby/scripts/` und sind per `.gitignore` vom Repo ausgeschlossen (Serverdaten).
- **Nuxt → Vercel:** Root Directory bleibt `nuxt`, aber **„Include source files outside of the Root Directory in the Build Step" muss aktiviert sein**, sonst fehlen die Pakete im Build. Das Modul bricht in dem Fall mit genau dieser Meldung ab, statt eine leere Registry auszuliefern.

## Checks vor dem Abschluss

```bash
cd nuxt
pnpm lint        # ESLint
pnpm test:types  # TypeScript (deckt _blocks/ und _pages/ mit ab)
```

Für Backend-Änderungen: `php -l` auf geänderte PHP-Dateien; Blueprints sind YAML (Einrückung beachten). Wenn beide Dev-Server laufen (`composer start` in `kirby/`, `pnpm dev` in `nuxt/`), Änderungen im Browser unter http://localhost:3000 prüfen.

**Bekannte Grenze:** ESLint erfasst `_blocks/` und `_pages/` nicht — die Config liegt in `nuxt/` und ESLint prüft keine Dateien oberhalb ihres Config-Verzeichnisses. `pnpm test:types` deckt beide Ordner ab, Stil in Paket-Komponenten also an den vorhandenen Paketen orientieren.
