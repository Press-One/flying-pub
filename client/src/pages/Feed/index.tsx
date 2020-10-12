import React from 'react';
import { observer } from 'mobx-react-lite';
import debounce from 'lodash.debounce';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import Loading from 'components/Loading';
import Posts from 'components/Posts';
import Filter from './Filter';
import { isMobile, sleep } from 'utils';
import Api from 'api';

export default observer(() => {
  const { preloadStore, feedStore, settingsStore, userStore } = useStore();
  const { ready } = preloadStore;
  const [enableFilterScroll, setEnableFilterScroll] = React.useState(false);
  const [minPending, setMinPending] = React.useState(false);
  const [pagePending, setPagePending] = React.useState(false);

  const { isFetched, hasMore, posts, filterType, pending, stickyEnabled, stickyPosts } = feedStore;
  const { settings } = settingsStore;
  const filterEnabled = settings['filter.enabled'];
  const hasPosts = posts.length > 0;

  React.useEffect(() => {
    document.title = `${settings['site.title'] || ''}`;
  }, [settings]);

  React.useEffect(() => {
    if (isFetched) {
      return;
    }
    (async () => {
      setMinPending(true);
      await sleep(500);
      setMinPending(false);
    })();
  }, [isFetched, minPending]);

  React.useEffect(() => {
    (async () => {
      if (isFetched) {
        return;
      }
      setPagePending(true);
      const { filterType, optionsForFetching } = feedStore;
      try {
        const [{ posts }, { posts: stickyPosts }] = await Promise.all([
          Api.fetchPosts(filterType, {
            ...optionsForFetching,
          }),
          Api.fetchPosts('', {
            filterSticky: true,
          }),
        ]);
        feedStore.addStickyPosts(stickyPosts);
        feedStore.addPosts(posts);
        setPagePending(false);
      } catch (err) {}
    })();
  }, [isFetched, feedStore]);

  React.useEffect(() => {
    if (!isFetched) {
      return;
    }
    const loadMore = async () => {
      try {
        const { filterType, optionsForFetching, limit, length } = feedStore;
        const { posts } = await Api.fetchPosts(filterType, {
          ...optionsForFetching,
          offset: length,
          limit,
        });
        feedStore.addPosts(posts);
      } catch (err) {}
    };

    setEnableFilterScroll(false);
    const debounceScroll = debounce(() => {
      const scrollElement = document.scrollingElement || document.documentElement;
      const scrollTop = scrollElement.scrollTop;
      const triggerBottomPosition = scrollElement.scrollHeight - window.innerHeight;
      if (hasMore && triggerBottomPosition - scrollTop < 600) {
        loadMore();
      }
    }, 300);
    window.addEventListener('scroll', debounceScroll);

    (async () => {
      await sleep(200);
      setEnableFilterScroll(true);
    })();

    return () => {
      window.removeEventListener('scroll', debounceScroll);
      setEnableFilterScroll(false);
    };
  }, [feedStore, isFetched, hasMore]);

  if (userStore.shouldLogin) {
    return null;
  }

  if (!ready || !feedStore.isFetched || pagePending || minPending) {
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
      <div className="md:w-7/12 m-auto pb-10 pt-3">
        <div>
          <h1
            className={`p-0 font-bold text-center text-gray-700 leading-relaxed text-${
              isMobile ? '2xl' : '3xl'
            }`}
          >
            {settings['site.title']}
          </h1>
          <div className="mt-2 w-16 m-auto border-b border-gray-500" />
          <div className="w-64 md:w-full m-auto text-gray-600 text-center mt-3 text-base">
            {settings['site.slogan']}
          </div>
        </div>
        {filterEnabled && <Filter enableScroll={enableFilterScroll} />}
        {!filterEnabled && (
          <div className="mt-10 md:mt-12 border-t border-gray-300 md:border-gray-200" />
        )}
        <div className="min-h-screen">
          {stickyEnabled && !pending && hasPosts && stickyPosts.length > 0 && (
            <Posts
              posts={stickyPosts}
              authorPageEnabled={settings['author.page.enabled']}
              styleStickyEnabled={true}
            />
          )}
          {!pending && hasPosts && (
            <Posts
              posts={posts}
              authorPageEnabled={settings['author.page.enabled']}
              hiddenSticky={stickyEnabled}
            />
          )}
          {pending && (
            <div className="pt-40">
              <Loading size={24} />
            </div>
          )}
          {!pending && hasPosts && hasMore && (
            <div className="mt-10">
              <Loading size={24} />
            </div>
          )}
          {!pending && !hasPosts && filterType === 'SUBSCRIPTION' && (
            <div className="pt-32 text-center text-gray-500">
              <div className="pt-4">去关注你感兴趣的作者吧！</div>
              <div className="mt-2">
                点作者头像或昵称{' '}
                <span role="img" aria-label="then">
                  👉
                </span>{' '}
                点关注
              </div>
            </div>
          )}
          {!pending && !hasPosts && filterType !== 'SUBSCRIPTION' && (
            <div className="pt-32 text-center text-gray-500">
              <div className="pt-4">暂无文章</div>
            </div>
          )}
        </div>
      </div>
    </Fade>
  );
});
