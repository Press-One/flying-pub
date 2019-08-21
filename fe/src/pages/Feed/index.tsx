import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import PostEntry from './PostEntry';
import debounce from 'lodash.debounce';

export default observer(() => {
  const { feedStore, cacheStore } = useStore();

  React.useEffect(() => {
    const { feedScrollTop } = cacheStore;
    console.log(` ------------- feedScrollTop ---------------`, feedScrollTop);
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
    <div className="po-fade-in">
      <div>
        <h1 className="text-center dark-color po-text-34">{feedStore.feed.title}</h1>
        <div className="gray-color text-center po-text-16">{feedStore.feed.description}</div>
      </div>
      <div className="push-top-xl pad-bottom-lg">
        {feedStore.pagePosts.map((item: any, index: number) => {
          return <PostEntry post={item} index={index} rssUrl={feedStore.rssUrl} key={item.title} />;
        })}
      </div>
    </div>
  );
});
