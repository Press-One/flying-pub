import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { ago, isMobile, urlify, isSafari, isIPhone, isPc } from 'utils';
import { faComment, faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MoreHoriz from '@material-ui/icons/MoreHoriz';
import Img from 'components/Img';

export default observer((props: any) => {
  const state = useLocalStore(() => ({
    canExpand: false,
    expand: false,
    readyToFold: isSafari || isIPhone ? false : true,
  }));
  const commentRef = React.useRef<any>();

  React.useEffect(() => {
    const setCanExpand = () => {
      if (commentRef.current && commentRef.current.scrollHeight > commentRef.current.clientHeight) {
        state.canExpand = true;
      } else {
        state.canExpand = false;
      }
    };

    setCanExpand();
    window.addEventListener('resize', setCanExpand);
    if (isSafari || isIPhone) {
      setTimeout(() => {
        state.readyToFold = true;
        setTimeout(() => {
          setCanExpand();
        }, 0);
      }, 400);
    }
    return () => {
      window.removeEventListener('resize', setCanExpand);
    };
  }, [state]);

  const {
    hideDivider,
    user,
    replyTo,
    upVote,
    resetVote,
    comment,
    selectComment,
    highlight,
    canStick,
    openCommentMenu,
  } = props;
  const isOwner = !!user && comment.userId === user.id;

  return (
    <div
      className={classNames(
        {
          highlight: highlight,
          'border-b border-gray-200 duration-500 ease-in-out transition-all': !hideDivider,
        },
        'comment-item pt-4 md:pt-5 md:pb-1 px-4',
      )}
      id={`comment_${comment.id}`}
    >
      <div className="relative">
        <div className="avatar rounded absolute top-0 left-0">
          <Link to={`/authors/${comment.user.address}`}>
            <Img
              src={comment.user.avatar}
              width="36px"
              height="36px"
              alt="avatar"
              className="rounded"
            />
          </Link>
        </div>
        <div className="ml-3 md:ml-4" style={{ paddingLeft: '36px' }}>
          <div className="flex justify-between items-start md:items-center">
            <div className="flex items-center leading-none text-14 text-gray-99 relative">
              <div>
                <div className="flex items-center">
                  <Link to={`/authors/${comment.user.address}`}>
                    <span
                      className={classNames(
                        { 'name-max-width block': isMobile },
                        'truncate text-14 text-gray-88',
                      )}
                    >
                      {comment.user.nickname}
                    </span>
                  </Link>
                </div>
              </div>
              {isPc && <span className="mx-1 w-2 text-center opacity-75">·</span>}
              {isPc && <span className="text-12">{ago(comment.createdAt)}</span>}
              {comment.sticky && (
                <div
                  className={classNames(
                    {
                      md: isPc,
                    },
                    'py-3-px px-6-px bg-gray-bf text-white rounded text-12 w-9 absolute top-label',
                  )}
                >
                  置顶
                </div>
              )}
            </div>
            <div className="relative">
              <div className="flex items-center text-gray-9b leading-none absolute top-0 right-0 md:-mt-3">
                {(isOwner || canStick) && (
                  <span
                    className="flex items-center cursor-pointer text-xs px-1 pt-2-px pb-3-px w-12 md:w-16 justify-end more"
                    onClick={(e) => {
                      openCommentMenu(comment, e);
                    }}
                  >
                    <span className="flex items-center text-18 pr-2 md:pr-1">
                      <MoreHoriz />
                    </span>
                  </span>
                )}
                {!isOwner && (
                  <span
                    className="flex items-center cursor-pointer text-xs px-1 pt-2-px pb-3-px w-12 md:w-16 justify-end ml-2"
                    onClick={() => replyTo(comment)}
                  >
                    <span className="flex items-center text-16 pr-2 md:pr-1">
                      <FontAwesomeIcon icon={faComment} />
                    </span>
                  </span>
                )}
                <div
                  className={classNames(
                    {
                      'text-blue-400': comment.voted,
                    },
                    'flex items-center justify-end cursor-pointer pl-1 pt-2-px pb-3-px pr-0 w-12 md:w-16',
                  )}
                  onClick={() => (comment.voted ? resetVote(comment.id) : upVote(comment.id))}
                >
                  <span className="flex items-center text-16 pr-1 md">
                    <FontAwesomeIcon icon={faThumbsUp} />
                  </span>
                  <span className="font-bold">{Number(comment.upVotesCount) || ''}</span>
                </div>
              </div>
            </div>
          </div>
          {isMobile && <div className="text-12 text-gray-bd mt-4-px">{ago(comment.createdAt)}</div>}
          <div className="mt-4-px md:mt-2 pb-3">
            <div className="mb-4-px md:mb-1">
              {comment.replyComment && (
                <div
                  className="border-blue-300 pl-2 text-12 cursor-pointer md:mt-0"
                  style={{ borderLeftWidth: '3px' }}
                  onClick={() => {
                    selectComment(comment.replyComment.id, {
                      behavior: 'smooth',
                    });
                  }}
                >
                  <div className="text-blue-400">{comment.replyComment.user.nickname}</div>
                  <div className="truncate text-gray-99">{comment.replyComment.content}</div>
                </div>
              )}
            </div>
            <div
              className={classNames(
                {
                  'comment-expand': state.expand,
                  'comment-fold': !state.expand && state.readyToFold,
                },
                'comment-body comment text-gray-1e break-words whitespace-pre-wrap',
              )}
              onClick={() => isMobile && replyTo(comment)}
              ref={commentRef}
              dangerouslySetInnerHTML={{ __html: urlify(comment.content) }}
            />
            {state.canExpand && (
              <div
                className="text-blue-400 cursor-pointer pt-1"
                onClick={() => (state.expand = !state.expand)}
              >
                {state.expand ? '收起' : '展开'}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .name-max-width {
          max-width: 140px;
        }
        .gray {
          color: #8b8b8b;
        }
        .dark {
          color: #404040;
        }
        .highlight {
          background: #e2f6ff;
        }
        .comment-body {
          font-size: 14px;
          line-height: 1.625;
        }
        .comment-fold {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 10;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
        .comment-expand {
          max-height: unset !important;
          -webkit-line-clamp: unset !important;
        }
        .more {
          height: 18px;
        }
        .top-label {
          top: -2px;
          right: -42px;
        }
        .top-label.md {
          right: -48px;
        }
      `}</style>
    </div>
  );
});
