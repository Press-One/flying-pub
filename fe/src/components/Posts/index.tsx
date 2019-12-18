import React from 'react';
import { Post } from 'store/feed';
import classNames from 'classnames';
import PostEntry from './PostEntry';

export default (props: any) => {
  const posts: Post[] = props.posts || [];
  const { borderTop, hideAuthor, postExtraMap = {}, blockMap = {} } = props;
  return (
    <div
      className={classNames({
        'border-t border-gray-300 md:border-gray-200': borderTop,
      })}
    >
      {posts.map((post: Post) => {
        const extra = postExtraMap[post.id];
        return (
          <PostEntry
            post={post}
            key={post.id}
            upVotesCount={extra ? Number(extra.upVotesCount) || 0 : 0}
            commentsCount={extra ? Number(extra.commentsCount) || 0 : 0}
            blockMap={blockMap}
            hideAuthor={hideAuthor}
          />
        );
      })}
    </div>
  );
};
