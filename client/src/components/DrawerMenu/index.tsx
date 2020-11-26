import React from 'react';
import DrawerModal from 'components/DrawerModal';
import { stopBodyScroll, sleep } from 'utils';

type Item = {
  invisible?: boolean;
  name: string;
  onClick: () => void;
  stayOpenAfterClick?: boolean;
  className?: string;
};

interface IProps {
  open: boolean;
  onClose: () => unknown;
  items: Item[];
}

const MenuItem = (props: any) => {
  const { onClick, className } = props;
  return (
    <div
      className={`py-4 text-gray-4a text-center border-b border-gray-ec bg-white text-16 ${className}`}
      onClick={onClick}
    >
      {props.children}
    </div>
  );
};

export default (props: IProps) => {
  const { open, onClose, items } = props;

  return (
    <DrawerModal
      smallRadius
      hideCloseButton
      open={open}
      onClose={() => {
        onClose();
        stopBodyScroll(false);
      }}
    >
      <div className="bg-gray-f2 leading-none rounded-t-10">
        {items
          .filter((item) => !item.invisible)
          .map((item) => (
            <div key={item.name}>
              <MenuItem
                className={item.className}
                onClick={async () => {
                  if (!item.stayOpenAfterClick) {
                    onClose();
                  }
                  stopBodyScroll(false);
                  await sleep(item.stayOpenAfterClick ? 0 : 200);
                  item.onClick();
                }}
              >
                {item.name}
              </MenuItem>
            </div>
          ))}
        <div className="mt-1">
          <MenuItem
            onClick={() => {
              onClose();
              stopBodyScroll(false);
            }}
          >
            取消
          </MenuItem>
        </div>
      </div>
    </DrawerModal>
  );
};
