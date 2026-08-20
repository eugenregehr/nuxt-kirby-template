import { existsSync, readdirSync, watch } from 'node:fs'
import { join, resolve } from 'node:path'
import { addTemplate, defineNuxtModule, useLogger } from '@nuxt/kit'

/**
 * Baukasten — makes the block and page packages known to the frontend.
 *
 * A **block package** (`_blocks/<typ>/`) is a folder holding a `block.yml`
 * (Kirby's business, see site/plugins/baukasten), exactly one `.vue`
 * component, a `types.ts` declaring its `BlockContent`, and optionally a
 * `resolver.php`. It becomes `#baukasten/blocks`:
 * - the `type` → component registry used by `<KirbyBlocks>`
 * - the `KirbyPageBlock` union of every renderable block
 *
 * A **page package** (`_pages/<typ>/`) is a folder holding a `page.yml`
 * (the Panel form), a `query.ts` declaring `PageContent` plus the KQL
 * `select`, and a `<Typ>.vue` entry component. It becomes
 * `#baukasten/pages`:
 * - the `intendedTemplate` → component registry used by `<KirbyPageBody>`
 * - the select fragment per template, merged in by `useKirbyPage`
 *
 * So no registry and no type union has to be maintained by hand. Adding a
 * block or a page type means adding a folder — nothing here changes.
 */

interface BlockPackage {
  /** Folder name — this is the Kirby block `type` */
  name: string
  /** PascalCase identifier used in the generated code */
  ident: string
  componentPath: string
  typesPath: string
}

interface PagePackage {
  /** Folder name — this is the Kirby template name (`intendedTemplate`) */
  name: string
  /** PascalCase identifier used in the generated code */
  ident: string
  componentPath: string
  queryPath: string
}

/** `hero` → `Hero`, `case-study` → `CaseStudy` */
function pascalCase(name: string): string {
  return name.replace(/(^|-)(\w)/g, (_, __, char: string) => char.toUpperCase())
}

