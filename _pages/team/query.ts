import type { KirbyPageBlock } from '#baukasten/blocks'
import type { KirbyPageSelect } from '../_shared/types'

/**
 * The fields this page type adds on top of the shared page fields (title,
 * SEO, cover — those come from `sharedQuerySelects` and are merged in by
 * `useKirbyPage`).
 */
export interface KirbyTeamMember {
  name: string
  role: string
}

export interface PageContent {
  headline: string
  intro: string
  members: KirbyTeamMember[]
  /** Page-builder tab: the same block catalog block-based pages use */
  blocks: KirbyPageBlock[]
}

/** KQL select fragment, applied to every page using the `team` template */
export const select: KirbyPageSelect = {
  headline: true,
  intro: true,
  members: 'page.members.toStructure',
  blocks: 'page.blocks.toResolvedBlocks',
}
