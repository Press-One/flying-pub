import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import Button from 'components/Button';
import { useDropzone } from 'react-dropzone';
import Loading from 'components/Loading';
import classNames from 'classnames';
import Api from 'api';
import { sleep } from 'utils';
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
        const formData = new FormData();
        formData.append('file', file);
        formData.append('file_name', file.name);
        tasks.push(uploadImage(formData));
      }
      const result = await Promise.all(tasks);
      await sleep(200);
      uploadCallback(result);
    } catch (err) {
      snackbarStore.show({
        message: '上传失败，请重新试一下',
        type: 'error',
      });
    }
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Modal open={open} onClose={close} className="flex justify-center items-center">
      <div className="modal-content bg-white rounded-sm text-center p-8">
        <div className="w-64 h-56 flex items-center justify-center border-4 border-dashed border-gray-400">
          {loading && (
            <div>
              <Loading size={40} />
            </div>
          )}
          <div
            {...getRootProps({ className: 'dropzone' })}
            className={classNames({ hidden: loading })}
          >
            <input {...getInputProps()} />
            <div className="text-xl text-gray-600">把图片拖动到这里</div>
            <div className="text-xs text-gray-500 mt-2">或者</div>
            <Button className="mt-3">在本地文件中浏览</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
});
