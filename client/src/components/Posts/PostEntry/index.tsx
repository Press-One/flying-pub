import React from 'react';
import { Link } from 'react-router-dom';
import ThumbUpAlt from '@material-ui/icons/ThumbUpAlt';
import Comment from '@material-ui/icons/Comment';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import { isMobile, ago, generateAvatar } from 'utils';

export default (props: any) => {
  const { post, hideAuthor = false, authorPageEnabled } = props;
  if (!post) {
    return null;
  }
  const postId = post.rId;
  const author = () => {
    const content = () => (
      <div className="flex items-center">
        <div className="flex items-center w-6 h-6 mr-2">
          <img
            className="w-6 h-6 rounded-full border border-gray-300"
            src={post.author.avatar}
            alt={post.author.name}
            onError={(e: any) => {
              e.target.src = generateAvatar(post.author.avatar);
            }}
          />
        </div>
        <span className={classNames({ 'name-max-width': isMobile }, 'mr-5 truncate')}>
          {post.author.name}
        </span>
      </div>
    );
    return authorPageEnabled ? (
      <Link to={`/authors/${post.author.address}`}>{content()}</Link>
    ) : (
      content()
    );
  };
  return (
    <div>
      <div id={post.rId} />
      <div className="border-b border-gray-300 md:border-gray-200 py-4 md:px-0 md:py-5 leading-none post cursor-pointer">
        <div className="px-4 gray">
          {!hideAuthor && (
            <div className="flex items-center pb-2">
              {!authorPageEnabled || isMobile ? (
                author()
              ) : (
                <Tooltip placement="left" title="点击进入 Ta 的主页">
                  {author()}
                </Tooltip>
              )}
              <span>{ago(post.pubDate)}</span>
            </div>
          )}
          <Link to={`/posts/${encodeURIComponent(postId)}`}>
            <div>
              <h2 className="tracking-wide md:tracking-normal text-base font-semibold md:text-lg md:font-bold title leading-snug md:leading-normal">
                {post.title}
              </h2>
              <div className="flex justify-between items-center mt-2 h-5 gray text-xs md:text-sm">
                <div className="flex truncate items-center">
                  {
                    <div className="flex items-center font-bold text-sm md:text-base mr-5">
                      <ThumbUpAlt />{' '}
                      <span className="text-xs md:text-sm ml-1">{post.upVotesCount || ''}</span>
                    </div>
                  }
                  {post.commentsCount > 0 && (
                    <div className="flex items-center font-bold text-sm md:text-base">
                      <Comment />{' '}
                      <span className="text-xs md:text-sm ml-1">{post.commentsCount}</span>
                    </div>
                  )}
                </div>
                {hideAuthor && <div>{ago(post.pubDate)}</div>}
              </div>
            </div>
          </Link>
        </div>
        <style jsx>{`
          .name-max-width {
            max-width: 200px;
          }
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
          .gray {
            color: #aea9ae;
          }
        `}</style>
      </div>
    </div>
  );
};
