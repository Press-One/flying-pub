import React from 'react';
import classNames from 'classnames';
import ButtonProgress from 'components/ButtonProgress';

interface Props {
  className?: string;
  onClick?: () => unknown;
  fullWidth?: boolean;
  size?: 'normal' | 'small' | 'mini';
  color?: 'primary' | 'gray' | 'red' | 'green' | 'white';
  disabled?: boolean;
  children?: React.ReactNode;
  outline?: boolean;
  isDoing?: boolean;
  isDone?: boolean;
  progressSize?: number;
}

export default (props: Props) => {
  const {
    className,
    onClick,
    fullWidth = false,
    size = 'normal',
    color = 'primary',
    disabled,
    outline = false,
    isDoing = false,
    isDone = false,
  } = props;

  return (
    <button
      className={classNames(
        'button',
        className,
        {
          'w-full': fullWidth,
          normal: size === 'normal',
          small: size === 'small',
          mini: size === 'mini',
          'bg-blue-400 text-white': !outline && color === 'primary',
          'bg-gray-af text-white': !outline && color === 'gray',
          'bg-green-500 text-white': !outline && color === 'green',
          'border-blue-400 text-blue-400 border outline': outline && color === 'primary',
          'border-red-400 text-red-400 border outline': outline && color === 'red',
          'border-green-500 text-green-500 border outline': outline && color === 'green',
          'border-white text-white border outline': outline && color === 'white',
          'border-gray-af text-gray-af border outline': outline && color === 'gray',
        },
        'rounded-full outline-none leading-none',
      )}
      onClick={() => {
        onClick && onClick();
      }}
      disabled={disabled}
    >
      <div className="flex justify-center items-center">
        {props.children}
        <ButtonProgress
          isDoing={isDoing}
          isDone={isDone}
          color={outline ? 'text-blue-400' : 'text-white'}
        />
      </div>
      <style jsx>{`
        .button.mini {
          min-width: 45px;
          font-size: 12px;
          padding: 6px 8px;
        }
        .button.mini.outline {
          padding: 5px 7px;
        }
        .button.small {
          min-width: 60px;
          font-size: 13px;
          padding: 9px 12px;
        }
        .button.small.outline {
          padding: 8px 11px;
        }
        .button.normal {
          font-size: 14px;
          padding: 9px 24px;
        }
        .button.normal.w-full {
          font-size: 15px;
          padding: 11px 24px;
        }
        .button.normal.outline {
          padding: 8px 23px;
        }
        .button[disabled] {
          color: rgba(0, 0, 0, 0.26);
          background-color: rgba(0, 0, 0, 0.12);
        }
      `}</style>
    </button>
  );
};
