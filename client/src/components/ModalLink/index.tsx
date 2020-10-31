import React from 'react';
import { sleep } from 'utils';
import { useHistory } from 'react-router-dom';

interface IProps {
  to: string;
  children: any;
  className?: string;
  onClick?: () => void;
}

export default (props: IProps) => {
  const history = useHistory();

  return (
    <span
      className={props.className + ' cursor-pointer'}
      onClick={(e) => {
        e.preventDefault();
        props.onClick && props.onClick();
        (async () => {
          await sleep(200);
          history.push(props.to);
        })();
      }}
    >
      {props.children}
    </span>
  );
};
