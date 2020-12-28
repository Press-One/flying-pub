import React from 'react';
import SmartLink from 'components/SmartLink';

interface IProps {
  to: string;
  children: any;
  className?: string;
  onClick?: any;
  openInNew?: boolean;
}

export default (props: IProps) => {
  return <SmartLink {...props} delayDuration={200} />;
};
