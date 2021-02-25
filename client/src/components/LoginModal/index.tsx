import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdInfo, MdMoreHoriz } from 'react-icons/md';
import Button from 'components/Button';
import DrawerModal from 'components/DrawerModal';
import Modal from 'components/Modal';
import { getLoginUrl, isMobile, isWeChat } from 'utils';
import { useStore } from 'store';
import classNames from 'classnames';
import Api from 'api';

export default observer(() => {
  const [directing, setDirecting] = React.useState(false);
  const { modalStore, settingsStore, contextStore } = useStore();
  const { settings } = settingsStore;
  const providers = settings['auth.providers'] || [];
  const isPc = !isMobile;
  const noProviders = providers.length === 0;
  const isSingleProviders = providers.length === 1;
  const isOnlyMixinProvider = isSingleProviders && providers.includes('mixin');

  React.useEffect(() => {
    if (isWeChat && isOnlyMixinProvider) {
      Api.setAutoLoginUrl(getLoginUrl('mixin'));
    }
  }, [isOnlyMixinProvider]);

  if (contextStore.isMixin && isOnlyMixinProvider) {
    modalStore.openPageLoading();
    window.location.href = getLoginUrl('mixin');
    return null;
  }

  const renderMain = () => {
    if (noProviders) {
      return (
        <div className="p-8 bg-white md:rounded-12 text-center main">
          <div className="py-10 text-gray-700">
            settings.auth.providers 为空
            <div className="mt-4" />
            没有设置任何登录方式
          </div>
        </div>
      );
    }

    if (isOnlyMixinProvider) {
      return (
        <div>
          <div className="p-8 bg-white md:rounded-12 text-center main">
            <div className="text-lg font-bold text-gray-700 leading-none">登录</div>
            <div className="mt-4 text-gray-700">
              您需要使用 {settings['mixinApp.name']} 登录
              <br className="mt-2" />
              {isPc && `下一步你将跳转到${settings['mixinApp.name']} 登录页`}
              {isWeChat && (
                <span className="font-bold">如果你已经安装了 {settings['mixinApp.name']} </span>
              )}
              {isWeChat && (
                <div className="w-40 m-auto mt-3">
                  <div className="text-gray-700">
                    <div className="flex items-center text-2xl">
                      <span className="mr-1 text-sm">1. 点击右上角</span>
                      <MdMoreHoriz />
                    </div>
                    <div className="flex text-gray-700 mt-1">
                      2. 选择在<span className="font-bold px-1">Safari</span>中打开
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 text-gray-500 text-xs md:px-10">
              {settings['mixinApp.name']} 是一个全币种数字货币钱包
              <br className="mt-2" />
              只需手机号加 6 位数字密码
              <br className="mt-2" />
              即可享受免费实时转账体验
            </div>
            <div className="flex items-center justify-center mt-5 text-gray-500 text-xs">
              <span className="flex items-center text-lg mr-1">
                <MdInfo />
              </span>
              手机还没有安装 {settings['mixinApp.name']} ？
              {!isWeChat && (
                <a
                  className="text-blue-400"
                  href={settings['mixinApp.downloadUrl']}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  前往下载
                </a>
              )}
            </div>
            {isWeChat && (
              <div className="mt-4">
                <a href={settings['mixinApp.downloadUrl']}>
                  <Button>下载 {settings['mixinApp.name']} App</Button>
                </a>
              </div>
            )}
            {isPc && (
              <div className="mt-4">
                <a href={getLoginUrl('mixin')} onClick={() => setDirecting(true)}>
                  <Button isDoing={directing}>
                    使用<span className="mx-1"> {settings['mixinApp.name']} </span>
                    <span className="hidden md:inline-block">扫码</span>登录
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 bg-white md:rounded-12 text-center main">
        <div className="text-lg font-bold text-gray-700 leading-none">选择登录方式</div>
        <div
          className={classNames(
            {
              'py-2': isSingleProviders,
            },
            'mt-4 text-gray-700 px-3',
          )}
        >
          {providers.map((provider: string) => {
            return (
              <div key={provider}>
                {provider === 'mixin' && (
                  <div className="py-2">
                    <a href={getLoginUrl('mixin')} onClick={() => setDirecting(true)}>
                      <Button fullWidth isDoing={directing}>
                        使用<span className="mx-1"> {settings['mixinApp.name']} </span>
                        <span className="hidden md:inline-block">扫码</span>登录
                      </Button>
                    </a>
                  </div>
                )}
                {provider === 'pressone' && (
                  <div className="py-2">
                    <a href={getLoginUrl('pressone')} onClick={() => setDirecting(true)}>
                      <Button fullWidth isDoing={directing}>
                        使用 pressone 账号登录
                      </Button>
                    </a>
                  </div>
                )}
                {provider === 'xue' && (
                  <div className="py-2">
                    <a href={getLoginUrl('xue')} onClick={() => setDirecting(true)}>
                      <Button fullWidth isDoing={directing}>
                        使用 xue 账号登录
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
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
