import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import ConfirmDialog from 'components/ConfirmDialog';
import { sleep, isMobile, isWeChat, getQuery, removeQuery } from 'utils';
import Api from 'api';

export default observer((props: any) => {
  const { preloadStore, userStore, feedStore, socketStore, modalStore, settingsStore } = useStore();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  React.useEffect(() => {
    const { ready } = preloadStore;
    if (ready) {
      return;
    }

    const initFilter = (settings: any) => {
      const type = settings['filter.type'];
      const popularityDisabled = !settings['filter.popularity.enabled'];
      if (popularityDisabled) {
        const validType = type === 'POPULARITY' ? 'PUB_DATE' : type;
        settings['filter.type'] = validType;
        feedStore.setFilter({
          type: validType,
        });
      } else {
        const filter: any = { type };
        if (type === 'POPULARITY') {
          const dayRange = settings['filter.dayRange'];
          const dayRangeOptions = settings['filter.dayRangeOptions'];
          const isValidDayRange = dayRange && dayRangeOptions.includes(dayRange);
          const validDayRange = isValidDayRange ? dayRange : dayRangeOptions[0];
          settings['filter.dayRange'] = validDayRange;
          filter.dayRange = validDayRange;
        }
        feedStore.setFilter(filter);
      }
    };

    const fetchSettings = async () => {
      const settings = await Api.fetchSettings();
      settingsStore.setSettings(settings);
      const filterEnabled = settings['filter.enabled'];
      if (filterEnabled) {
        initFilter(settings);
      }
      return settings;
    };

    const fetchUser = async (settings: any) => {
      try {
        const user = await Api.fetchUser();
        userStore.setUser(user);
        socketStore.init(user.id);
      } catch (err) {
        if (settings['permission.isPrivate']) {
          setShowConfirmDialog(true);
          return false;
        } else if (getQuery('action') === 'login') {
          await sleep(500);
          modalStore.openLogin();
          removeQuery('action');
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

    (async () => {
      const settings = await fetchSettings();
      const passed = await fetchUser(settings);
      if (passed) {
        preloadStore.done();
      }
      await sleep(200);
    })();
  }, [userStore, feedStore, preloadStore, socketStore, settingsStore, props]);

  return (
    <div>
      <ConfirmDialog
        content="阅读文章之前要先登录一下哦"
        open={showConfirmDialog}
        okText="前往登录"
        cancel={() => {}}
        ok={modalStore.openLogin}
      />
    </div>
  );
});
