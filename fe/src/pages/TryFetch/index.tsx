import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import Api from '../../api';
import Loading from '../../components/Loading';

export default observer((props: any) => {
  const { feedStore } = useStore();

  React.useEffect(() => {
    (async () => {
      if (feedStore.isFetched) {
        return;
      }
      const { rssUrl } = props.match.params;
      const decodedRssUrl = decodeURIComponent(rssUrl);
      const feed = await Api.fetchFeed(decodedRssUrl);
      feedStore.setFeed(feed);
      feedStore.setRssUrl(rssUrl);
    })();
  }, [feedStore, props]);

  if (!feedStore.isFetched) {
    return <Loading isPage={true} />;
  }

  return null;
});
