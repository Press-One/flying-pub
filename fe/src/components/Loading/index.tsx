import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

export default function(props: any) {
  const { size } = props;
  return (
    <div className="text-center">
      <CircularProgress size={size || 30} className="MuiCircularProgress" />
      <style jsx global>{`
        .MuiCircularProgress {
          color: #63b3ed;
        }
      `}</style>
    </div>
  );
}
