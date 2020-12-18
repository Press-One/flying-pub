import React from 'react';
import { observer } from 'mobx-react-lite';
import DrawerModal from 'components/DrawerModal';
import ImageEditor from 'components/ImageEditor';
import Button from 'components/Button';

export default observer((props: any) => {
  const { open, close, cover, handleCoverChange } = props;

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
            getImageUrl={handleCoverChange}
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
});
