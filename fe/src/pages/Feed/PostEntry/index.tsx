import React from 'react';
import { Link } from 'react-router-dom';
import { ago } from '../../../utils';
import './index.scss';

export default (props: any) => {
  const { post, rssUrl } = props;
  return (
    <div className="post-entry pad-top-lg pad-bottom-lg">
      <Link to={`/${rssUrl}/${encodeURIComponent(post.guid)}`}>
        <h2 className="po-text-24 dark-color push-none title po-cp">{post.title}</h2>
      </Link>
      <div className="push-top gray-color">用户名 | {ago(post.pubDate)}</div>
      <div className="push-top po-text-16 gray-darker-color po-height-175 po-text-line-3">
        {post.contentSnippet.slice(0, 150)}
      </div>
    </div>
  );
};
