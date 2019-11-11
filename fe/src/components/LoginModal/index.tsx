import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import Info from '@material-ui/icons/Info';
import MoreHoriz from '@material-ui/icons/MoreHoriz';
import Clear from '@material-ui/icons/Clear';
import Button from 'components/Button';
import { getLoginUrl, isMobile } from 'utils';
import { useStore } from 'store';
import Drawer from '@material-ui/core/Drawer';

export default observer(() => {
  const { modalStore } = useStore();
  const isPc = !isMobile;
  const isWeChat = isMobile;

  const renderMain = () => {
    return (
      <div>
        <div className="pt-6 pb-8 px-10 bg-white md:rounded text-center main">
          <div className="text-lg font-bold text-gray-700">登陆</div>
          <div className="mt-4 text-gray-700">
            您需要使用 Mixin App 登陆
            <br className="mt-2" />
            {isPc && '下一步你将跳转到 Mixin 登陆页'}
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
          <div className="mt-5 text-gray-500 text-xs">
            Mixin 是一个全币种数字货币钱包
            <br className="mt-2" />
            只需手机号加 6 位数字密码{isMobile && <br className="mt-2" />}即可享受免费实时转账体验
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
            <div className="mt-5">
              <a href="https://mixin.one/messenger">
                <Button>下载 Mixin App</Button>
              </a>
            </div>
          )}
          {isPc && (
            <div className="mt-5">
              <a href={getLoginUrl()}>
                <Button>我已安装 Mixin，前往 Mixin 登陆页扫码登陆</Button>
              </a>
            </div>
          )}
        </div>
        {isMobile && (
          <style jsx>{`
            .main {
              border-radius: 16px 16px 0 0;
            }
          `}</style>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <Drawer anchor="bottom" open={modalStore.login.open} onClose={modalStore.closeLogin}>
        <div className="relative">
          {renderMain()}
          <div className="flex justify-center items-center w-6 h-6 absolute top-0 right-0 m-4 rounded-full bg-gray-300 text-white text-xl">
            <Clear onClick={modalStore.closeLogin} />
          </div>
        </div>
      </Drawer>
    );
  }

  return (
    <Modal
      open={modalStore.login.open}
      onClose={modalStore.closeLogin}
      className="flex justify-center items-center"
    >
      {renderMain()}
    </Modal>
  );
});
