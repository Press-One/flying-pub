import React from 'react';
import { sleep } from 'utils';
import { useHistory } from 'react-router-dom';

interface IProps {
  to: string;
  children: any;
  className?: string;
  onClick?: any;
  openInNew?: boolean;
}

export default (props: IProps) => {
  const history = useHistory();

  const open = async () => {
    if (props.openInNew) {
      window.open(props.to);
    } else {
      await sleep(200);
      history.push(props.to);
    }
  };

  return (
    <span
      className={props.className + ' cursor-pointer'}
      onClick={(e) => {
        e.preventDefault();
        props.onClick && props.onClick();
        open();
      }}
    >
      {props.children}
    </span>
  );
};
