/**
 * Types shared by every block package.
 *
 * Block packages live outside the Nuxt app, so they import from here with a
 * relative path (`../_shared/types`) instead of the `#shared` alias.
 */

/** Shape produced by the `files` default resolver in the Kirby plugin */
export interface ResolvedKirbyImage {
  url: string
  width: number
  height: number
  srcset: string
  alt: string | null
}

export type HeadingLevel = 'h2' | 'h3' | 'none'

/**
 * A block as the frontend receives it. Block packages only declare their
 * content shape via `BlockContent`; the Baukasten module wraps it in this
 * envelope and derives `type` from the folder name.
 */
export interface KirbyBlock<TContent, TType extends string = string> {
  id: string
  type: TType
  isHidden?: boolean
  content: TContent
}
