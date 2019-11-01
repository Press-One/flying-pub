import React from 'react';
import CommentItem from './commentItem';

export default class Comments extends React.Component<any, any> {
  public render() {
    const { comments = [], user, replyTo, upVote, resetVote, tryDeleteComment } = this.props;
    return (
      <div className="push-top-xs">
        {comments.map((comment: any, index: number) => {
          const isLast = index === comments.length - 1;
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
            />
          );
        })}
      </div>
    );
  }
}
