import type { KirbyQueryResponse, KirbyQuerySchema } from 'kirby-types'

export interface KirbySiteChild {
  uri: string
  title: string
  isListed: boolean
}

export interface KirbySiteData {
  title: string
  seo_title: string
  seo_description: string
  children: KirbySiteChild[]
  cover?: {
    url: string
  }
  og_image?: {
    url: string
  }
}

export type KirbySiteResponse = KirbyQueryResponse<KirbySiteData>

export const siteQuery: KirbyQuerySchema = {
  query: 'site',
  select: {
    title: true,
    seo_title: true,
    seo_description: true,
    children: {
      query: 'site.children',
      select: ['uri', 'title', 'isListed'],
    },
    cover: {
      query: 'site.cover.toFile?.resize(1200)',
      select: ['url'],
    },
    og_image: {
      query: 'site.og_image.toFiles.first?.resize(1200)',
      select: ['url'],
    },
  },
}
