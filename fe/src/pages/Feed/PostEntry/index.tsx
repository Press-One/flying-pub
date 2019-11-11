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
      <div className={`border-t border-gray-200 py-${isMobile ? '8' : '6'}`}>
        <h2 className={`text-${isMobile ? 'lg' : 'xl'} text-gray-700 font-bold`}>{post.title}</h2>
        <div className={`mt-1 text-gray-500${isMobile ? ' text-sm' : ''}`}>
          {post.author} | {ago(post.pubDate)}
        </div>
        <div className={`mt-3 text-base leading-relaxed description`}>
          {post.contentSnippet.slice(0, 160)}
        </div>
        <style jsx>{`
          .description {
            color: #737373;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>
      </div>
    </Link>
  );
};
