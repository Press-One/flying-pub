import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from '@material-ui/core/Dialog';
import Button from 'components/Button';
import DrawerModal from 'components/DrawerModal';
import Loading from 'components/Loading';
import { isMobile } from 'utils';

export default observer((props: any) => {
  const { open, close, loading, selectMenuItem } = props;

  const Main = () => (
    <div className="pt-8 px-12 pb-10 relative">
      <div className="px-12 text-16 text-center font-bold">选择操作方式</div>
      <div className="mt-5 flex flex-col items-center">
        <Button fullWidth onClick={() => selectMenuItem('upload')}>
          上传图片
        </Button>
        <Button fullWidth className="mt-4" onClick={() => selectMenuItem('openImageLib')}>
          在图库中选择
        </Button>
      </div>
      {loading && (
        <div className="absolute top-0 right-0 z-10 w-full py-20 mt-4 bg-white">
          <Loading />
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={close}>
        {Main()}
      </DrawerModal>
    );
  }

  return (
    <Dialog open={open} onClose={close} maxWidth={false}>
      {Main()}
    </Dialog>
  );
});
