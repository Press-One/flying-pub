import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import Loading from 'components/Loading';
import Posts from 'components/Posts';
import Filter from 'components/PostsFilter';
import RecommendAuthors from './RecommendAuthors';
import { isMobile, isPc } from 'utils';
import postApi, { FilterType } from 'apis/post';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';
import Button from 'components/Button';

export default observer(() => {
  const { preloadStore, feedStore, settingsStore, userStore, modalStore } = useStore();
  const { ready } = preloadStore;
  const state = useLocalStore(() => ({
    isFetchingStickyPosts: false,
    isFetchedStickyPosts: false,
    pagePending: false,
    enableFilterScroll: true,
  }));

  const { filterType, filterDayRange, subscriptionType, latestType, stickyEnabled } = feedStore;
  const { settings } = settingsStore;
  const filterEnabled = settings['filter.enabled'];
  const showPopularity =
    settings['filter.popularity.enabled'] && settings['filter.dayRangeOptions'].length > 1;
  const showLatest = settings['filter.latest.enabled'];
  const pending = React.useMemo(
    () => !ready || !state.isFetchedStickyPosts || !feedStore.isFetched,
    [ready, state.isFetchedStickyPosts, feedStore.isFetched],
  );
  const tabs = [
    {
      type: 'POPULARITY',
      name: '热门',
    },
    {
      type: 'LATEST',
      name: '最新',
    },
  ];
  if (isPc) {
    tabs.unshift({
      type: 'SUBSCRIPTION',
      name: '关注',
    });
  }

  React.useEffect(() => {
    if (!filterDayRange && showPopularity) {
      feedStore.setFilterDayRange(settings['filter.dayRangeOptions'][0]);
    }
  }, [ready, showPopularity, settings, feedStore, filterDayRange]);

  React.useEffect(() => {
    if (feedStore.provider !== 'feed') {
      feedStore.setProvider('feed');
      feedStore.clear();
      feedStore.setFilterType('LATEST');
      window.scrollTo(0, 0);
    }
  }, [feedStore, tabs, settings]);

  React.useEffect(() => {
    document.title = `${settings['site.title'] || ''}`;
  }, [settings]);

  React.useEffect(() => {
    if (feedStore.isNew) {
      state.pagePending = true;
    }
    if (ready && feedStore.isFetched && state.isFetchedStickyPosts) {
      state.pagePending = false;
    }
  }, [ready, feedStore.isFetched, state.isFetchedStickyPosts, state, feedStore]);

  React.useEffect(() => {
    if (!feedStore.isNew) {
      state.isFetchingStickyPosts = false;
      state.isFetchedStickyPosts = true;
      return;
    }
    if (state.isFetchedStickyPosts) {
      return;
    }
    (async () => {
      state.isFetchingStickyPosts = true;
      try {
        const { posts: stickyPosts } = await postApi.fetchPosts({
          filterSticky: true,
        });
        feedStore.addStickyPosts(stickyPosts);
      } catch (err) {}
      state.isFetchingStickyPosts = false;
      state.isFetchedStickyPosts = true;
    })();
  }, [state, ready, feedStore]);

  React.useEffect(() => {
    if (filterType === 'SUBSCRIPTION' && !userStore.isLogin) {
      return;
    }
    if (feedStore.isFetching) {
      return;
    }
    if (!feedStore.isNew && !feedStore.willLoadingPage) {
      return;
    }
    (async () => {
      feedStore.setIsFetching(true);
      try {
        const { filterType, filterDayRange, latestType, subscriptionType, limit } = feedStore;
        let fetchPostsPromise;
        if (ready) {
          if (filterType === 'SUBSCRIPTION') {
            fetchPostsPromise = postApi.fetchPostsBySubscription({
              type: subscriptionType,
              offset: feedStore.page * limit,
              limit,
            });
          } else if (filterType === 'POPULARITY') {
            fetchPostsPromise = postApi.fetchPostsByPopularity({
              dayRange: filterDayRange,
              offset: feedStore.page * limit,
              limit,
            });
          } else if (filterType === 'LATEST') {
            if (latestType === 'LATEST_COMMENT') {
              fetchPostsPromise = postApi.fetchPostsByLatestComment({
                offset: feedStore.page * limit,
                limit,
              });
            } else if (latestType === 'PUB_DATE') {
              fetchPostsPromise = postApi.fetchPosts({
                offset: feedStore.page * limit,
                limit,
              });
            }
          }
        } else {
          fetchPostsPromise = postApi.fetchPosts({
            offset: feedStore.page * limit,
            limit,
          });
        }

        const { total, posts } = await fetchPostsPromise;
        feedStore.setTotal(total);
        feedStore.addPosts(posts);
      } catch (err) {}
      feedStore.setIsFetching(false);
      feedStore.setIsFetched(true);
      feedStore.setPendingNewPage(false);
    })();
  }, [
    feedStore.page,
    filterType,
    filterDayRange,
    subscriptionType,
    latestType,
    state,
    feedStore,
    ready,
    userStore.isLogin,
  ]);

  const infiniteRef: any = useWindowInfiniteScroll({
    loading: feedStore.isFetching,
    hasNextPage: feedStore.hasMorePosts,
    threshold: 350,
    onLoadMore: () => {
      if (!feedStore.isFetching && !feedStore.pendingNewPage) {
        feedStore.setPendingNewPage(true);
        feedStore.setPage(feedStore.page + 1);
      }
    },
  });

  const setFilter = async (filter: any) => {
    if (filter.type === 'SUBSCRIPTION' && !userStore.isLogin) {
      feedStore.setPage(0);
      feedStore.setFilter(filter);
      feedStore.setIsFetched(true);
      feedStore.emptyPosts();
      return;
    } else {
      feedStore.setPage(0);
      feedStore.setFilter(filter);
      feedStore.setIsFetched(false);
    }
  };

  const handleFilterChange = (type: string, value: any) => {
    if (feedStore.isFetching) {
      return;
    }
    if (type !== 'SUBSCRIPTION') {
      if (type === 'LATEST') {
        setFilter({
          type: type as FilterType,
          latestType: value,
        });
      } else {
        setFilter({
          type: type as FilterType,
          dayRange: value,
        });
      }
    } else {
      setFilter({
        type: type as FilterType,
        subscriptionType: value,
      });
    }
  };

  if (userStore.shouldLogin) {
    return null;
  }

  if (state.pagePending) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-24 md:-mt-40">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="w-full md:w-916 md:m-auto pb-0 md:pb-10 flex justify-between items-start">
        <div className="w-full md:w-8/12 box-border md:pr-3">
          <div className="bg-white md:px-5 pb-8 rounded-12">
            <div className="md:pt-2">
              {filterEnabled && (
                <Filter
                  provider="feed"
                  dayRange={feedStore.filterDayRange}
                  subscriptionType={feedStore.subscriptionType}
                  latestType={feedStore.latestType}
                  type={feedStore.filterType}
                  enableScroll={state.enableFilterScroll}
                  onChange={handleFilterChange}
                  showPopularity={showPopularity}
                  showLatest={showLatest}
                  dayRangeOptions={settings['filter.dayRangeOptions']}
                  tabs={tabs}
                />
              )}
            </div>
            <div className="pb-1 md:pb-0" />
            {!filterEnabled && (
              <div className="mt-10 md:mt-12 md:border-t border-gray-300 md:border-gray-200" />
            )}
            <div className="posts-container" ref={infiniteRef}>
              <div className="mt-2" />
              {stickyEnabled &&
                !pending &&
                feedStore.hasPosts &&
                feedStore.stickyPosts.length > 0 && (
                  <Posts
                    posts={feedStore.stickyPosts}
                    authorPageEnabled={settings['author.page.enabled']}
                    styleStickyEnabled={true}
                  />
                )}
              {!pending && feedStore.hasPosts && (
                <Posts
                  posts={feedStore.posts}
                  authorPageEnabled={settings['author.page.enabled']}
                  hiddenSticky={stickyEnabled}
                />
              )}
              {pending && (
                <div className="pt-24 mt-5">
                  <Loading />
                </div>
              )}
              {!pending && feedStore.hasMorePosts && (
                <div className="mt-10">
                  <Loading />
                </div>
              )}
              {!userStore.isLogin && filterType === 'SUBSCRIPTION' && (
                <div className="pt-32 flex justify-center text-gray-500">
                  <Button outline onClick={() => modalStore.openLogin()}>
                    请先登录
                  </Button>
                </div>
              )}
              {userStore.isLogin &&
                !pending &&
                !feedStore.hasPosts &&
                filterType === 'SUBSCRIPTION' && (
                  <div className="pt-32 text-center text-gray-500">
                    <div className="pt-4">
                      去关注你感兴趣的{subscriptionType === 'author' ? '作者' : '专题'}吧~
                    </div>
                  </div>
                )}
              {userStore.isLogin &&
                !pending &&
                !feedStore.hasPosts &&
                filterType !== 'SUBSCRIPTION' && (
                  <div className="pt-32 text-center text-gray-500">
                    <div className="pt-4">暂无文章</div>
                  </div>
                )}
            </div>
          </div>
        </div>
        {isPc && (
          <div className="w-4/12 box-border pl-1">
            <RecommendAuthors />
          </div>
        )}
        <style jsx>{`
          .posts-container {
            min-height: 90vh;
          }
        `}</style>
      </div>
    </Fade>
  );
});
