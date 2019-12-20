import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Loading from 'components/Loading';
import ConfirmDialog from 'components/ConfirmDialog';
import { getXmlUrl, sleep, isMobile, isWeChat } from 'utils';
import Api from 'api';

export default observer((props: any) => {
  const {
    userStore,
    feedStore,
    socketStore,
    subscriptionStore,
    modalStore,
    settingsStore,
  } = useStore();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  React.useEffect(() => {
    const tryFetchFeed = async () => {
      const rssUrl = `${getXmlUrl()}`;
      feedStore.setRssUrl(rssUrl);
      try {
        const decodedRssUrl = decodeURIComponent(rssUrl);
        const feed = await Api.fetchFeed(decodedRssUrl);
        feedStore.setFeed(feed);
      } catch (err) {
        feedStore.setFeed({
          items: [],
        });
        if (err.status === 401) {
          setShowConfirmDialog(true);
        }
      }
    };

    const tryFetchSettings = async () => {
      try {
        const settings = await Api.fetchSettings();
        settingsStore.setSettings(settings);
        const order = settings['filter.order'];
        const hotDisabled = !settings['filter.hot.enabled'];
        if (hotDisabled) {
          const validOrder = order === 'HOT' ? 'PUB_DATE' : order;
          feedStore.setFilter({
            order: validOrder,
          });
        } else {
          const hotDiffDays = settings['filter.hot.diffDays'];
          const diffDaysOptions = settings['filter.hot.diffDaysOptions'];
          const isValidDiffDays = hotDiffDays && diffDaysOptions.includes(hotDiffDays);
          feedStore.setFilter({
            order,
            hotDiffDays: isValidDiffDays ? hotDiffDays : diffDaysOptions[0],
          });
        }
        document.title = `${settings['site.title']} - 飞帖`;
      } catch (err) {}
    };

    const tryFetchPosts = async () => {
      try {
        const { posts } = await Api.fetchPosts();
        feedStore.setPostExtraMap(posts);
      } catch (err) {}
    };

    const tryFetchBlockMap = async () => {
      try {
        const blockMap = await Api.fetchBlockMap();
        feedStore.setBlockMap(blockMap);
      } catch (err) {}
    };

    const tryFetchSubscriptions = async () => {
      try {
        const subscriptions = await Api.fetchSubscriptions();
        const authors = subscriptions.map((subscription: any) => subscription.author);
        subscriptionStore.setAuthors(authors);
        feedStore.setAuthors(authors);
      } catch (err) {}
    };

    (async () => {
      if (feedStore.isFetched) {
        return;
      }
      await Promise.all([tryFetchFeed(), tryFetchSettings(), tryFetchPosts(), tryFetchBlockMap()]);
      tryFetchSubscriptions();
      await sleep(200);
      feedStore.setIsFetchedFeed(true);
      try {
        const user = await Api.fetchUser();
        userStore.setUser(user);
        socketStore.init(user.id);
      } catch (err) {
        if (isMobile && !isWeChat) {
          const { url } = await Api.getAutoLoginUrl();
          if (url) {
            Api.deleteAutoLoginUrl();
            window.location.href = url;
          }
        }
        console.log(err);
      }
      userStore.setIsFetched(true);
      try {
        const { posts } = await Api.fetchPosts();
        feedStore.setPostExtraMap(posts);
      } catch (err) {
        console.log(err);
      }
    })();
  }, [userStore, feedStore, subscriptionStore, socketStore, settingsStore, props]);

  if (!feedStore.isFetched) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

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
