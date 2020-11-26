import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import DrawerModal from 'components/DrawerModal';
import ImageEditor from 'components/ImageEditor';
import Button from 'components/Button';
import { isMobile } from 'utils';

export default observer((props: any) => {
  const { open, close, cover, setCover } = props;

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={close}>
        <div className="p-8 bg-white rounded-12 text-gray-4a">
          <div className="font-bold items-center text-18 flex justify-center md:justify-start">
            设置
          </div>
          <div className="mt-5 flex justify-center">
            <ImageEditor
              name="封面"
              imageUrl={cover}
              width={350}
              placeholderWidth={200}
              editorPlaceholderWidth={300}
              ratio={3 / 2}
              getImageUrl={(url: string) => {
                setCover(url);
              }}
            />
          </div>
          <div className="mt-8 flex justify-end">
            <Button onClick={close} className="w-full md:w-auto">
              完成
            </Button>
          </div>
        </div>
      </DrawerModal>
    );
  }

  return (
    <Modal open={open} onClose={close} className="flex justify-center items-center">
      <div className="modal-content bg-white rounded-12 text-center p-8">
        <div className="w-64 h-56 flex items-center justify-center rounded-12 border-2 border-gray-400">
          <ImageEditor
            name="封面"
            imageUrl={cover}
            width={350}
            placeholderWidth={200}
            editorPlaceholderWidth={300}
            ratio={3 / 2}
            getImageUrl={(url: string) => {
              setCover(url);
              close();
            }}
          />
        </div>
      </div>
    </Modal>
  );
});
