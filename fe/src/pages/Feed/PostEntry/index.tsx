import React from 'react';
import { Link } from 'react-router-dom';
import { ago, isMobile } from '../../../utils';
import './index.scss';

export default (props: any) => {
  const { post, rssUrl } = props;
  return (
    <Link to={`/${rssUrl}/${encodeURIComponent(post.guid)}`}>
      <div
        className={`post-entry po-cp pad-top${isMobile ? '-md' : '-lg'} pad-bottom${
          isMobile ? '-md' : '-lg'
        }`}
      >
        <h2 className={`po-text-${isMobile ? '18' : '24'} dark-color push-none title po-height-15`}>
          {post.title}
        </h2>

        <div className={`push-top gray-color${isMobile ? ' po-text-12' : ''}`}>
          用户名 | {ago(post.pubDate)}
        </div>
        <div
          className={`push-top po-text-${
            isMobile ? '16' : '18'
          } gray-darker-color po-height-175 po-text-line-3`}
        >
          {post.contentSnippet.slice(0, 150)}
        </div>
      </div>
    </Link>
  );
};
