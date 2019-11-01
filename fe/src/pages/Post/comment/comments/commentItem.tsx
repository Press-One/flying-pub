import React from 'react';
import { ago } from 'utils';
import ThumbUp from '@material-ui/icons/ThumbUpAlt';
import Delete from '@material-ui/icons/Clear';
import ChatBubble from '@material-ui/icons/ModeComment';

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
          <div className="flex justify-between items-center">
            <div className="flex items-center leading-none">
              <span className="mr-3 font-bold text-sm">{comment.user.name}</span>
              <span className="text-gray-600 text-xs">{ago(comment.createdAt)}</span>
            </div>
            <div className="flex items-center text-gray-600 opacity-75 leading-none">
              <span
                className="flex items-center cursor-pointer text-xs mr-8"
                onClick={() => (!isOwner ? tryDeleteComment(comment.id) : replyTo(comment.user))}
              >
                <span className="flex items-center text-lg mr-1">
                  {!isOwner ? <Delete /> : <ChatBubble />}
                </span>
                {!isOwner ? '删除' : '回复'}
              </span>
              <div className="flex items-center cursor-pointer ">
                <span className="flex items-center text-lg mr-1">
                  <ThumbUp />
                </span>
                <span>24</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-gray-800">{comment.content}</div>
            {!hideDivider && <div className="border-b border-gray-300 my-6" />}
          </div>
        </div>
      </div>
    );
  }
}
