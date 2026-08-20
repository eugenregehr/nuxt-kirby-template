import type { HeadingLevel } from '../_shared/types'

export interface BlockContent {
  level: HeadingLevel
  heading?: string
  text?: string
  buttonlabel?: string
  link?: string | null
}
