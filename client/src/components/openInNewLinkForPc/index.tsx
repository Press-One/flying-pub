import React from 'react';
import { isPc } from 'utils';
import ModalLink from 'components/ModalLink';

interface IProps {
  to: string;
  children: any;
  className?: string;
  onClick?: () => void;
}

export default (props: IProps) => {
  if (isPc) {
    return (
      <a
        href={props.to}
        target="_blank"
        rel="noopener noreferrer"
        className={props.className}
        onClick={() => {
          props.onClick && props.onClick();
        }}
      >
        {props.children}
      </a>
    );
  }

  return (
    <ModalLink
      to={props.to}
      children={props.children}
      className={props.className}
      onClick={() => props.onClick && props.onClick()}
    />
  );
};
