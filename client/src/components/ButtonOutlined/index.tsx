import React from 'react';

export default (props: any) => {
  const { onClick } = props;

  return (
    <button
      className={
        'py-2 px-3 rounded-lg text-sm outline-none text-gray-500 border border-gray-500 flex items-center justify-center leading-none'
      }
      onClick={() => {
        onClick && onClick();
      }}
    >
      {props.children}
    </button>
  );
};
