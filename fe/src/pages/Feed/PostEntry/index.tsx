import React from 'react';
import { Link } from 'react-router-dom';
import Favorite from '@material-ui/icons/Favorite';
import Comment from '@material-ui/icons/Comment';
import { ago, getPostSelector } from '../../../utils';
import { getPostId } from '../../../store/feed';

export default (props: any) => {
  const { post, upVotesCount = 0, commentsCount = 0 } = props;
  if (!post) {
    return null;
  }
  return (
    <Link to={`/posts/${encodeURIComponent(getPostId(post))}`}>
      <div id={getPostSelector(getPostId(post))} />
      <div className="border-t border-gray-300 md:border-gray-200 py-4 md:px-0 md:py-5 leading-none post cursor-pointer">
        <div className="px-3">
          <h2 className="tracking-wide md:tracking-normal text-base font-semibold md:text-xl md:font-bold title leading-snug md:leading-normal">
            {post.title}
          </h2>
          <div className="flex truncate mt-2 info text-xs md:text-sm items-center h-5">
            <span className="mr-5">{post.author}</span>
            <span className="mr-5">{ago(post.pubDate)}</span>
            {upVotesCount > 0 && (
              <div className="flex items-center font-bold text-sm md:text-base mr-5">
                <Favorite /> <span className="text-xs md:text-sm ml-1">{upVotesCount}</span>
              </div>
            )}
            {commentsCount > 0 && (
              <div className="flex items-center font-bold text-sm md:text-base">
                <Comment /> <span className="text-xs md:text-sm ml-1">{commentsCount}</span>
              </div>
            )}
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
        `}</style>
      </div>
    </Link>
  );
};
