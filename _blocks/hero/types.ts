export interface BlockContent {
  level: 'h1' | 'h2'
  headline: string
  text?: string
  buttonlabel?: string
  link?: string | null
}
