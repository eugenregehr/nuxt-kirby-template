import type { KirbyQueryResponse, KirbyQuerySchema } from 'kirby-types'

export interface KirbyErrorData {
  title: string
  headline: string
  text: string
}

export type KirbyErrorResponse = KirbyQueryResponse<KirbyErrorData>

export const errorQuery: KirbyQuerySchema = {
  query: 'site.errorPage',
  select: {
    title: true,
    headline: true,
    text: true,
  },
}
