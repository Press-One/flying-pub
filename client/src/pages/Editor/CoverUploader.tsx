import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import ImageEditor from 'components/ImageEditor';

export default observer((props: any) => {
  const { open, close, cover, setCover } = props;

  return (
    <Modal open={open} onClose={close} className="flex justify-center items-center">
      <div className="modal-content bg-white rounded-12 text-center p-8">
        <div className="w-64 h-56 flex items-center justify-center rounded-12 border-2 border-gray-400">
          <ImageEditor
            name="封面"
            imageUrl={cover}
            width={200}
            ratio={16 / 9}
            getImageUrl={(url: string) => {
              setCover(url);
            }}
          />
        </div>
      </div>
    </Modal>
  );
});
