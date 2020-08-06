import React from 'react';
import { observer } from 'mobx-react-lite';
import Info from '@material-ui/icons/Info';
import MoreHoriz from '@material-ui/icons/MoreHoriz';
import Button from 'components/Button';
import ButtonProgress from 'components/ButtonProgress';
import DrawerModal from 'components/DrawerModal';
import Modal from 'components/Modal';
import { getLoginUrl, isMobile } from 'utils';
import { useStore } from 'store';

export default observer(() => {
  const [directing, setDirecting] = React.useState(false);
  const { modalStore } = useStore();
  const isPc = !isMobile;
  const isWeChat = isMobile;

  const renderMain = () => {
    return (
      <div>
        <div className="p-8 bg-white md:rounded text-center main">
          <div className="text-lg font-bold text-gray-700 leading-none">登录</div>
          <div className="mt-4 text-gray-700">
            您需要使用 Mixin App 登录
            <br className="mt-2" />
            {isPc && '下一步你将跳转到 Mixin 登录页'}
            {isWeChat && <span className="font-bold">如果你已经安装了 Mixin App</span>}
            {isWeChat && (
              <div className="w-40 m-auto mt-3">
                <div className="text-gray-700">
                  <div className="flex items-center text-2xl">
                    <span className="mr-1 text-sm">1. 点击右上角</span>
                    <MoreHoriz />
                  </div>
                  <div className="flex text-gray-700 mt-1">
                    2. 选择在<span className="font-bold px-1">Safari</span>中打开
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-5 text-gray-500 text-xs md:px-10">
            Mixin 是一个全币种数字货币钱包
            <br className="mt-2" />
            只需手机号加 6 位数字密码
            <br className="mt-2" />
            即可享受免费实时转账体验
          </div>
          <div className="flex items-center justify-center mt-5 text-gray-500 text-xs">
            <span className="flex items-center text-lg mr-1">
              <Info />
            </span>
            手机还没有安装 Mixin？
            {!isWeChat && (
              <a
                className="text-blue-400"
                href="https://mixin.one/messenger"
                target="_blank"
                rel="noopener noreferrer"
              >
                前往下载
              </a>
            )}
          </div>
          {isWeChat && (
            <div className="mt-4">
              <a href="https://mixin.one/messenger">
                <Button>下载 Mixin App</Button>
              </a>
            </div>
          )}
          {isPc && (
            <div className="mt-4">
              <a href={getLoginUrl()} onClick={() => setDirecting(true)}>
                <Button>
                  使用<span className="mx-1"> Mixin </span>
                  <span className="hidden md:inline-block">扫码</span>登录
                  <ButtonProgress isDoing={directing} />
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <DrawerModal open={modalStore.login.open} onClose={modalStore.closeLogin}>
        {renderMain()}
      </DrawerModal>
    );
  }

  return (
    <Modal open={modalStore.login.open} onClose={modalStore.closeLogin}>
      {renderMain()}
    </Modal>
  );
});
