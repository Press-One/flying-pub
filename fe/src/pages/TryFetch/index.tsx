import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Loading from 'components/Loading';
import ConfirmDialog from 'components/ConfirmDialog';
import { getXmlUrl, sleep, isMobile, isWeChat } from 'utils';
import Api from 'api';

export default observer((props: any) => {
  const { userStore, feedStore, socketStore, modalStore } = useStore();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (feedStore.isFetched) {
        return;
      }
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
      await sleep(800);
      feedStore.setIsFetched(true);
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
  }, [userStore, feedStore, socketStore, props]);

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
