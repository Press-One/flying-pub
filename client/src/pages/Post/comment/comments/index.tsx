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
      selectComment,
      selectedId,
    } = this.props;
    return (
      <div className="-mt-2 md:mt-0 md:border-t md:border-gray-300 md:pt-5">
        {comments.map((comment: any, index: number) => {
          const isLast = index === comments.length - 1;
          const highlight = Number(selectedId) === Number(comment.id);
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
              selectComment={selectComment}
              highlight={highlight}
            />
          );
        })}
      </div>
    );
  }
}
