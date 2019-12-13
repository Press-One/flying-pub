import React from 'react';
import { observer } from 'mobx-react-lite';
import debounce from 'lodash.debounce';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import { getPostId, Post } from 'store/feed';
import PostEntry from './PostEntry';
import Loading from 'components/Loading';
import Filter from './Filter';
import { isMobile, getPostSelector } from 'utils';
import Api from 'api';

export default observer(() => {
  const { feedStore, cacheStore } = useStore();

  React.useEffect(() => {
    const { title } = feedStore.feed;
    if (title) {
      document.title = `${title} - 飞帖`;
    }
  });

  React.useEffect(() => {
    if (feedStore.isFetched) {
      (async () => {
        try {
          const { posts } = await Api.fetchPosts();
          feedStore.setPostExtraMap(posts);
        } catch (err) {
          console.log(err);
        }
      })();
    }
  }, [feedStore]);

  const restoreScrollPosition = (feedScrollTop: number, postId: string) => {
    if (feedScrollTop === 0 && postId) {
      const postDom: any = document.querySelector(`#${getPostSelector(postId)}`);
      if (!postDom) {
        return;
      }
      window.scroll(0, postDom!.offsetTop - window.innerHeight / 2 + 100);
    } else {
      window.scroll(0, feedScrollTop);
    }
  };

  React.useEffect(() => {
    const { feedScrollTop } = cacheStore;
    const { postId } = feedStore;
    restoreScrollPosition(feedScrollTop, postId);
    const debounceScroll = debounce(() => {
      const scrollElement = document.scrollingElement || document.documentElement;
      const scrollTop = scrollElement.scrollTop;
      const triggerBottomPosition = scrollElement.scrollHeight - window.innerHeight;
      if (triggerBottomPosition - scrollTop < 500) {
        feedStore.loadMore();
      }
      cacheStore.setFeedScrollTop(scrollTop);
    }, 300);
    window.addEventListener('scroll', debounceScroll);

    return () => {
      window.removeEventListener('scroll', debounceScroll);
    };
  }, [feedStore, cacheStore]);

  if (!feedStore.isFetched) {
    return null;
  }

  const { feed, hasMore, pagePosts, postExtraMap, isChangingOrder } = feedStore;

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="md:w-7/12 m-auto pb-10 pt-3">
        <div>
          <h1
            className={`p-0 font-bold text-center text-gray-700 leading-relaxed text-${
              isMobile ? '2xl' : '3xl'
            }`}
          >
            {feed.title}
          </h1>
          <div className="mt-2 w-16 m-auto border-b border-gray-500" />
          <div className="text-gray-600 text-center mt-3 text-base">{feed.description}</div>
        </div>
        <Filter />
        <div className="min-h-screen">
          {!isChangingOrder && (
            <div>
              {pagePosts.map((post: Post) => {
                const extra = postExtraMap[getPostId(post)];
                return (
                  <PostEntry
                    post={post}
                    key={getPostId(post)}
                    upVotesCount={extra ? Number(extra.upVotesCount) || 0 : 0}
                    commentsCount={extra ? Number(extra.commentsCount) || 0 : 0}
                  />
                );
              })}
            </div>
          )}
          {isChangingOrder && (
            <div className="border-t border-gray-300 pt-40">
              <Loading size={24} />
            </div>
          )}
          {!isChangingOrder && hasMore && (
            <div className="mt-10">
              <Loading size={24} />
            </div>
          )}
        </div>
      </div>
    </Fade>
  );
});
