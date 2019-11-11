import React from 'react';
import { Link } from 'react-router-dom';
import Comment from '@material-ui/icons/Comment';
import { ago, getPostSelector } from '../../../utils';
import { getPostId } from '../../../store/feed';

export default (props: any) => {
  const { post } = props;
  if (!post) {
    return null;
  }
  return (
    <Link to={`/posts/${encodeURIComponent(getPostId(post))}`}>
      <div id={getPostSelector(getPostId(post))} />
      <div className="border-t border-gray-300 md:border-gray-200 py-4 md:px-0 md:py-6 leading-none post cursor-pointer">
        <div className="px-3">
          <h2 className="tracking-wide md:tracking-normal text-lg md:text-xl md:font-bold title leading-normal">
            {post.title}
          </h2>
          <div className="flex truncate mt-2 info text-sm items-center">
            <span className="mr-5">{post.author}</span>
            <span className="mr-5">{ago(post.pubDate)}</span>
            <div className="flex items-center font-bold">
              <Comment /> <span className="text-sm ml-1">12</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="mt-3 text-base leading-relaxed description">
              {post.contentSnippet.slice(0, 160)}
            </div>
          </div>
        </div>
        <style jsx>{`
          .post:hover {
            background: rgba(0, 0, 0, 0.01);
          }
          .title {
            color: #333;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .info,
          .comment {
            color: #999;
          }
          .description {
            color: #737373;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            display: none;
          }
        `}</style>
      </div>
    </Link>
  );
};
