import React from 'react';
import classNames from 'classnames';
import { ago } from 'utils';
import ThumbUpAltOutlined from '@material-ui/icons/ThumbUpAltOutlined';
import ClearOutlined from '@material-ui/icons/ClearOutlined';
import ModeCommentOutlined from '@material-ui/icons/ModeCommentOutlined';

export default class CommentItem extends React.Component<any, any> {
  render() {
    const { hideDivider, user, replyTo, upVote, resetVote, tryDeleteComment, comment } = this.props;
    const isOwner = !!user && comment.userId === user.id;
    return (
      <div className="comment-item flex">
        <div className="avatar mr-4">
          <img src={comment.user.avatar} width="36px" height="36px" alt="avatar" />
        </div>
        <div className="w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center leading-none">
              <span className="mr-3 font-bold text-sm">{comment.user.name}</span>
              <span className="hidden md:block text-gray-500 text-xs">
                {ago(comment.createdAt)}
              </span>
            </div>
            <div className="flex items-center text-gray-600 opacity-75 leading-none">
              <span
                className="flex items-center cursor-pointer text-xs mr-6 md:mr-8"
                onClick={() => (isOwner ? tryDeleteComment(comment.id) : replyTo(comment.user))}
              >
                <span className="flex items-center text-lg mr-1">
                  {isOwner ? <ClearOutlined /> : <ModeCommentOutlined />}
                </span>
                <span className="hidden md:block">{isOwner ? '删除' : '回复'}</span>
              </span>
              <div
                className={classNames(
                  {
                    'text-blue-600': comment.voted,
                  },
                  'flex items-center cursor-pointer',
                )}
                onClick={() => (comment.voted ? resetVote(comment.id) : upVote(comment.id))}
              >
                <span className="flex items-center text-lg mr-1">
                  <ThumbUpAltOutlined />
                </span>
                <span className="font-bold">{comment.upVotesCount || ''}</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-gray-800">{comment.content}</div>
            <div className="mt-3 md:hidden text-gray-500 text-xs">{ago(comment.createdAt)}</div>
            {!hideDivider && <div className="border-b border-gray-300 my-4 md:my-6" />}
          </div>
        </div>
      </div>
    );
  }
}
