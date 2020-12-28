import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Pagination, { PaginationProps } from '@material-ui/lab/Pagination';
import { getQuery, setQuery } from 'utils';
import Loading from 'components/Loading';
import { useStore } from 'store';
import { SearchService, SearchResultItem } from './helper/SearchService';
import classNames from 'classnames';
import BottomLine from 'components/BottomLine';
import { isMobile, isPc, getImageWidth, ago } from 'utils';
import Img from 'components/Img';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';
import SmartLink from 'components/SmartLink';
import BackToTop from 'components/BackToTop';
import BackButton from 'components/BackButton';

const ItemEntry = observer((props: { index: number; item: SearchResultItem }) => {
  const { index, item } = props;
  const coverWidth = isMobile ? 70 : 120;
  const COVER_RATIO = isMobile ? 1 : 3 / 2;
  const state = useLocalStore(() => ({
    useOriginalCover: false,
  }));

  return (
    <SmartLink to={item.uri} openInNew={isPc}>
      <div
        className={classNames(
          {
            'border-b': index < SearchService.state.total - 1 || SearchService.state.hasMore,
          },
          'border-gray-200 px-4 py-10-px md:py-3 text-14',
        )}
      >
        <div
          className="leading-snug pt-1 pb-6-px font-bold text-16"
          dangerouslySetInnerHTML={{ __html: item.title }}
        />
        <div className="flex">
          <div className="flex-1">
            <div
              className="flex flex-col justify-between items-start"
              style={{
                height: item.post && item.post.cover ? coverWidth / COVER_RATIO : 'auto',
              }}
            >
              {item.content && (
                <div
                  className="leading-normal text-gray-99 truncate-lines mb-1"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
              {item.post && (
                <div className="flex items-center text-gray-af text-12 pt-1">
                  <div className="flex items-center w-5 h-5 mr-1">
                    <Img
                      className="w-5 h-5 rounded-full border border-gray-300"
                      src={item.post.author.avatar}
                      alt={'头像'}
                    />
                  </div>
                  <div className="max-w-20 truncate">
                    {item.post.author && item.post.author.nickname}
                  </div>
                  <div className="ml-3">{ago(item.post.pubDate)}</div>
                </div>
              )}
            </div>
          </div>
          {item.content && item.post && item.post.cover && (
            <div
              className="cover cover-container rounded ml-8-px md:ml-3"
              style={{
                backgroundImage: state.useOriginalCover
                  ? `url(${item.post.cover})`
                  : `url(${item.post.cover}?image=&action=resize:h_${
                      getImageWidth(coverWidth) / COVER_RATIO
                    })`,
              }}
            >
              <img
                className="cover rounded invisible"
                src={`${item.post.cover}?image=&action=resize:h_${
                  getImageWidth(coverWidth) / COVER_RATIO
                }`}
                alt="封面"
                onError={() => {
                  if (!state.useOriginalCover) {
                    state.useOriginalCover = true;
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .truncate-lines {
          text-overflow: ellipsis;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .cover-container {
          background-size: cover;
          background-position: center center;
        }
        .cover {
          width: ${coverWidth}px;
          height: ${coverWidth / COVER_RATIO}px;
        }
      `}</style>
    </SmartLink>
  );
});

export default observer(() => {
  const { settingsStore } = useStore();
  const state = useLocalStore(() => ({
    page: 0,
    limit: 20,
    query: getQuery('query'),
    isSearched: false,
  }));
  const address = getQuery('address') || '';

  const infiniteRef: any = useWindowInfiniteScroll({
    disabled: isPc,
    loading: SearchService.state.loading,
    hasNextPage: SearchService.state.hasMore,
    threshold: 350,
    onLoadMore: () => {
      if (!SearchService.state.loading) {
        state.page = state.page + 1;
      }
    },
  });

  const search = React.useCallback(
    (value: string) => {
      (async () => {
        if (!value || SearchService.state.loading) {
          return;
        }
        state.query = value;
        state.isSearched = true;
        let queryParam: any = {
          query: state.query,
        };
        let searchParam: any = {
          q: state.query,
          cy_termmust: true,
          start: state.page * state.limit,
          num: state.limit,
        };
        if (address) {
          searchParam.user_address = address;
        }
        setQuery(queryParam);
        await SearchService.search(searchParam, {
          isAdding: isMobile,
        });
      })();
    },
    [state, address],
  );

  const handleChangePage: PaginationProps['onChange'] = (_e, newPage) => {
    state.page = newPage - 1;
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    if (state.query) {
      search(state.query);
    }
  }, [state, state.page, search]);

  React.useEffect(() => {
    return () => {
      SearchService.reset();
    };
  }, []);

  React.useEffect(() => {
    document.title = `${settingsStore.settings['site.title'] || ''}`;
  }, [settingsStore.settings]);

  return (
    <div className="md:w-7/12 m-auto md:pb-8">
      {isPc && (
        <div className="relative">
          <BackButton className="-ml-32" />
        </div>
      )}
      <div
        className="bg-white md:rounded-12 md:shadow-md search-page min-h-screen md:min-h-90-vh pt-12 md:pt-8"
        ref={infiniteRef}
      >
        {state.isSearched && (
          <div>
            {(isPc || !SearchService.state.isFetched) && SearchService.state.loading && (
              <div className="pt-32 mt-8 md:pt-24 md:pb-8">
                <Loading />
              </div>
            )}
            {((isMobile && SearchService.state.isFetched) ||
              (isPc && !SearchService.state.loading)) && (
              <div className="px-0 md:px-20 pb-8">
                {!SearchService.state.loading && SearchService.state.total === 0 && (
                  <div className="pt-32 mt-2 md:pt-20 pb-32 text-gray-99 text-center">
                    没有查询到相关的内容，换个关键词试一试？
                  </div>
                )}
                {SearchService.state.total > 0 &&
                  SearchService.state.resultItems.map((resultItem, index) => {
                    return (
                      <div key={index}>
                        <ItemEntry index={index} item={resultItem} />
                      </div>
                    );
                  })}
                {isPc && SearchService.state.total > 0 && <BackToTop />}
                {!SearchService.state.loading &&
                  SearchService.state.total > 5 &&
                  !SearchService.state.hasMore && (
                    <div className="mt-0 md:-mt-5">
                      <BottomLine />
                    </div>
                  )}
                {isPc && !SearchService.state.loading && SearchService.state.hasMore && (
                  <div className="flex justify-center pb-5 mt-8 list-none">
                    <Pagination
                      count={Math.ceil(SearchService.state.total / state.limit)}
                      variant="outlined"
                      shape="rounded"
                      page={state.page + 1}
                      onChange={handleChangePage}
                    />
                  </div>
                )}
                {isMobile && SearchService.state.isFetched && SearchService.state.hasMore && (
                  <div className="mt-10">
                    <Loading />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        .search-page .search-box {
          max-width: 600px;
        }
        .search-page .MuiPaginationItem-page {
          color: #888888;
        }
        .search-page .MuiPaginationItem-page.Mui-selected {
          background: #227daa;
          color: #fff;
          border-color: #227daa;
        }
        .search-page .MuiPaginationItem-page:hover {
          background: none;
          color: #227daa;
          border-color: #227daa;
        }
      `}</style>
      <style jsx global>{`
        .search-page .yx_hl {
          color: #de7b56;
        }
        .post-page-search-input .MuiOutlinedInput-root {
          border-radius: 30px !important;
        }
      `}</style>
    </div>
  );
});
