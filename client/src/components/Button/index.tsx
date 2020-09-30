import React from 'react';
import classNames from 'classnames';

interface Props {
  className?: string;
  onClick?: () => unknown;
  fullWidth?: boolean;
  small?: boolean;
  color?: 'primary' | 'gray';
  disabled?: boolean;
  children?: React.ReactNode;
  outline?: boolean;
}

export default (props: Props) => {
  const {
    className,
    onClick,
    fullWidth = false,
    small = false,
    color = 'primary',
    disabled,
    outline = false,
  } = props;

  return (
    <button
      className={classNames(
        'the-button',
        className,
        {
          'w-full': fullWidth,
          'text-xs py-2 px-3 md:py-1 md:px-3': small,
          'text-sm py-3 px-5 md:py-2 md:px-4': !small,
          'bg-blue-400 text-white': !outline && color === 'primary',
          'bg-gray-300 text-gray-600': !outline && color === 'gray',
          'border border-blue-400 text-blue-400': outline,
        },
        'rounded font-bold outline-none leading-none md:leading-normal',
      )}
      onClick={() => {
        onClick && onClick();
      }}
      disabled={disabled}
    >
      <div className="flex justify-center items-center">{props.children}</div>
      <style jsx>{`
        .the-button[disabled] {
          color: rgba(0, 0, 0, 0.26);
          background-color: rgba(0, 0, 0, 0.12);
        }
      `}</style>
    </button>
  );
};
