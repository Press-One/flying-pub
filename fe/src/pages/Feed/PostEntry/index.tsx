import React from 'react';
import { Link } from 'react-router-dom';
import './index.scss';

export default (props: any) => {
  const { post, rssUrl, index } = props;
  return (
    <div className="post-entry pad-top-lg pad-bottom-lg">
      <Link to={`/${rssUrl}/${index}`}>
        <h2 className="po-text-24 dark-color push-none title po-cp">{post.title}</h2>
      </Link>
      <div className="push-top gray-color">霍炬 | 2019-09-12</div>
      <div className="push-top po-text-16 gray-darker-color po-height-175">
        {post.contentSnippet.slice(0, 300)}
      </div>
    </div>
  );
};
