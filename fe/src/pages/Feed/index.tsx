import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import Api from '../../api';
import PostEntry from './PostEntry';

export default observer((props: any) => {
  const { feedStore } = useStore();

  React.useEffect(() => {
    (async () => {
      const { rssUrl } = props.match.params;
      const decodedRssUrl = decodeURIComponent(rssUrl);
      const feed = await Api.fetchFeed(decodedRssUrl);
      feedStore.setFeed(feed);
      feedStore.setRssUrl(rssUrl);
    })();
  }, [feedStore, props]);

  if (!feedStore.isFetched) {
    return <div>loading...</div>;
  }

  return (
    <div className="po-page-width po-center push-top-xxl">
      <div>
        <h1 className="text-center dark-color po-text-34">{feedStore.feed.title}</h1>
        <div className="gray-color text-center po-text-16">{feedStore.feed.description}</div>
      </div>
      <div className="push-top-xl pad-bottom-lg">
        {feedStore.feed.items.map((item: any, index: number) => {
          return <PostEntry post={item} index={index} rssUrl={feedStore.rssUrl} key={item.title} />;
        })}
      </div>
    </div>
  );
});
