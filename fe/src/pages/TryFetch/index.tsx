import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import Api from '../../api';
import Loading from '../../components/Loading';
import { getTopicAddress } from '../../utils';

export default observer((props: any) => {
  const { feedStore } = useStore();

  React.useEffect(() => {
    (async () => {
      if (feedStore.isFetched) {
        return;
      }
      try {
        const { REACT_APP_POSTS_XML } = process.env;
        const rssUrl = `${REACT_APP_POSTS_XML}/${getTopicAddress()}`;
        const decodedRssUrl = decodeURIComponent(rssUrl);
        const feed = await Api.fetchFeed(decodedRssUrl);
        feedStore.setFeed(feed);
        feedStore.setRssUrl(rssUrl);
      } catch (err) {
        console.log(err);
      }
      
    })();
  }, [feedStore, props]);

  if (!feedStore.isFetched) {
    return <Loading isPage={true} />;
  }

  return null;
});
