import React from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';

export default observer((props: any) => {
  const { feedStore } = useStore();
  const { id } = props.match.params;

  if (!feedStore.isFetched) {
    return null;
  }

  return (
    <div>
      <Link to={`/${feedStore.rssUrl}`}>返回《《 </Link>
      <div>{JSON.stringify(feedStore.feed.items[id])}</div>
    </div>
  );
});
