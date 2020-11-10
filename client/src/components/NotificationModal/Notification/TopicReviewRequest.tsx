import React from 'react';
import { useStore } from 'store';
import { observer } from 'mobx-react-lite';
import ModalLink from 'components/ModalLink';
import Img from 'components/Img';
import Button from 'components/Button';
import IUser from 'types/user';
import { ITopic } from 'apis/topic';

interface IRequest {
  user: IUser;
  topic: ITopic;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default observer(() => {
  const { userStore, modalStore } = useStore();

  // const requests = [] as IRequest[];

  return (
    <div className="m-auto pb-2 pt-5 md:pt-8">
      <div className="border-gray-300 border-b flex mb-4 pb-4 pt-1">
        <div className="msg-avatar">
          <ModalLink
            to={`/authors/${userStore.user.address}`}
            className="font-bold text-blue-400"
            onClick={() => {
              modalStore.closeNotification();
            }}
          >
            <Img
              className="rounded-full"
              src={userStore.user.avatar}
              alt="avatar"
              width="36"
              height="36"
            />
          </ModalLink>
        </div>
        <div className="msg-body mx-3 flex-1">
          <p className="msg-title mb-2">
            <ModalLink
              to={`/authors/${userStore.user.address}`}
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              <span className="from-user-name">{userStore.user.nickname}</span>
            </ModalLink>
          </p>
          <div className="text-13 text-gray-4a">
            我想把文章《
            <ModalLink
              to={`/posts/${1}`}
              openInNew
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              哈哈哈
            </ModalLink>
            》投稿到你的专题《
            <ModalLink
              to={`/topics/${1}`}
              openInNew
              className="font-bold text-blue-400"
              onClick={() => {
                modalStore.closeNotification();
              }}
            >
              嘻嘻嘻
            </ModalLink>
            》
          </div>
          <div className="flex items-start mt-3">
            <Button className="mr-5" size="mini" outline color="gray">
              拒绝
            </Button>
            <Button size="mini">允许</Button>
          </div>
        </div>
      </div>
    </div>
  );
});
