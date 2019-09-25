import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { getPostId, Post } from '../../store/feed';
import PostEntry from './PostEntry';
import debounce from 'lodash.debounce';
import Loading from '../../components/Loading';
import { isMobile, getPostSelector } from '../../utils';

import './index.scss';

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
      console.log(` ------------- scrollElement ---------------`, scrollElement);
      console.log(` ------------- triggerBottomPosition ---------------`, triggerBottomPosition);
      console.log(` ------------- scrollTop ---------------`, scrollTop);
      console.log(` ------------- triggerBottomPosition - scrollTop ---------------`, triggerBottomPosition - scrollTop);
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
    <div className="po-fade-in pad-bottom-lg feed-page">
      <div>
        <h1
          className={`push-none text-center dark-color po-height-15 po-text-${
            isMobile ? '28' : '34'
          }`}
        >
          {feedStore.feed.title}
        </h1>
        <div className="push-top-sm po-width-10 hr po-center" />
        <div className="gray-color text-center po-text-16 push-top">
          {feedStore.feed.description}
        </div>
      </div>
      <div className={`push-top-${isMobile ? 'lg' : 'xl'}`}>
        {feedStore.pagePosts.map((post: Post) => {
          return <PostEntry post={post} key={getPostId(post)} />;
        })}
      </div>
      {feedStore.hasMore && <Loading size={24} spaceSize={'small'} />}
    </div>
  );
});
