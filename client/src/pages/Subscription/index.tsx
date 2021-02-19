import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { useStore } from 'store';
import Loading from 'components/Loading';
import Posts from 'components/Posts';
import postApi from 'apis/post';
import Fade from '@material-ui/core/Fade';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';

export default observer(() => {
  const state = useLocalStore(() => ({
    hasMorePosts: true,
  }));
  const { preloadStore, feedStore, settingsStore } = useStore();
  const { settings } = settingsStore;

  React.useEffect(() => {
    if (feedStore.provider !== 'subscription') {
      feedStore.setProvider('subscription');
      feedStore.clear();
      window.scrollTo(0, 0);
    }
  }, [feedStore]);

  React.useEffect(() => {
    document.title = '我的关注';
  }, []);

  React.useEffect(() => {
    feedStore.setProvider('subscription');
    (async () => {
      feedStore.setIsFetching(true);
      try {
        const { limit } = feedStore;
        const [authorRes, topicRes] = await Promise.all([
          postApi.fetchPostsBySubscription({
            type: 'author',
            offset: feedStore.page * limit,
            limit,
          }),
          postApi.fetchPostsBySubscription({
            type: 'topic',
            offset: feedStore.page * limit,
            limit,
          }),
        ]);
        feedStore.addPosts([...authorRes.posts, ...topicRes.posts]);
        state.hasMorePosts = authorRes.posts.length === limit || topicRes.posts.length === limit;
      } catch (err) {}
      feedStore.setIsFetching(false);
      feedStore.setIsFetched(true);
    })();
  }, [feedStore.page, state, feedStore]);

  const infiniteRef: any = useWindowInfiniteScroll({
    loading: feedStore.isFetching,
    hasNextPage: state.hasMorePosts,
    threshold: 350,
    onLoadMore: () => {
      if (!feedStore.isFetching) {
        feedStore.setPage(feedStore.page + 1);
      }
    },
  });

  if (!preloadStore.ready || !feedStore.isFetched) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-24 md:-mt-40">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <Fade in={true} timeout={0}>
      <div className="w-full md:w-916 md:m-auto pb-0 md:pb-10 flex justify-between items-start">
        <div className="w-full md:w-8/12 box-border md:pr-3">
          <div className="bg-white md:px-5 pb-8 rounded-12">
            <div className="text-20 font-bold pt-2 pb-2 px-4 text-blue-400">关注</div>
            <div className="posts-container" ref={infiniteRef}>
              {feedStore.hasPosts && (
                <Posts
                  posts={feedStore.posts}
                  authorPageEnabled={settings['author.page.enabled']}
                />
              )}
              {state.hasMorePosts && (
                <div className="mt-10">
                  <Loading />
                </div>
              )}
              {!feedStore.hasPosts && (
                <div className="pt-32 text-center text-gray-500">
                  <div className="pt-4">去关注你感兴趣的作者和专题吧~</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <style jsx>{`
          .posts-container {
            min-height: 90vh;
          }
        `}</style>
      </div>
    </Fade>
  );
});
