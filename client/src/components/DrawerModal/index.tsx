import React from 'react';
import Drawer from '@material-ui/core/Drawer';
import { MdClear } from 'react-icons/md';
import classNames from 'classnames';

interface Props {
  open: boolean;
  onClose: () => unknown;
  hideCloseButton?: boolean;
  smallRadius?: boolean;
  darkMode?: boolean;
  useCustomZIndex?: boolean;
  children: React.ReactNode;
}

export default (props: Props) => {
  const {
    open,
    onClose,
    hideCloseButton,
    smallRadius,
    darkMode = false,
    useCustomZIndex = false,
  } = props;
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      ModalProps={{ className: useCustomZIndex ? 'custom-z-index' : '' }}
    >
      <div
        className={classNames(
          {
            'small-radius': smallRadius,
          },
          'content relative overflow-hidden bg-white',
        )}
      >
        {props.children}
        {!hideCloseButton && (
          <div
            onClick={onClose}
            className={classNames(
              {
                'text-black': !darkMode,
                'text-white': darkMode,
              },
              'absolute top-0 right-0 p-3 mr-1',
            )}
          >
            <div className="flex justify-center items-center w-6 h-6 rounded-full text-32 pr-1">
              <MdClear />
            </div>
          </div>
        )}
        <style jsx>{`
          .content {
            border-radius: 16px 16px 0 0;
            overflow: hidden !important;
          }
          .content.small-radius {
            border-radius: 10px 10px 0 0;
          }
        `}</style>
        <style jsx global>{`
          .MuiDrawer-paper {
            background: none !important;
          }
          .custom-z-index {
            z-index: 1000 !important;
          }
        `}</style>
      </div>
    </Drawer>
  );
};
