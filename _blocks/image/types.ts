import type { ResolvedKirbyImage } from '../_shared/types'

export interface BlockContent {
  image: ResolvedKirbyImage[] | ResolvedKirbyImage | null
  alt?: string
  caption?: string
  link?: string
  location?: string
}
