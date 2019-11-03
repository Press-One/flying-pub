import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

export default function(props: any) {
  const { size } = props;
  return (
    <div className="text-center">
      <CircularProgress size={size || 40} className="text-blue-400" />
    </div>
  );
}
