import React from 'react';
import Drawer from '@material-ui/core/Drawer';
import Clear from '@material-ui/icons/Clear';
import classNames from 'classnames';

interface Props {
  open: boolean;
  onClose: () => unknown;
  hideCloseButton?: boolean;
  darkMode?: boolean;
  children: React.ReactNode;
}

export default (props: Props) => {
  const { open, onClose, hideCloseButton, darkMode = false } = props;
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <div className="content relative overflow-hidden bg-white">
        {props.children}
        {!hideCloseButton && (
          <div
            onClick={onClose}
            className={classNames(
              {
                'text-white': !darkMode,
                'text-gray': darkMode,
              },
              'absolute top-0 right-0 p-3 mr-1',
            )}
          >
            <div className="flex justify-center items-center w-6 h-6 rounded-full bg-gray-300 text-xl">
              <Clear />
            </div>
          </div>
        )}
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
