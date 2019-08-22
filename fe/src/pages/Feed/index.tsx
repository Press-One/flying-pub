import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import PostEntry from './PostEntry';
import debounce from 'lodash.debounce';
import Loading from '../../components/Loading';
import TitleMapping from '../../hardCode/titleMapping';
import { isMobile, getPostSelector } from '../../utils';

export default observer(() => {
  const { feedStore, cacheStore } = useStore();

  React.useEffect(() => {
    const { title } = feedStore.feed;
    if (title) {
      document.title = title;
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
      const { documentElement } = document;
      const scrollTop = documentElement.scrollTop;
      const triggerBottomPosition = documentElement.scrollHeight - window.innerHeight;
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
    <div className="po-fade-in pad-bottom-lg">
      <div>
        <h1
          className={`push-none text-center dark-color po-height-15 po-text-${
            isMobile ? '28' : '34'
          }`}
        >
          {TitleMapping[feedStore.feed.title] || feedStore.feed.title}
        </h1>
        <div className="gray-color text-center po-text-16 push-top">
          {feedStore.feed.description}
        </div>
      </div>
      <div className={`push-top-${isMobile ? 'lg' : 'xl'}`}>
        {feedStore.pagePosts.map((item: any) => {
          return <PostEntry post={item} rssUrl={feedStore.rssUrl} key={item.title} />;
        })}
      </div>
      {feedStore.hasMore && <Loading size={24} spaceSize={'small'} />}
    </div>
  );
});
