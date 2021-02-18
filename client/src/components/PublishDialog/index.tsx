import React from 'react';
import { observer } from 'mobx-react-lite';
import { Dialog } from '@material-ui/core';
import { useStore } from 'store';
import { MdCheckCircle } from 'react-icons/md';
import Button from 'components/Button';
import DrawerModal from 'components/DrawerModal';
import { isMobile, isPc } from 'utils';
import postApi, { IPost } from 'apis/post';

export default observer(() => {
  const { publishDialogStore, modalStore, userStore, feedStore } = useStore();
  const { open, file } = publishDialogStore;
  const { post, setPost } = feedStore;

  const Main = () => (
    <div className="pt-4 px-12 pb-8 bg-white text-center">
      <div className="text-5xl text-blue-400">
        <MdCheckCircle />
      </div>
      <div className="text-xl font-bold mt-1 text-gray-700 px-10">发布成功</div>
      <div className="pt-6 text-gray-600 md:w-64 title">
        {isPc && (
          <div className="font-bold flex justify-center">
            《<div className="truncate m-w-56">{file.title}</div>》
          </div>
        )}
        {isPc && <div className="mt-2 text-sm opacity-75">文章发布成功啦！</div>}
        {isMobile && <div className="mt-1 pt-1-px text-sm opacity-75">你可以收录到自己的专题</div>}
        {isMobile && (
          <div className="mt-1 pt-1-px text-sm opacity-75">也可以去投稿让更多人发现这篇文章</div>
        )}
        {isPc && <div className="mt-1 pt-1-px text-sm opacity-75">去投稿让更多人发现这篇文章</div>}
      </div>
      <div className="mt-8 pb-1 flex justify-center">
        {isPc && (
          <a href={`/posts/${file.rId}`} target="_blank" rel="noopener noreferrer" className="mr-5">
            <Button outline onClick={() => publishDialogStore.hide()}>
              查看
            </Button>
          </a>
        )}
        {isPc && (
          <Button
            onClick={async () => {
              modalStore.openContribution({
                file,
              });
            }}
          >
            投稿
          </Button>
        )}
        {isMobile && (
          <Button
            color="green"
            className="mr-5"
            onClick={async () => {
              modalStore.openTopicList({
                post,
                userAddress: userStore.user.address,
                title: '收录到我的专题',
                type: 'CONTRIBUTION_TO_MY_TOPICS',
                onClose: async () => {
                  try {
                    const post: IPost = await postApi.fetchPost(file.rId, {
                      withPendingTopicUuids: true,
                    });
                    setPost(post);
                  } catch (err) {
                    console.log(err);
                  }
                },
              });
            }}
          >
            收录
          </Button>
        )}
        {isMobile && (
          <Button
            onClick={async () => {
              modalStore.openTopicList({
                post,
                userAddress: userStore.user.address,
                title: '开放投稿的专题',
                type: 'CONTRIBUTION_TO_PUBLIC_TOPICS',
                onClose: async () => {
                  try {
                    const post: IPost = await postApi.fetchPost(file.rId, {
                      withPendingTopicUuids: true,
                    });
                    setPost(post);
                  } catch (err) {
                    console.log(err);
                  }
                },
              });
            }}
          >
            投稿
          </Button>
        )}
      </div>
      <style jsx>{`
        .title {
          font-size: 15px;
        }
      `}</style>
    </div>
  );

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={() => publishDialogStore.hide()}>
        {Main()}
      </DrawerModal>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={() => publishDialogStore.hide()}
      transitionDuration={{
        enter: 300,
      }}
    >
      {Main()}
    </Dialog>
  );
});
