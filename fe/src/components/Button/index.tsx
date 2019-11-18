import React from 'react';
import classNames from 'classnames';

export default (props: any) => {
  const { onClick, fullWidth = false, small = false } = props;

  return (
    <button
      className={classNames(
        {
          'w-full': fullWidth,
          'text-xs py-2 px-3 md:py-1 md:px-3': small,
          'text-sm py-3 px-5 md:py-2 md:px-4': !small,
        },
        'text-white rounded font-bold outline-none bg-blue-400 leading-none md:leading-normal',
      )}
      onClick={() => {
        onClick && onClick();
      }}
    >
      <div className="flex justify-center items-center">{props.children}</div>
    </button>
  );
};
