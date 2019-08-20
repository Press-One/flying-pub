import React from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import Api from '../../api';

export default observer((props: any) => {
  const { feedStore } = useStore();
  const [id, setId] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      const { rssUrl, id } = props.match.params;
      const decodedRssUrl = decodeURIComponent(rssUrl);
      const feed = await Api.fetchFeed(decodedRssUrl);
      feedStore.setFeed(feed);
      feedStore.setRssUrl(rssUrl);
      setId(id);
    })();
  }, [feedStore, props]);

  if (!feedStore.isFetched) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <Link to={`/${feedStore.rssUrl}`}>返回《《 </Link>
      <div>{JSON.stringify(feedStore.feed.items[id])}</div>
    </div>
  );
});
