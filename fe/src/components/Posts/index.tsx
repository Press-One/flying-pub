import React from 'react';
import { Post } from 'store/feed';
import classNames from 'classnames';
import PostEntry from './PostEntry';

export default (props: any) => {
  const posts: Post[] = props.posts || [];
  const { borderTop, hideAuthor, authorPageEnabled } = props;
  return (
    <div
      className={classNames({
        'border-t border-gray-300 md:border-gray-200': borderTop,
      })}
    >
      {posts.map((post: Post) => {
        return <PostEntry post={post} key={post.rId} hideAuthor={hideAuthor} authorPageEnabled={authorPageEnabled} />;
      })}
    </div>
  );
};
