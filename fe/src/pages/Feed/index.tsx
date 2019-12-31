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
  const { preloadStore, feedStore, settingsStore } = useStore();
  const { ready } = preloadStore;
  const [enableFilterScroll, setEnableFilterScroll] = React.useState(false);
  const [pagePending, setPagePending] = React.useState(false);

  const { isFetched, hasMore, posts, order, pending } = feedStore;
  const { settings } = settingsStore;
  const filterEnabled = settings['filter.enabled'];
  const hasPosts = posts.length > 0;

  React.useEffect(() => {
    document.title = `${settings['site.title'] || ''}`;
  }, [settings]);

  React.useEffect(() => {
    (async () => {
      if (!ready) {
        return;
      }
      if (isFetched) {
        return;
      }
      setPagePending(true);
      const { filterType, optionsForFetching } = feedStore;
      try {
        const { posts } = await Api.fetchPosts(filterType, {
          ...optionsForFetching,
        });
        feedStore.addPosts(posts);
        await sleep(500);
        setPagePending(false);
      } catch (err) {}
    })();
  }, [ready, isFetched, feedStore]);

  React.useEffect(() => {
    if (!ready || !isFetched) {
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
  }, [ready, feedStore, isFetched, hasMore]);

  if (!ready || !feedStore.isFetched || pagePending) {
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
          <div className="w-56 md:w-full m-auto text-gray-600 text-center mt-3 text-base">
            {settings['site.slogan']}
          </div>
        </div>
        {filterEnabled && <Filter enableScroll={enableFilterScroll} />}
        {!filterEnabled && (
          <div className="mt-10 md:mt-12 border-t border-gray-300 md:border-gray-200" />
        )}
        <div className="min-h-screen">
          {!pending && hasPosts && <Posts posts={posts} />}
          {pending && (
            <div className="pt-40">
              <Loading size={24} />
            </div>
          )}
          {!pending && hasMore && (
            <div className="mt-10">
              <Loading size={24} />
            </div>
          )}
          {!pending && !hasPosts && order === 'SUBSCRIPTION' && (
            <div className="pt-32 text-center text-gray-500">
              <div className="pt-4">去关注你感兴趣的作者吧！</div>
              <div className="mt-2">
                只需两步：点作者头像或昵称{' '}
                <span role="img" aria-label="then">
                  👉
                </span>{' '}
                点关注
              </div>
            </div>
          )}
          {!pending && !hasPosts && order !== 'SUBSCRIPTION' && (
            <div className="pt-32 text-center text-gray-500">
              <div className="pt-4">暂无文章</div>
            </div>
          )}
        </div>
      </div>
    </Fade>
  );
});
