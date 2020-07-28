import React from 'react';
import CommentItem from './commentItem';

export default class Comments extends React.Component<any, any> {
  public render() {
    const {
      comments = [],
      user,
      replyTo,
      upVote,
      resetVote,
      tryDeleteComment,
      selectedId,
    } = this.props;
    return (
      <div className="push-top-xs border-t border-gray-300 pt-5">
        {comments.map((comment: any, index: number) => {
          const isLast = index === comments.length - 1;
          const highlight = selectedId === comment.id;
          return (
            <CommentItem
              user={user}
              replyTo={replyTo}
              upVote={upVote}
              resetVote={resetVote}
              tryDeleteComment={tryDeleteComment}
              comment={comment}
              key={index}
              hideDivider={isLast}
              highlight={highlight}
            />
          );
        })}
      </div>
    );
  }
}
