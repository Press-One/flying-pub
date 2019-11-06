import React from 'react';
import { Link } from 'react-router-dom';
import { ago, isMobile, getPostSelector } from '../../../utils';
import { getPostId } from '../../../store/feed';

export default (props: any) => {
  const { post } = props;
  if (!post) {
    return null;
  }
  return (
    <Link to={`/posts/${encodeURIComponent(getPostId(post))}`}>
      <div id={getPostSelector(getPostId(post))} />
      <div className={`border-t border-gray-300 py-${isMobile ? '8' : '3'}`}>
        <h2 className={`text-${isMobile ? 'lg' : 'xl'} text-gray-700 font-bold pt-4`}>
          {post.title}
        </h2>
        <div className={`mt-1 text-gray-500${isMobile ? ' text-sm' : ''}`}>
          {post.author} | {ago(post.pubDate)}
        </div>
        <div className={`mt-3 text-gray-700 text-base leading-relaxed`}>
          {post.contentSnippet.slice(0, 150)}
        </div>
      </div>
    </Link>
  );
};
