import type { HeadingLevel } from '../_shared/types'

export interface BlockContent {
  level: HeadingLevel
  heading?: string
  items: Array<{ question: string, answer: string }>
}
