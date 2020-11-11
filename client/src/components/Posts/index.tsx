import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import classNames from 'classnames';
import { IPost } from 'apis/post';
import { Link } from 'react-router-dom';
import { isMobile, ago, getImageWidth } from 'utils';
import TopicLabels from 'components/TopicLabels';
import Tooltip from '@material-ui/core/Tooltip';
import Img from 'components/Img';

const AVATAR_RATIO = isMobile ? 1 : 3 / 2;

interface IPostsProps {
  posts: IPost[];
  borderTop?: boolean;
  hideAuthor?: boolean;
  authorPageEnabled?: boolean;
  styleStickyEnabled?: boolean;
  hiddenSticky?: boolean;
  hideTopics?: boolean;
  smallCoverSize?: boolean;
}
interface IPostProps {
  post: IPost;
  postsProps: IPostsProps;
}

const PostEntry = observer((props: IPostProps) => {
  const {
    post,
    postsProps: {
      hideAuthor = false,
      styleStickyEnabled = false,
      hiddenSticky = false,
      hideTopics = false,
      smallCoverSize = false,
    },
  } = props;
  const coverWidth = smallCoverSize ? (isMobile ? 86 : 120) : isMobile ? 86 : 150;
  const state = useLocalStore(() => ({
    useOriginalCover: false,
  }));

  if (!post) {
    return null;
  }
  const postId = post.rId;

  if (hiddenSticky && post.sticky) {
    return null;
  }

  const showTopics = !hideTopics && post.topics && post.topics.length > 0;

  return (
    <div>
      <div id={post.rId} />
      <div className="border-b border-gray-200 py-10-px md:px-0 md:py-5 leading-none post cursor-pointer bg-white">
        <div className="flex justify-between items-start px-4">
          <div className="text-gray-88 box-border flex-1">
            <div
              className={classNames(
                {
                  height: post.cover || showTopics,
                  'small-height': !post.cover && !showTopics,
                },
                'flex flex-col justify-between items-start',
              )}
            >
              <Link to={`/posts/${encodeURIComponent(postId)}`}>
                {!showTopics && post.cover && <div className="pt-1" />}
                <h2
                  className={classNames(
                    {
                      'w-90-vw': isMobile && !post.cover,
                    },
                    'tracking-wide md:tracking-normal text-base font-bold md:pb-2',
                  )}
                >
                  <div className="title leading-snug md:leading-normal">
                    {styleStickyEnabled && post.sticky && (
                      <span className="bg-red-600 text-white px-1 md:px-2 rounded-sm round leading-none mr-2 font-normal sticky">
                        置顶
                      </span>
                    )}
                    {post.title}
                  </div>
                </h2>
                {isMobile && (
                  <div className="mt-1 text-gray-af text-12 pb-4">{ago(post.pubDate)}</div>
                )}
              </Link>
              <div className="text-12 md:text-13 text-gray-99 md:mt-1">
                <div className="flex items-center">
                  {post.author && (
                    <Tooltip placement="left" title="点击进入 Ta 的主页" arrow>
                      <Link to={`/authors/${post.author.address}`}>
                        <div className="flex items-center z-10">
                          {!hideAuthor && (
                            <div className="flex items-center w-5 h-5 mr-1 md:mr-2">
                              <Img
                                className="w-5 h-5 rounded-full border border-gray-300"
                                src={post.author.avatar}
                                alt={'头像'}
                              />
                            </div>
                          )}
                          {!hideAuthor && (
                            <div className="nickname truncate">
                              {post.author && post.author.nickname}
                            </div>
                          )}
                        </div>
                      </Link>
                    </Tooltip>
                  )}
                  <Link to={`/posts/${encodeURIComponent(postId)}`}>
                    <div
                      className={classNames(
                        {
                          'h-auto': false,
                        },
                        'flex items-center',
                      )}
                    >
                      {post.viewCount > 0 && localStorage.getItem('VIEW_COUNT_ENABLED') && (
                        <div className="flex items-center">
                          {!hideAuthor && <span className="w-3 text-center opacity-75">·</span>}
                          <span className="font-bold mr-1">{post.viewCount}</span>阅读
                        </div>
                      )}
                      {post.upVotesCount > 0 && (
                        <div className="flex items-center">
                          {!hideAuthor && <span className="w-3 text-center opacity-75">·</span>}
                          <span className="font-bold mr-1">{post.upVotesCount}</span>赞
                        </div>
                      )}
                      {post.commentsCount > 0 && (
                        <div className="flex items-center">
                          {(post.upVotesCount > 0 || !hideAuthor) && (
                            <span className="w-3 text-center opacity-75">·</span>
                          )}
                          <span className="font-bold mr-1">{post.commentsCount} </span>评论
                        </div>
                      )}
                      {(post.upVotesCount > 0 || post.commentsCount > 0 || !hideAuthor) &&
                        !isMobile && <span className="w-3 text-center opacity-75">·</span>}
                      {!isMobile && <div>{ago(post.pubDate)}</div>}
                    </div>
                  </Link>
                </div>
                {showTopics && (
                  <div className="mt-2">
                    <TopicLabels topics={post.topics} post={post} maxListCount={1} />
                  </div>
                )}
                {!showTopics && !hideAuthor && <div className="pb-0 md:pb-1" />}
              </div>
            </div>
          </div>
          {post.cover && (
            <div
              className="cover ml-5 md:ml-8 cover-container rounded"
              style={{
                backgroundImage: state.useOriginalCover
                  ? `url(${post.cover})`
                  : `url(${post.cover}?image=&action=resize:h_${
                      getImageWidth(coverWidth) / AVATAR_RATIO
                    })`,
              }}
            >
              <Link to={`/posts/${encodeURIComponent(postId)}`}>
                <img
                  className="cover rounded invisible"
                  src={`${post.cover}?image=&action=resize:h_${
                    getImageWidth(coverWidth) / AVATAR_RATIO
                  }`}
                  alt="封面"
                  onError={() => {
                    if (!state.useOriginalCover) {
                      state.useOriginalCover = true;
                    }
                  }}
                />
              </Link>
            </div>
          )}
        </div>
        <style jsx>{`
          .sticky {
            position: relative;
            top: -${isMobile ? 1 : 2}px;
            font-size: ${isMobile ? 13 : 14}px;
            padding-top: 1px;
            padding-bottom: 1px;
          }
          .title {
            font-size: ${isMobile ? '16px' : '18px'};
            color: #333;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 200px;
          }
          .nickname {
            max-width: ${isMobile ? 7 : 8}rem;
          }
          .height {
            min-height: ${coverWidth / AVATAR_RATIO}px;
          }
          .small-height {
            min-height: 55px;
          }
          .cover-container {
            background-size: cover;
            background-position: center center;
          }
          .cover {
            width: ${coverWidth}px;
            height: ${coverWidth / AVATAR_RATIO}px;
          }
        `}</style>
      </div>
    </div>
  );
});

export default (props: IPostsProps) => {
  const { borderTop } = props;

  return (
    <div
      className={classNames({
        'border-t border-gray-300 md:border-gray-200': borderTop,
      })}
    >
      {props.posts.map((post) => {
        return (
          <div key={post.rId}>
            <PostEntry post={post} postsProps={props} />
          </div>
        );
      })}
    </div>
  );
};
