import { action, observable } from 'mobx';
import { search as searchApi, SearchPayload } from 'apis/search';
import { IPost } from 'apis/post';
import { isMobile } from 'utils';
export interface SearchResultItem {
  cypressMatch: number
  userAddress: string
  title: string
  uri: string
  content: string
  post?: IPost
}

interface SearchOptions {
  isAdding: boolean;
}

const state = observable({
  searchWord: '',
  loading: false,
  total: 0,
  resultItems: [] as Array<SearchResultItem>,
  isFetched: false,
  get hasMore() {
    return this.resultItems.length < this.total;
  },
});

const getDerivedTitle = (title: string) => {
  if (title.startsWith('0 ')) {
    return title.slice(2);
  }
  return title;
};

const formatResultItem = (resItem: any) => {
  resItem.content = resItem.content || '';
  if (resItem.content.startsWith('...')) {
    resItem.content = resItem.content.replace('...', '');
  }
  if (isMobile) {
    const matchedKeyIndex = resItem.content.indexOf(`<span class='yx_hl'>`);
    if (matchedKeyIndex > 45) {
      resItem.content = resItem.content.slice(matchedKeyIndex - 10);
    }
  }
  const resultItem: SearchResultItem = {
    cypressMatch: resItem['cypress.match'],
    userAddress: resItem.user_address,
    title: getDerivedTitle(resItem.title),
    uri: resItem.uri,
    content: resItem.content,
    post: resItem.post
  };
  return resultItem;
};

const reset = action(() => {
  state.isFetched = false;
  state.loading = false;
  state.resultItems = [];
  state.total = 0;
});

const search = async (payload: SearchPayload, options: SearchOptions) => {
  if (state.loading) {
    return;
  }
  state.searchWord = payload.q;
  state.loading = true;
  try {
    const res = await searchApi(payload);
    state.isFetched = true;
    state.total = res.result.count;
    if (options.isAdding) {
      state.resultItems.push(...res.result.items.map(formatResultItem));
    } else {
      state.resultItems = res.result.items.map(formatResultItem);
    }
  } finally {
    state.loading = false;
  }
};

export const SearchService = {
  state,
  search,
  reset
};
