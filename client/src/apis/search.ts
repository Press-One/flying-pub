import request from '../request';
import * as qs from 'query-string';

interface SearchResItem {
  'cypress.match': number
  code: string
  cypress_updatetime: string
  author: string
  domain: string
  title: string
  bookname: string
  keyword: string
  uri: string
  xmluri: string
  content: string
}

interface SearchRes {
  result: {
    spellcorrect: string
    segment: string
    count: number
    querywords: string
    time: number
    items: Array<SearchResItem>
  }
}

export interface SearchPayload {
  cy_tenantid: string
  c: 'default' | 'code' | 'section'
  q: string
  programming_language?: string
  cy_termmust: boolean
  author?: string
  start: number
  num: number
}

export function search(payload: SearchPayload) {
  return request(`/api/search?${qs.stringify(payload as any)}`) as Promise<SearchRes>;
}
