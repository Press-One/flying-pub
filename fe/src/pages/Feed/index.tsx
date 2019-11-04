import React from 'react';
import { observer } from 'mobx-react-lite';
import debounce from 'lodash.debounce';
import Fade from '@material-ui/core/Fade';
import { useStore } from '../../store';
import { getPostId, Post } from '../../store/feed';
import PostEntry from './PostEntry';
import Loading from '../../components/Loading';
import { isMobile, getPostSelector } from '../../utils';

export default observer(() => {
  const { feedStore, cacheStore } = useStore();

  React.useEffect(() => {
    const { title } = feedStore.feed;
    if (title) {
      document.title = `${title} - 飞贴`;
    }
  });

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
    }, 500);
    window.addEventListener('scroll', debounceScroll);

    return () => {
      window.removeEventListener('scroll', debounceScroll);
    };
  }, [feedStore, cacheStore]);

  if (!feedStore.isFetched) {
    return null;
  }

  return (
    <Fade in={true} timeout={500}>
      <div className="w-7/12 m-auto po-fade-in pad-bottom-lg feed-page">
        <div>
          <h1
            className={`p-0 font-bold text-center text-gray-700 leading-relaxed text-${
              isMobile ? '2xl' : '3xl'
            }`}
          >
            {feedStore.feed.title}
          </h1>
          <div className="mt-2 w-16 m-auto border-b border-gray-500" />
          <div className="text-gray-600 text-center mt-3">{feedStore.feed.description}</div>
        </div>
        <div className={`mt-${isMobile ? '8' : '10'}`}>
          {feedStore.pagePosts.map((post: Post) => {
            return <PostEntry post={post} key={getPostId(post)} />;
          })}
        </div>
        {feedStore.hasMore && <Loading size={24} spaceSize={'small'} />}
      </div>
    </Fade>
  );
});
