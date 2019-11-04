import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Api from './api';
import Loading from 'components/Loading';
import ConfirmDialog from 'components/ConfirmDialog';
import { getXmlUrl, sleep } from 'utils';

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
        console.log(err);
        feedStore.setFeed({
          items: [],
        });
        setShowConfirmDialog(true);
        // #TODO: 检查权限
      }
      await sleep(800);
      feedStore.setIsFetched(true);
      try {
        const user = await Api.fetchUser();
        userStore.setUser(user);
        socketStore.init(user.id);
      } catch (err) {
        console.log(err);
      }
      userStore.setIsFetched(true);
    })();
  }, [userStore, feedStore, socketStore, props]);

  if (!feedStore.isFetched) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-64">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div>
      <ConfirmDialog
        content="阅读文章之前要先登陆一下哦"
        open={showConfirmDialog}
        okText="前往登陆"
        cancel={() => {}}
        ok={modalStore.openLogin}
      />
    </div>
  );
});
