import React from 'react';
import { observer } from 'mobx-react-lite';
import CommentItem from './commentItem';

export default observer((props: any) => {
  const {
    stickyComments = [],
    user,
    replyTo,
    upVote,
    resetVote,
    deleteComment,
    stickComment,
    unstickComment,
    selectComment,
    selectedId,
    canStick,
  } = props;
  const comments = props.comments.filter((comment: any) => !comment.sticky);

  return (
    <div className="-mt-2 md:mt-0 md:border-t md:border-gray-300 md:pt-5">
      <div>
        {stickyComments.map((comment: any, index: number) => {
          const isLast = comments.filter((comment: any) => !comment.sticky).length === 0;
          const highlight = Number(selectedId) === Number(comment.id);
          return (
            <CommentItem
              user={user}
              replyTo={replyTo}
              upVote={upVote}
              resetVote={resetVote}
              deleteComment={deleteComment}
              stickComment={stickComment}
              unstickComment={unstickComment}
              comment={comment}
              key={index}
              hideDivider={isLast}
              selectComment={selectComment}
              highlight={highlight}
              canStick={canStick}
            />
          );
        })}
      </div>
      {comments.map((comment: any, index: number) => {
        const isLast = index === comments.length - 1;
        const highlight = Number(selectedId) === Number(comment.id);
        if (comment.sticky) {
          return null;
        }
        return (
          <CommentItem
            user={user}
            replyTo={replyTo}
            upVote={upVote}
            resetVote={resetVote}
            deleteComment={deleteComment}
            stickComment={stickComment}
            unstickComment={unstickComment}
            comment={comment}
            key={index}
            hideDivider={isLast}
            selectComment={selectComment}
            highlight={highlight}
            canStick={canStick}
          />
        );
      })}
    </div>
  );
});