function scanBlocks(blocksDir: string): BlockPackage[] {
  // Fail loudly rather than building an empty registry: a build without the
  // block catalogue would deploy successfully and silently render no blocks
  // at all. On hosts that scope the build to the app folder (e.g. Vercel with
  // Root Directory = "nuxt"), the packages must be included explicitly.
  if (!existsSync(blocksDir)) {
    throw new Error(
      `[baukasten] Block-Katalog nicht gefunden unter ${blocksDir}.\n`
      + 'Der Build braucht das Repo-Root, nicht nur nuxt/. Auf Vercel dafür\n'
      + '"Include source files outside of the Root Directory in the Build Step" aktivieren.',
    )
  }

  const packages = readdirSync(blocksDir, { withFileTypes: true })
    // `_shared` and friends are support folders, not blocks
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => {
      const dir = join(blocksDir, entry.name)
      const files = readdirSync(dir)
      const component = files.find(file => file.endsWith('.vue'))

      if (!component)
        throw new Error(`[baukasten] Block "${entry.name}" hat keine .vue-Komponente in ${dir}`)

      if (!files.includes('types.ts'))
        throw new Error(`[baukasten] Block "${entry.name}" hat keine types.ts in ${dir}`)

      if (!files.includes('block.yml'))
        throw new Error(`[baukasten] Block "${entry.name}" hat keine block.yml in ${dir}`)

      return {
        name: entry.name,
        ident: pascalCase(entry.name),
        componentPath: join(dir, component),
        typesPath: join(dir, 'types.ts'),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  if (packages.length === 0)
    throw new Error(`[baukasten] Keine Block-Pakete in ${blocksDir} gefunden.`)

  return packages
}

/**
 * Page types are optional — a project whose pages are all block-based has no
 * `_pages/` directory at all, which is why this returns an empty list instead
 * of throwing.
 */
function scanPages(pagesDir: string): PagePackage[] {
  if (!existsSync(pagesDir))
    return []

  return readdirSync(pagesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => {
      const dir = join(pagesDir, entry.name)
      const files = readdirSync(dir)
      const ident = pascalCase(entry.name)
      // The entry component is named after the folder; further `.vue` files
      // (typically in `parts/`) are that page type's own sections and are
      // imported relatively, so they need no registry.
      const component = `${ident}.vue`

      if (!files.includes(component))
        throw new Error(`[baukasten] Seitentyp "${entry.name}" hat keine ${component} in ${dir}`)

      if (!files.includes('query.ts'))
        throw new Error(`[baukasten] Seitentyp "${entry.name}" hat keine query.ts in ${dir}`)

      if (!files.includes('page.yml'))
        throw new Error(`[baukasten] Seitentyp "${entry.name}" hat keine page.yml in ${dir}`)

      return {
        name: entry.name,
        ident,
        componentPath: join(dir, component),
        queryPath: join(dir, 'query.ts'),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default defineNuxtModule({
  meta: {
    name: 'baukasten',
    configKey: 'baukasten',
  },

  setup(_options, nuxt) {
    const repoRoot = resolve(nuxt.options.rootDir, '..')
    const blocksDir = join(repoRoot, '_blocks')
    const pagesDir = join(repoRoot, '_pages')
    const blocks = scanBlocks(blocksDir)
    const pages = scanPages(pagesDir)

    // The packages live outside `app/`, so they are not covered by the
    // default auto-import scope. Opt them in explicitly.
    nuxt.options.imports.transform ||= {}
    nuxt.options.imports.transform.include ||= []

    // Vite refuses to serve files above the project root unless allowed
    nuxt.options.vite.server ||= {}
    nuxt.options.vite.server.fs ||= {}
    nuxt.options.vite.server.fs.allow ||= []

    for (const dir of [blocksDir, pagesDir]) {
      nuxt.options.imports.transform.include.push(
        new RegExp(`^${dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
      )
      nuxt.options.vite.server.fs.allow.push(dir)
    }

    // Type-check the packages alongside the app
    nuxt.options.typescript.tsConfig ||= {}
    nuxt.options.typescript.tsConfig.include ||= []
    nuxt.options.typescript.tsConfig.include.push('../../_blocks/**/*', '../../_pages/**/*')

    // Nuxt's dev watcher only covers the app directory, so adding or removing
    // a package would go unnoticed. Watch the catalogues ourselves and
    // restart, which re-scans and regenerates the templates below.
    if (nuxt.options.dev) {
      // 'rename' fires when a file or folder appears or disappears — that is
      // when a catalogue changed. Plain 'change' edits are Vite's job.
      const watchers = [blocksDir, pagesDir]
        .filter(dir => existsSync(dir))
        .map(dir => watch(dir, { recursive: true }, (event) => {
          if (event === 'rename')
            nuxt.callHook('restart')
        }))

      nuxt.hook('close', () => watchers.forEach(watcher => watcher.close()))
    }

    const blocksTemplate = addTemplate({
      filename: 'baukasten/blocks.ts',
      write: true,
      getContents: () => {
        const imports = blocks
          .map(b => `import type { BlockContent as ${b.ident}Content } from ${JSON.stringify(b.typesPath)}`)
          .join('\n')

        const types = blocks
          .map(b => `export type ${b.ident}Block = KirbyBlock<${b.ident}Content, '${b.name}'>`)
          .join('\n')

        const union = blocks.map(b => `${b.ident}Block`).join('\n  | ')

        const registry = blocks
          .map(b => `  ${JSON.stringify(b.name)}: defineAsyncComponent(() => import(${JSON.stringify(b.componentPath)})),`)
          .join('\n')

        return `// Generated by modules/baukasten.ts — do not edit.
// Add a folder under _blocks/ instead; this file follows automatically.
import type { Component } from 'vue'
import type { KirbyBlock } from ${JSON.stringify(join(blocksDir, '_shared/types'))}
${imports}
import { defineAsyncComponent } from 'vue'

export type { HeadingLevel, KirbyBlock, ResolvedKirbyImage } from ${JSON.stringify(join(blocksDir, '_shared/types'))}

${types}

/** Union of every block type the frontend can render */
export type KirbyPageBlock
  = ${union}

/** Registry mapping a Kirby block \`type\` to its component */
export const blockComponents: Record<string, Component> = {
${registry}
}
`
      },
    })

    nuxt.options.alias['#baukasten/blocks'] = blocksTemplate.dst

    const pagesTemplate = addTemplate({
      filename: 'baukasten/pages.ts',
      write: true,
      getContents: () => {
        const sharedTypes = JSON.stringify(join(pagesDir, '_shared/types'))

        const imports = pages
          .flatMap(p => [
            `import type { PageContent as ${p.ident}Content } from ${JSON.stringify(p.queryPath)}`,
            `import { select as ${p.name}Select } from ${JSON.stringify(p.queryPath)}`,
          ])
          .join('\n')

        const types = pages
          .map(p => `export type Kirby${p.ident}Page = KirbyPage<${p.ident}Content>`)
          .join('\n')

        const union = pages.length > 0
          ? pages.map(p => `Kirby${p.ident}Page`).join('\n  | ')
          : 'never'

        const registry = pages
          .map(p => `  ${JSON.stringify(p.name)}: defineAsyncComponent(() => import(${JSON.stringify(p.componentPath)})),`)
          .join('\n')

        const selects = pages
          .map(p => `  ${JSON.stringify(p.name)}: ${p.name}Select,`)
          .join('\n')

        return `// Generated by modules/baukasten.ts — do not edit.
// Add a folder under _pages/ instead; this file follows automatically.
import type { Component } from 'vue'
import type { KirbyPage, KirbyPageSelect } from ${sharedTypes}
${imports}
import { defineAsyncComponent } from 'vue'

export type { KirbyPage, KirbyPageSelect, KirbySharedPageData } from ${sharedTypes}

${types}

/** Union of every page type that brings its own rendering */
export type KirbyTemplatePage
  = ${union}

/** Registry mapping a Kirby \`intendedTemplate\` to its page component */
export const pageComponents: Record<string, Component> = {
${registry}
}

/** KQL select fragment per template, merged with \`sharedQuerySelects\` */
export const pageSelects: Record<string, KirbyPageSelect> = {
${selects}
}
`
      },
    })

    nuxt.options.alias['#baukasten/pages'] = pagesTemplate.dst

    const logger = useLogger('baukasten')

    logger.info(`${blocks.length} Blöcke registriert: ${blocks.map(b => b.name).join(', ')}`)
    logger.info(
      pages.length > 0
        ? `${pages.length} Seitentypen registriert: ${pages.map(p => p.name).join(', ')}`
        : 'Keine Seitentypen unter _pages/ — alle Seiten sind block-basiert',
    )
  },
})
