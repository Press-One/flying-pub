import React from 'react';
import Drawer from '@material-ui/core/Drawer';
import Clear from '@material-ui/icons/Clear';

export default (props: any) => {
  const { open, onClose } = props;
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <div className="content relative overflow-hidden bg-white">
        {props.children}
        <div className="flex justify-center items-center w-6 h-6 absolute top-0 right-0 m-4 rounded-full bg-gray-300 text-white text-xl">
          <Clear onClick={onClose} />
        </div>
        <style jsx>{`
          .content {
            border-radius: 16px 16px 0 0;
            overflow: hidden !important;
          }
        `}</style>
        <style jsx global>{`
          .MuiPaper-root {
            background: none !important;
          }
        `}</style>
      </div>
    </Drawer>
  );
};
