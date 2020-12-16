import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from '@material-ui/core/Dialog';
import DrawerModal from 'components/DrawerModal';
import Button from 'components/Button';
import { useDropzone } from 'react-dropzone';
import Loading from 'components/Loading';
import classNames from 'classnames';
import Api from 'api';
import { sleep, limitImageWidth, isMobile, isPc } from 'utils';
import { useStore } from 'store';

export default observer((props: any) => {
  const [loading, setLoading] = React.useState(false);
  const { open, close, uploadCallback } = props;
  const { snackbarStore } = useStore();

  const uploadImage = async (formData: any) => {
    const res = await Api.uploadImage(formData);
    return await res.json();
  };

  const onDrop = async (acceptedFiles: any) => {
    setLoading(true);
    try {
      const tasks = [];
      for (const file of acceptedFiles) {
        tasks.push(
          new Promise(async (resovle, reject) => {
            try {
              const newFile: any = await limitImageWidth(750, file);
              const formData = new FormData();
              formData.append('file', newFile);
              formData.append('file_name', newFile.name);
              const result = await uploadImage(formData);
              resovle(result);
            } catch (err) {
              reject(err);
            }
          }),
        );
      }
      const result = await Promise.all(tasks);
      await sleep(200);
      uploadCallback(result);
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: err.msg === 'INVALID_IMG' ? '请上传有效的图片文件' : '上传失败，请重新试一下',
        type: 'error',
      });
    }
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const Main = () => (
    <div className="bg-white rounded-12 text-center p-10 md:p-8">
      <div className="h-52 md:w-64 md:h-56 flex items-center justify-center border-4 border-dashed border-gray-400">
        {loading && (
          <div>
            <Loading size={40} />
          </div>
        )}
        {isPc && (
          <div
            {...getRootProps({ className: 'dropzone' })}
            className={classNames({ hidden: loading })}
          >
            <input {...getInputProps()} />
            <div className="text-xl text-gray-600">把图片拖动到这里</div>
            <div className="text-xs text-gray-500 mt-2">或者</div>
            <Button className="mt-3">在本地文件中浏览</Button>
          </div>
        )}
        {isMobile && (
          <div
            {...getRootProps({ className: 'dropzone' })}
            className={classNames({ hidden: loading })}
          >
            <input {...getInputProps()} />
            <Button size="large">点击插入图片</Button>
          </div>
        )}
      </div>
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
    <Dialog open={open} onClose={close}>
      {Main()}
    </Dialog>
  );
});
