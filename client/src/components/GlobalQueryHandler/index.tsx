import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { getApiEndpoint, getQuery, removeQuery, sleep, isPc } from 'utils';

export default observer(() => {
  const { preloadStore, settingsStore, confirmDialogStore, modalStore, snackbarStore } = useStore();
  const ready = preloadStore.ready;
  const providerNameMap: any = {
    phone: '手机号',
    mixin: ' ' + settingsStore.settings['mixinApp.name'] + ' 账号',
  };

  React.useEffect(() => {
    setTimeout(async () => {
      const { settings } = settingsStore;
      const action = getQuery('action');
      if (action === 'PERMISSION_DENY') {
        removeQuery('action');
        confirmDialogStore.show({
          contentClassName: 'text-left',
          content: settings['permission.denyText'],
          okText: settings['permission.denyActionText'],
          ok: () => {
            if (isPc) {
              window.open(settings['permission.denyActionLink']);
            } else {
              window.location.href = settings['permission.denyActionLink'];
            }
          },
        });
        return;
      }

      if (action === 'LOGIN') {
        await sleep(500);
        modalStore.openLogin();
        removeQuery('action');
      }
    }, 1000);

    if (ready) {
      setTimeout(async () => {
        const action = getQuery('action');
        const provider: any = getQuery('provider') || 'mixin';

        if (action === 'BIND_DUPLICATED') {
          removeQuery('action');
          removeQuery('code');
          removeQuery('message');
          removeQuery('provider');
          confirmDialogStore.show({
            contentClassName: 'text-left',
            content: `你要绑定的${providerNameMap[provider]}已经注册过了，不能再被绑定，如果你想使用该账号，你可以退出当前账号，然后直接使用${providerNameMap[provider]}登录`,
            cancelText: '先不绑定了',
            okText: '重新登录',
            cancel: () => {
              confirmDialogStore.hide();
            },
            ok: () => {
              window.location.href = `${getApiEndpoint()}/api/logout?from=${
                window.location.origin
              }/?action=LOGIN`;
            },
          });
          return;
        }

        if (action === 'BIND_SUCCESS') {
          removeQuery('action');
          confirmDialogStore.show({
            content: `绑定成功`,
            cancelDisabled: true,
            ok: () => {
              confirmDialogStore.hide();
            },
          });
          return;
        }

        if (action === 'OPEN_NOTIFICATION_MODAL') {
          if (getQuery('tab')) {
            modalStore.openNotification({
              tab: Number(getQuery('tab')),
              messageId: Number(getQuery('messageId') || 0),
            });
            removeQuery('action');
            removeQuery('tab');
            removeQuery('messageId');
          }
          return;
        }

        if (action === 'CLEAR_STORAGE') {
          removeQuery('action');
          localStorage.clear();
          return;
        }

        if (action === 'ADD_LOCAL_STORAGE') {
          const key = getQuery('key');
          const value = getQuery('value');
          if (!key) {
            snackbarStore.show({
              message: '请传 key',
              type: 'error',
            });
            return;
          }
          if (!value) {
            snackbarStore.show({
              message: '请传 value',
              type: 'error',
            });
            return;
          }
          localStorage.setItem(key, value);
          removeQuery('action');
          removeQuery('key');
          removeQuery('value');
          return;
        }

        if (action === 'REMOVE_LOCAL_STORAGE') {
          const key = getQuery('key');
          if (!key) {
            snackbarStore.show({
              message: '请传 key',
              type: 'error',
            });
            return;
          }
          localStorage.removeItem(key);
          removeQuery('action');
          removeQuery('key');
          return;
        }
      }, 500);
    }
  }, [ready, confirmDialogStore, providerNameMap, modalStore, settingsStore, snackbarStore]);

  return null;
});
