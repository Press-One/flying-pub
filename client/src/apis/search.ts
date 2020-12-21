import request from '../request';
import * as qs from 'query-string';

interface SearchResItem {
  'cypress.match': number
  cypress_updatetime: string
  date: string
  uri: string
  title: string
  content: string
  user_address: string
  xmluri: string
}

interface SearchRes {
  result: {
    querywords: string
    spellcorrect: string
    segment: string
    processtime: number
    querytime: number
    count: number
    items: Array<SearchResItem>
  }
}

export interface SearchPayload {
  q: string
  cy_termmust: boolean
  user_address?: string
  start: number
  num: number
}

export function search(payload: SearchPayload) {
  return request(`/api/search?${qs.stringify(payload as any)}`) as Promise<SearchRes>;
}
