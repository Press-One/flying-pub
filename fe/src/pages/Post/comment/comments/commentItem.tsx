import React from 'react';
import { ago } from 'utils';

export default class CommentItem extends React.Component<any, any> {
  render() {
    const { hideDivider, user, replyTo, tryDeleteComment, comment } = this.props;
    const isOwner = !!user && comment.userId === user.id;
    return (
      <div className="comment-item flex">
        <div className="avatar mr-4">
          <img src={comment.user.avatar} width="36px" height="36px" alt="avatar" />
        </div>
        <div className="w-full">
          <div className="flex leading-none items-center">
            <span className="mr-3 font-bold text-sm">{comment.user.name}</span>
            <span className="text-gray-600 text-xs">{ago(comment.createdAt)}</span>
          </div>
          <div className="mt-3">
            <div className="text-gray-800">{comment.content}</div>
            <div className="mt-3 flex justify-between items-center">
              <span
                className="cursor-pointer text-gray-600 text-xs"
                onClick={() => (isOwner ? tryDeleteComment(comment.id) : replyTo(comment.user))}
              >
                {isOwner ? '删除' : '回复'}
              </span>
            </div>
            {!hideDivider && <div className="border-b border-gray-300 my-6" />}
          </div>
        </div>
      </div>
    );
  }
}
