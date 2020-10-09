import React from 'react';
import { observer } from 'mobx-react-lite';
import { Dialog } from '@material-ui/core';
import { useStore } from 'store';
import CheckCircle from '@material-ui/icons/CheckCircle';
import Button from 'components/Button';

export default observer(() => {
  const { publishDialogStore } = useStore();
  const { open, file } = publishDialogStore;

  return (
    <Dialog
      open={open}
      onClose={() => publishDialogStore.hide()}
      transitionDuration={{
        enter: 500,
      }}
    >
      <div className="pt-4 px-12 pb-8 bg-white text-center">
        <div className="text-5xl text-blue-400">
          <CheckCircle />
        </div>
        <div className="text-xl font-bold mt-1 text-gray-700 px-10">发布成功</div>
        <div className="mt-6 text-gray-600 w-64 title">
          <div className="font-bold flex justify-center">
            《<div className="truncate m-w-56">{file.title}</div>》
          </div>
          <div className="mt-2 text-sm opacity-75">文章发布成功啦！</div>
          <div className="mt-1 text-sm opacity-75">已经推送给关注你的读者</div>
        </div>
        <div className="mt-8 pb-1">
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full" onClick={() => publishDialogStore.hide()}>
              去看看
            </Button>
          </a>
        </div>
        <style jsx>{`
          .title {
            font-size: 15px;
          }
        `}</style>
      </div>
    </Dialog>
  );
});
