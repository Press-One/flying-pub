import React from 'react';
import classNames from 'classnames';
import { action, observable } from 'mobx';
import { stringify } from 'query-string';
import { defineComponent, onMounted } from '@firefox-pro-coding/react-composition-api';
import { Button } from '@material-ui/core';
import Pagination, { PaginationProps } from '@material-ui/lab/Pagination';

import * as Utils from '@/utils';
import history from '@/history';
import SubPage from '@/components/SubPage';
import Loading from '@/components/Loading';

import { SearchService } from '@/service/search';
import { snackbarService } from '@/service/snackbar';
import { SearchInput } from './helper/SearchInput';

import './index.sass';

export default defineComponent(() => {
  const state = observable({
    page: 0,
    limit: 20 as const,

    query: String(Utils.getQuery('query') || ''),
    searchType: String(Utils.getQuery('type') || 'default') as 'default' | 'code' | 'section',
    language: String(Utils.getQuery('language') || 'all'),

    isSearched: false,
    get showLoading() {
      return !SearchService.state.isFetched || SearchService.state.loading;
    },
    get queryLanguage() {
      return this.language === 'all' ? undefined : this.language;
    },
  });

  const search = action(async (newPage: number = 0) => {
    if (!state.query) {
      return;
    }
    state.isSearched = true;
    state.page = newPage;
    history.replace(
      `/hub/app/search?${stringify({
        query: state.query,
        type: state.searchType,
        language: state.queryLanguage,
      })}`,
    );
    await SearchService.search({
      cy_tenantid: 'book.xue.cn',
      c: state.searchType,
      q: state.query,
      programming_language: state.searchType !== 'section' ? state.queryLanguage : undefined,
      cy_termmust: true,
      start: newPage * state.limit,
      num: state.limit,
    });
  });

  const handleChange = action((s: string) => { state.query = s; });

  const handleSearch = () => {
    if (!state.query) {
      snackbarService.error('请输入要搜索的内容');
      return;
    }
    search();
  };

  const handleEnter = () => {
    if (!state.query) {
      snackbarService.error('请输入要搜索的内容');
      return;
    }
    search();
  };

  const handleChangePage: PaginationProps['onChange'] = (_e, newPage) => {
    search(newPage - 1);
    window.scrollTo(0, 0);
  };

  onMounted(() => {
    if (state.query) {
      search();
    }
  });

  return () => (
    <SubPage renderTitle={() => <div>搜索</div>}>
      <div className="search-page">
        <div className="search-box mx-auto">
          <div className="search-toolbar flex items-center justify-center">
            <SearchInput
              className="search-input-box flex-1"
              value={state.query}
              onChange={handleChange}
              onEnter={handleEnter}
            />

            <Button
              className="bg-button-color ml-2"
              variant="contained"
              color="primary"
              onClick={handleSearch}
            >
              搜索
            </Button>
          </div>

          <div className="flex items-center mt-3 text-12">
            <div className="mr-8 text-gray-4a">
              搜索类型
            </div>
            {([
              { value: 'default', name: '搜索全部' },
              { value: 'code', name: '只搜代码' },
              { value: 'section', name: '只搜章节名' },
            ] as const).map((item) => (
              <div key={item.value}>
                <div
                  onClick={action(() => { state.searchType = item.value; })}
                  className={classNames(
                    item.value === state.searchType && 'bg-link text-white',
                    item.value !== state.searchType && 'text-gray-99',
                    'mr-2 cursor-pointer rounded px-2 py-1',
                  )}
                >
                  {item.name}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center mt-3 text-12">
            <div className="mr-8 text-gray-4a">
              搜索语言
            </div>
            {[
              { value: 'all', name: '全部语言' },
              { value: 'python', name: 'Python' },
              { value: 'javascript', name: 'Javascript' },
            ].map((item) => (
              <div key={item.value}>
                <div
                  onClick={action(() => { state.language = item.value; })}
                  className={classNames(
                    item.value === state.language && 'bg-link text-white',
                    item.value !== state.language && 'text-gray-99',
                    'mr-2 cursor-pointer rounded px-2 py-1 hover:underline',
                  )}
                >
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!state.isSearched && !Utils.getQuery('query') && (
          <div className="pt-12 pb-16 mt-6 text-gray-99 text-center">
            搜索你感兴趣的内容
          </div>
        )}

        {state.isSearched && (
          <div className="mt-8">
            {!state.showLoading && (<>
              {!SearchService.state.total && (
                <div className="pt-12 pb-16 mt-6 text-gray-99 text-center">
                  没有查询到相关的内容，换个关键词试一试？
                </div>
              )}

              {!!SearchService.state.total && (
                <div className="mt-2 pb-5">
                  <div className="text-gray-99 px-10 pb-2 text-14">
                    在书库中搜索到 <strong>{SearchService.state.total}</strong> 条结果
                  </div>
                  {SearchService.state.resultItems.map((resultItem, index) => {
                    const path = resultItem.bookPath + '/' + resultItem.uri;
                    const readerUrl = Utils.getReaderUrl({
                      bookId: resultItem.bookId,
                      path,
                    });
                    return (
                      <div key={index}>
                        <div className="border-t border-gray-e8 pt-3 pb-5 py-5 px-10 text-14">
                          <a
                            className="flex items-center leading-none py-2 font-bold nice-blue-color text-16"
                            href={readerUrl}
                            target="_blank"
                          >
                            <div>《{resultItem.bookName}》章节：</div>
                            {/* eslint-disable-next-line react/no-danger */}
                            <div dangerouslySetInnerHTML={{ __html: resultItem.title }} />
                          </a>
                          {resultItem.code && (
                            <div
                              className="mt-1 leading-relaxed text-gray-99 whitespace-pre-line p-5 bg-page-bg border-gray-e8 overflow-x-auto border-2 mb-1 searched-code"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: resultItem.code }}
                            />
                          )}
                          {resultItem.content && (
                            <div
                              className="pt-1 leading-relaxed text-gray-99 truncate-lines"
                              // eslint-disable-next-line react/no-danger
                              dangerouslySetInnerHTML={{ __html: resultItem.content }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>)}
            {!state.showLoading && SearchService.state.hasMore && (
              <div className="flex justify-center pb-5">
                <Pagination
                  count={Math.ceil(SearchService.state.total / state.limit)}
                  variant="outlined"
                  shape="rounded"
                  page={state.page + 1}
                  onChange={handleChangePage}
                />
              </div>
            )}
            {state.showLoading && (
              <div className="pt-2">
                <Loading spaceSize="large" />
              </div>
            )}
          </div>
        )}
      </div>
    </SubPage>
  );
});
