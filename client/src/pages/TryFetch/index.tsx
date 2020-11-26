import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { sleep, isMobile, isWeChat, getQuery } from 'utils';
import Api from 'api';
import authApi from 'apis/auth';
import settingsApi from 'apis/settings';

export default observer((props: any) => {
  const {
    preloadStore,
    userStore,
    socketStore,
    modalStore,
    settingsStore,
    confirmDialogStore,
  } = useStore();

  React.useEffect(() => {
    const { ready } = preloadStore;
    if (ready) {
      return;
    }

    const fetchSettings = async () => {
      const settings = await settingsApi.fetchSettings();
      settingsStore.setSettings(settings);
      modalStore.setAuthProviders(settings['auth.providers'] || []);
      return settings;
    };

    const fetchUser = async (settings: any) => {
      try {
        const user = await Api.fetchUser();
        userStore.setUser(user);
        Api.fetchProfiles().then((profiles) => {
          userStore.setProfiles(profiles);
        });

        socketStore.init(user.id);
        fetchPermission();
      } catch (err) {
        if (getQuery('action') === 'PERMISSION_DENY') {
          return;
        }
        if (settings['permission.isPrivate']) {
          if (isWeChat && settings['mixinApp.onlyAllowedMobileDevice']) {
            confirmDialogStore.show({
              content: `请在 ${settings['mixinApp.name']} 中打开`,
              cancelDisabled: true,
              okText: '我知道了',
              ok: () => confirmDialogStore.hide(),
            });
            return false;
          }
          userStore.setShouldLogin();
          confirmDialogStore.show({
            content: '阅读文章之前请登录一下哦',
            cancelDisabled: true,
            okText: '前往登录',
            ok: () => modalStore.openLogin(),
          });
          return false;
        }
        if (isMobile && !isWeChat) {
          const { url } = await Api.getAutoLoginUrl();
          if (url) {
            Api.deleteAutoLoginUrl();
            window.location.href = url;
          }
        }
      }
      userStore.setIsFetched(true);
      return true;
    };

    const fetchPermission = async () => {
      try {
        await authApi.checkPermission();
        userStore.setCanPublish();
      } catch (err) {
        console.log(err);
      }
    };

    (async () => {
      const settings = await fetchSettings();
      const passed = await fetchUser(settings);
      if (passed) {
        preloadStore.done();
      }
      await sleep(200);
    })();
  }, [userStore, preloadStore, socketStore, settingsStore, modalStore, confirmDialogStore, props]);

  if (userStore.shouldLogin) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <span onClick={() => modalStore.openLogin()} className="text-blue-400 text-lg">
            阅读文章之前请登录一下哦
          </span>
        </div>
      </div>
    );
  }

  return null;
});
