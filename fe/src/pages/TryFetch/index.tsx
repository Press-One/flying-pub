import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Api from './api';
import Loading from 'components/Loading';
import ConfirmDialog from 'components/ConfirmDialog';

import { getXmlUrl } from 'utils';

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
      }
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
    return <Loading isPage={true} />;
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
