import { action, observable } from 'mobx';
import { search as searchApi, SearchPayload } from 'apis/search';

interface SearchResultItem {
  cypressMatch: number
  userAddress: string
  title: string
  uri: string
  content: string
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
  const resultItem: SearchResultItem = {
    cypressMatch: resItem['cypress.match'],
    userAddress: resItem.user_address,
    title: getDerivedTitle(resItem.title),
    uri: resItem.uri,
    content: resItem.content,
  };
  return resultItem;
};

const reset = action(() => {
  state.resultItems = [];
  state.total = 0;
});

const search = async (payload: SearchPayload) => {
  if (state.loading) {
    return;
  }
  state.searchWord = payload.q;
  state.loading = true;
  reset();
  try {
    const res = await searchApi(payload);
    state.isFetched = true;
    state.total = res.result.count;
    state.resultItems = res.result.items.map(formatResultItem);
  } finally {
    state.loading = false;
  }
};

export const SearchService = {
  state,
  search,
};
