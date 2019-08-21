import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import classNames from 'classnames';

import './index.scss';

export default function(props: any) {
  const { size, spaceSize, isPage } = props;
  return (
    <div
      className={classNames(
        {
          isPage: isPage,
          'push-top-md pad-bottom-md': spaceSize === 'small',
          'push-top-lg pad-bottom-lg': spaceSize === 'medium',
          'push-top-xxl pad-bottom-xxl': spaceSize === 'large',
        },
        'loading text-center',
      )}
    >
      <CircularProgress size={size || 40} className="link-color" />
    </div>
  );
}
