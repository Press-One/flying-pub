import { action, observable, runInAction } from 'mobx';
import { search as searchApi, SearchPayload } from 'apis/search';
import { runLoading } from 'utils';

interface SearchResultItem {
  cypressMatch: number
  code: string
  author: string
  title: string
  bookId: number
  bookName: string
  bookPath: string
  uri: string
  content: string
}

const state = observable({
  searchWord: '',
  searchType: 'default' as SearchPayload['c'],
  searchLanguage: 'default' as SearchPayload['programming_language'],
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
    code: resItem.code,
    author: resItem.author,
    title: getDerivedTitle(resItem.title),
    bookId: Number(resItem.bookid),
    bookName: resItem.displayname,
    bookPath: resItem.bookpath,
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
  state.loading = true;
  reset();

  await runLoading(
    (l) => { state.loading = l; },
    async () => {
      state.searchWord = payload.q;
      state.searchType = payload.c;
      state.searchLanguage = payload.programming_language;
      const [res] = await Promise.all([
        searchApi(payload)
      ]);
      runInAction(() => {
        state.isFetched = true;
        state.total = res.result.count;
        state.resultItems = res.result.items.map(formatResultItem);
      });
    },
  );
};

export const SearchService = {
  state,

  search,
};
