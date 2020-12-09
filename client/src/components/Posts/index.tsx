import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import classNames from 'classnames';
import { IPost } from 'apis/post';
import { isMobile, ago, getImageWidth } from 'utils';
import ModalLink from 'components/ModalLink';
import TopicLabels from 'components/TopicLabels';
import Img from 'components/Img';
import { faCommentDots, faThumbsUp, faEye } from '@fortawesome/free-regular-svg-icons';
import { faStar as faSolidStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IPostsProps {
  posts: IPost[];
  borderTop?: boolean;
  hideAuthor?: boolean;
  authorPageEnabled?: boolean;
  styleStickyEnabled?: boolean;
  hiddenSticky?: boolean;
  hideTopics?: boolean;
  smallCoverSize?: boolean;
  isMobileMode?: boolean;
  showFavorite?: boolean;
  onCloseModal?: () => void;
  onClickFavorite?: (post: IPost) => void;
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
      showFavorite = false,
      onCloseModal,
      onClickFavorite,
    },
  } = props;
  const isMobileMode = props.postsProps.isMobileMode || isMobile;
  const AVATAR_RATIO = isMobileMode ? 1 : 3 / 2;
  const coverWidth = smallCoverSize ? (isMobileMode ? 86 : 120) : isMobileMode ? 86 : 150;
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
      <div
        className={classNames(
          {
            'md:px-0 md:py-5': !isMobileMode,
          },
          `border-b border-gray-200 py-10-px leading-none post cursor-pointer bg-white`,
        )}
      >
        <div className="flex justify-between items-start px-4 relative">
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
              <div>
                {!showTopics && post.cover && <div className="pt-1" />}
                <ModalLink
                  onClick={() => {
                    onCloseModal && onCloseModal();
                  }}
                  to={`/posts/${encodeURIComponent(postId)}`}
                >
                  <h2
                    className={classNames(
                      {
                        'w-90-vw': isMobile && !post.cover,
                        'md:tracking-normal md:pb-2': !isMobileMode,
                      },
                      `tracking-wide text-base font-bold`,
                    )}
                  >
                    <div
                      className={classNames(
                        {
                          'md:leading-normal': !isMobileMode,
                        },
                        `title leading-snug`,
                      )}
                    >
                      {styleStickyEnabled && post.sticky && (
                        <span
                          className={classNames(
                            {
                              'md:px-2': !isMobileMode,
                            },
                            `bg-red-600 text-white px-1 rounded-sm round leading-none mr-2 font-normal sticky`,
                          )}
                        >
                          置顶
                        </span>
                      )}
                      {post.title}
                    </div>
                  </h2>
                </ModalLink>
                {isMobileMode && (
                  <ModalLink
                    onClick={() => {
                      onCloseModal && onCloseModal();
                    }}
                    to={`/posts/${encodeURIComponent(postId)}`}
                  >
                    <div
                      className={classNames(
                        {
                          'pb-2 mb-2': !showFavorite,
                          'mb-4': showFavorite,
                        },
                        'mt-1 text-gray-af text-12',
                      )}
                    >
                      {ago(post.pubDate)}
                    </div>
                  </ModalLink>
                )}
              </div>
              <div
                className={classNames(
                  {
                    'md:text-13 md:pt-1': !isMobileMode,
                  },
                  `text-12 text-gray-99`,
                )}
              >
                <div className="flex items-center">
                  {post.author && !hideAuthor && (
                    <ModalLink
                      onClick={() => {
                        onCloseModal && onCloseModal();
                      }}
                      to={`/authors/${post.author.address}`}
                    >
                      <div className="flex items-center z-10">
                        <div
                          className={classNames(
                            {
                              'md:mr-2': !isMobileMode,
                            },
                            `flex items-center w-5 h-5 mr-1`,
                          )}
                        >
                          <Img
                            className="w-5 h-5 rounded-full border border-gray-300"
                            src={post.author.avatar}
                            alt={'头像'}
                          />
                        </div>
                        <div
                          className={classNames(
                            {
                              sm: showFavorite,
                            },
                            'nickname truncate',
                          )}
                        >
                          {post.author && post.author.nickname}
                        </div>
                        <span
                          className={classNames(
                            {
                              'md:w-6 md:mr-0': !isMobileMode,
                            },
                            `w-5 mr-3-px`,
                          )}
                        ></span>
                      </div>
                    </ModalLink>
                  )}
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
                        <div
                          className={classNames(
                            {
                              'md:text-15': !isMobileMode,
                            },
                            `flex items-center text-14`,
                          )}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </div>
                        <span className="font-bold mr-1">{post.viewCount}</span>
                        <span
                          className={classNames(
                            {
                              'md:w-6 md:mr-0': !isMobileMode,
                            },
                            `w-5 mr-3-px`,
                          )}
                        ></span>
                      </div>
                    )}
                    {post.upVotesCount > 0 && (
                      <div className="flex items-center">
                        <div
                          className={classNames(
                            {
                              'md:-mt-2-px': !isMobileMode && hideAuthor,
                              'md:text-14 md:mt-0': !isMobileMode,
                            },
                            `flex items-center text-13 -mt-2-px`,
                          )}
                        >
                          <FontAwesomeIcon icon={faThumbsUp} />
                        </div>
                        <span className="font-bold ml-2-px">{post.upVotesCount}</span>
                        <span
                          className={classNames(
                            {
                              'md:w-6 md:mr-0': !isMobileMode,
                            },
                            `w-5 mr-3-px`,
                          )}
                        ></span>
                      </div>
                    )}
                    {post.commentsCount > 0 && (
                      <div className="flex items-center">
                        <div
                          className={classNames(
                            {
                              'md:text-15': !isMobileMode,
                            },
                            `flex items-center text-14`,
                          )}
                        >
                          <FontAwesomeIcon icon={faCommentDots} />
                        </div>
                        <span
                          className={classNames(
                            {
                              'md:ml-1': !isMobileMode,
                            },
                            `font-bold ml-3-px`,
                          )}
                        >
                          {post.commentsCount}
                        </span>
                        <span
                          className={classNames(
                            {
                              'md:w-6 md:mr-0': !isMobileMode,
                            },
                            `w-5 mr-3-px`,
                          )}
                        ></span>
                      </div>
                    )}
                    {!isMobileMode && <div className="text-gray-af">{ago(post.pubDate)}</div>}
                    {showFavorite && (
                      <div className="flex items-center">
                        <div
                          className={classNames(
                            {
                              'md:text-15 md:mt-0': !isMobileMode,
                            },
                            `flex items-center text-14 -mt-2-px pr-2 py-1 text-yellow-500`,
                          )}
                          onClick={() => {
                            onClickFavorite && onClickFavorite(post);
                          }}
                        >
                          <FontAwesomeIcon icon={faSolidStar} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {showTopics && (
                  <div className="mt-2">
                    <TopicLabels topics={post.topics} post={post} maxListCount={1} />
                  </div>
                )}
                {!showTopics && !hideAuthor && (
                  <div
                    className={classNames(
                      {
                        'md:pb-1': !isMobileMode,
                      },
                      `pb-0`,
                    )}
                  />
                )}
              </div>
            </div>
          </div>
          {post.cover && (
            <div
              className={classNames(
                {
                  'md:ml-8': !isMobileMode,
                },
                `cover ml-5 cover-container rounded`,
              )}
              style={{
                backgroundImage: state.useOriginalCover
                  ? `url(${post.cover})`
                  : `url(${post.cover}?image=&action=resize:h_${
                      getImageWidth(coverWidth) / AVATAR_RATIO
                    })`,
              }}
            >
              <ModalLink
                onClick={() => {
                  onCloseModal && onCloseModal();
                }}
                to={`/posts/${encodeURIComponent(postId)}`}
              >
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
              </ModalLink>
            </div>
          )}
        </div>
        <style jsx>{`
          .sticky {
            position: relative;
            top: -${isMobileMode ? 1 : 2}px;
            font-size: ${isMobileMode ? 13 : 14}px;
            padding-top: 1px;
            padding-bottom: 1px;
          }
          .title {
            font-size: ${isMobileMode ? '16px' : '18px'};
            color: #333;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 200px;
          }
          .nickname {
            max-width: ${isMobileMode ? 7 : 8}rem;
          }
          .nickname.sm {
            max-width: 4rem;
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
  const isMobileMode = props.isMobileMode || isMobile;

  return (
    <div
      className={classNames({
        'border-t border-gray-300': borderTop,
        'md:border-gray-200': !isMobileMode && borderTop,
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
