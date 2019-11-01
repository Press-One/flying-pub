import React from 'react';

export default (props: any) => {
  const { onClick } = props;

  return (
    <button
      className="text-white py-2 px-4 rounded font-bold text-sm outline-none bg-blue-400"
      onClick={() => {
        onClick && onClick();
      }}
    >
      <div className="flex justify-center items-center">{props.children}</div>
    </button>
  );
};
