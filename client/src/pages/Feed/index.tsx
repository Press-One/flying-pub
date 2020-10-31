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
import settingsApi from 'apis/settings';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';

export default observer(() => {
  const { preloadStore, feedStore, settingsStore, userStore } = useStore();
  const { ready } = preloadStore;
  const state = useLocalStore(() => ({
    isFetchingStickyPosts: false,
    isFetchedStickyPosts: false,
    pagePending: false,
    enableFilterScroll: true,
  }));

  const { filterType, filterDayRange, stickyEnabled } = feedStore;
  const { settings } = settingsStore;
  const filterEnabled = settings['filter.enabled'];
  const showPopularity =
    settings['filter.popularity.enabled'] && settings['filter.dayRangeOptions'].length > 1;
  const pending = React.useMemo(
    () => !ready || !state.isFetchedStickyPosts || !feedStore.isFetched,
    [ready, state.isFetchedStickyPosts, feedStore.isFetched],
  );
  const tabs = [
    {
      type: 'SUBSCRIPTION',
      name: '关注',
    },
    {
      type: 'POPULARITY',
      name: '热门',
    },
    {
      type: 'PUB_DATE',
      name: '最新',
    },
  ];

  const initFilter = React.useCallback(
    (settings: any) => {
      const type = settings['filter.type'];
      const popularityDisabled = !settings['filter.popularity.enabled'];
      if (popularityDisabled) {
        const validType = type === 'POPULARITY' ? 'PUB_DATE' : type;
        settings['filter.type'] = validType;
        feedStore.setFilter({
          type: validType,
        });
      } else {
        const filter: any = { type };
        if (type === 'POPULARITY') {
          const dayRange = settings['filter.dayRange'];
          const dayRangeOptions = settings['filter.dayRangeOptions'];
          const isValidDayRange = dayRange && dayRangeOptions.includes(dayRange);
          const validDayRange = isValidDayRange ? dayRange : dayRangeOptions[0];
          settings['filter.dayRange'] = validDayRange;
          filter.dayRange = validDayRange;
        }
        feedStore.setFilter(filter);
      }
    },
    [feedStore],
  );

  React.useEffect(() => {
    if (ready && !feedStore.syncedFromSettings) {
      initFilter(settings);
      feedStore.markSyncedFromSettings();
    }
  }, [ready, settings, feedStore, initFilter]);

  React.useEffect(() => {
    if (feedStore.provider !== 'feed') {
      feedStore.setProvider('feed');
      feedStore.clear();
      initFilter(settings);
      window.scrollTo(0, 0);
    }
  }, [feedStore, tabs, settings, initFilter]);

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
    if (feedStore.isFetching) {
      return;
    }
    if (!feedStore.isNew && !feedStore.willLoadingPage) {
      return;
    }
    (async () => {
      feedStore.setIsFetching(true);
      try {
        const { filterType, optionsForFetching, limit } = feedStore;
        let fetchPostsPromise;
        if (ready) {
          fetchPostsPromise =
            filterType === 'SUBSCRIPTION'
              ? postApi.fetchSubscription()
              : postApi.fetchPosts({
                  ...optionsForFetching,
                  offset: feedStore.page * limit,
                  limit,
                });
        } else {
          fetchPostsPromise = postApi.fetchPostsByUserSettings({
            offset: 0,
            limit,
          });
        }

        const { total, posts } = await fetchPostsPromise;
        feedStore.setTotal(total);
        feedStore.addPosts(posts);
      } catch (err) {}
      feedStore.setIsFetching(false);
      feedStore.setIsFetched(true);
    })();
  }, [feedStore.page, filterType, filterDayRange, state, feedStore, ready]);

  const infiniteRef: any = useWindowInfiniteScroll({
    loading: feedStore.isFetching,
    hasNextPage: feedStore.hasMorePosts,
    threshold: 350,
    onLoadMore: () => {
      feedStore.setPage(feedStore.page + 1);
    },
  });

  const setFilter = async (filter: any) => {
    feedStore.setPage(0);
    feedStore.setFilter(filter);
    feedStore.setIsFetched(false);
    try {
      const settings: any = {
        'filter.type': filter.type,
      };
      if (filter.type === 'POPULARITY') {
        settings['filter.dayRange'] = filter.dayRange;
      }
      if (userStore.isLogin) {
        await settingsApi.saveSettings(settings);
      }
    } catch (err) {}
  };

  const handleFilterChange = (type: string, dayRange = 0) => {
    if (feedStore.isFetching) {
      return;
    }
    setFilter({
      type: type as FilterType,
      dayRange,
    });
  };

  if (userStore.shouldLogin) {
    return null;
  }

  if (state.pagePending) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
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
            {filterEnabled && (
              <Filter
                dayRange={feedStore.filterDayRange}
                type={feedStore.filterType}
                enableScroll={state.enableFilterScroll}
                onChange={handleFilterChange}
                showPopularity={showPopularity}
                dayRangeOptions={settings['filter.dayRangeOptions']}
                tabs={tabs}
              />
            )}
            {!filterEnabled && (
              <div className="mt-10 md:mt-12 border-t border-gray-300 md:border-gray-200" />
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
                <div className="pt-20 md:pt-20">
                  <Loading />
                </div>
              )}
              {!pending && feedStore.hasMorePosts && (
                <div className="mt-10">
                  <Loading />
                </div>
              )}
              {!pending && !feedStore.hasPosts && filterType === 'SUBSCRIPTION' && (
                <div className="pt-32 text-center text-gray-500">
                  <div className="pt-4">去关注你感兴趣的作者和专题吧~</div>
                </div>
              )}
              {!pending && !feedStore.hasPosts && filterType !== 'SUBSCRIPTION' && (
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
