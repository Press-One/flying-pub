import React from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';

import './index.scss';

export default observer((props: any) => {
  const { feedStore } = useStore();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!feedStore.isFetched) {
    return null;
  }

  const { id } = props.match.params;
  const post = feedStore.feed.items[id];

  return (
    <div className="push-top-lg post po-fade-in">
      <Link to={`/${feedStore.rssUrl}`}>
        <div className="back-btn flex h-center gray-color po-cp">
          <ArrowBackIos /> 返回
        </div>
      </Link>
      <h2 className="po-text-26 dark-color push-none title">{post.title}</h2>
      <div className="push-top gray-color po-text-16">霍炬 | 2019-09-12</div>
      <div
        className="push-top-lg po-text-18 black-color markdown-body pad-bottom-md"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
});
