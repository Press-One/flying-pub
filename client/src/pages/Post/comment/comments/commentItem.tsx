import React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { ago, isMobile } from 'utils';
import ThumbUpAltOutlined from '@material-ui/icons/ThumbUpAltOutlined';
import ModeCommentOutlined from '@material-ui/icons/ModeCommentOutlined';
import marked from 'marked';
import { resizeImage } from 'utils';

marked.setOptions({
  highlight: (code: string) => {
    return require('highlight.js').highlightAuto(code).value;
  },
});

export default class CommentItem extends React.Component<any, any> {
  render() {
    const {
      hideDivider,
      user,
      replyTo,
      upVote,
      resetVote,
      tryDeleteComment,
      comment,
      highlight,
    } = this.props;
    const isOwner = !!user && comment.userId === user.id;
    return (
      <div
        className={classNames(
          { highlight: highlight, 'border-b border-gray-300': !hideDivider },
          'comment-item flex pt-4 md:pt-6 px-4',
        )}
        id={`comment_${comment.id}`}
      >
        <div className="avatar mr-3 md:mr-4 rounded">
          <Link to={`/authors/${comment.user.address}`}>
            <img
              src={resizeImage(comment.user.avatar)}
              width="36px"
              height="36px"
              alt="avatar"
              className="rounded"
            />
          </Link>
        </div>
        <div className="w-full">
          <div className="flex justify-between items-start md:items-center">
            <div className="flex items-center leading-none text-gray-99 text-14">
              <div>
                <div className="flex items-center">
                  <Link to={`/authors/${comment.user.address}`}>
                    <span
                      className={classNames(
                        { 'name-max-width block': isMobile },
                        'truncate text-13 md:text-14 text-gray-99',
                      )}
                    >
                      {comment.user.nickname}
                    </span>
                  </Link>
                  {isOwner && isMobile && (
                    <span className="mx-1 w-2 text-center opacity-75">·</span>
                  )}
                  {isOwner && isMobile && (
                    <span
                      className="text-12 text-gray-af"
                      onClick={() => tryDeleteComment(comment.id)}
                    >
                      删除
                    </span>
                  )}
                </div>
                <div className="mt-2 md:hidden text-gray-af text-12">{ago(comment.createdAt)}</div>
              </div>
              <span className="hidden md:block mx-1 w-2 text-center opacity-75">·</span>
              <span className="hidden md:block text-12">{ago(comment.createdAt)}</span>
              {isOwner && !isMobile && <span className="mx-1 w-2 text-center opacity-75">·</span>}
              {isOwner && !isMobile && (
                <span className="text-12 text-gray-af" onClick={() => tryDeleteComment(comment.id)}>
                  删除
                </span>
              )}
            </div>
            <div className="relative">
              <div className="flex items-center text-gray-88 leading-none absolute top-0 right-0 -mt-1 md:-mt-3">
                {!isOwner && !isMobile && (
                  <span
                    className="flex items-center cursor-pointer text-xs mr-5 p-1 w-16"
                    onClick={() => replyTo(comment)}
                  >
                    <span className="flex items-center text-lg mr-1">
                      <ModeCommentOutlined />
                    </span>
                    <span>回复</span>
                  </span>
                )}
                <div
                  className={classNames(
                    {
                      'text-blue-400': comment.voted,
                    },
                    'flex items-center cursor-pointer p-1',
                  )}
                  onClick={() => (comment.voted ? resetVote(comment.id) : upVote(comment.id))}
                >
                  <span className="flex items-center text-lg mr-1">
                    <ThumbUpAltOutlined />
                  </span>
                  <span className="font-bold">{Number(comment.upVotesCount) || ''}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div
              className="markdown-body comment text-gray-1e pb-4 md:pb-5"
              onClick={() => isMobile && replyTo(comment)}
              dangerouslySetInnerHTML={{ __html: marked.parse(comment.content) }}
            />
          </div>
        </div>
        <style jsx>{`
          .name-max-width {
            max-width: 180px;
          }
          .markdown-body :global(img) {
            max-width: 80%;
          }
          .markdown-body :global(h1),
          .markdown-body :global(h2),
          .markdown-body :global(h3),
          .markdown-body :global(h4),
          .markdown-body :global(h5),
          .markdown-body :global(h6) {
            border: none;
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
          .markdown-body {
            font-size: ${isMobile ? 13 : 14}px;
          }
          .markdown-body :global(p) {
            line-height: 1.625;
          }
        `}</style>
      </div>
    );
  }
}
