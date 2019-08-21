import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import PostEntry from './PostEntry';
import debounce from 'lodash.debounce';
import Loading from '../../components/Loading';

export default observer(() => {
  const { feedStore, cacheStore } = useStore();

  React.useEffect(() => {
    const { title } = feedStore.feed;
    if (title) {
      document.title = title;
    }
  });

  React.useEffect(() => {
    const { feedScrollTop } = cacheStore;
    window.scroll(0, feedScrollTop);
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
        <h1 className="text-center dark-color po-text-34">{feedStore.feed.title}</h1>
        <div className="gray-color text-center po-text-16">{feedStore.feed.description}</div>
      </div>
      <div className="push-top-xl">
        {feedStore.pagePosts.map((item: any) => {
          return <PostEntry post={item} rssUrl={feedStore.rssUrl} key={item.title} />;
        })}
      </div>
      {feedStore.hasMore && <Loading size={24} spaceSize={'small'} />}
    </div>
  );
});
