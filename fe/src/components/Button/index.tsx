import React from 'react';
import classNames from 'classnames';

export default (props: any) => {
  const { onClick, fullWidth = false } = props;

  return (
    <button
      className={classNames(
        {
          'w-full': fullWidth,
        },
        'text-white py-2 px-4 rounded font-bold text-sm outline-none bg-blue-400',
      )}
      onClick={() => {
        onClick && onClick();
      }}
    >
      <div className="flex justify-center items-center">{props.children}</div>
    </button>
  );
};
