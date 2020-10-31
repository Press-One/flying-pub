import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog } from '@material-ui/core';
import Button from 'components/Button';
import postApi, { IPost } from 'apis/post';
import topicApi from 'apis/topic';
import { useStore } from 'store';
import Loading from 'components/Loading';
import { isMobile } from 'utils';
import DrawerModal from 'components/DrawerModal';
import ModalLink from 'components/ModalLink';

interface IProps {
  open: boolean;
  close: () => void;
  topicUuid: string;
  isMyself: boolean;
}

const POSTS_LIMIT = 20;

const TopicContribution = observer((props: IProps) => {
  const { userStore, settingsStore } = useStore();
  const { settings } = settingsStore;
  const { isMyself, topicUuid } = props;
  const state = useLocalStore(() => ({
    isFetching: false,
    isFetched: false,
    total: 0,
    posts: [] as IPost[],
    includedRIdMap: {} as any,
  }));
  const loading = React.useMemo(() => !state.isFetched, [state.isFetched]);

  React.useEffect(() => {
    (async () => {
      state.isFetching = true;
      try {
        const res = await postApi.fetchPosts({
          address: userStore.user.address,
          offset: 0,
          limit: POSTS_LIMIT,
        });
        state.total = res.total;
        state.posts = res.posts;
        for (const post of res.posts) {
          state.includedRIdMap[post.rId] = (post as IPost).topics
            .map((topic) => topic.uuid)
            .includes(topicUuid);
        }
      } catch (err) {}
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [state, userStore.user.address, topicUuid]);

  const addContribution = async (post: IPost) => {
    try {
      await topicApi.addContribution(topicUuid, post.rId);
      state.includedRIdMap[post.rId] = true;
    } catch (err) {}
  };

  const removeContribution = async (post: IPost) => {
    try {
      await topicApi.removeContribution(topicUuid, post.rId);
      state.includedRIdMap[post.rId] = false;
    } catch (err) {}
  };

  return (
    <div className="bg-white rounded-12 text-gray-4a">
      <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 text-gray-4a flex justify-between items-center">
        选择要{isMyself ? '收录' : '投稿'}的文章
      </div>
      <div className="w-full md:w-100 h-80-vh md:h-90 overflow-auto content">
        {state.isFetched && state.posts.length === 0 && (
          <div className="py-20 text-center text-gray-af">
            你还没有文章可以{isMyself ? '收录' : '投稿'}{' '}
            {!isMobile && (
              <span>
                ，
                <ModalLink
                  to={`/dashboard`}
                  className="text-blue-400"
                  onClick={() => props.close()}
                >
                  去写文章
                </ModalLink>
              </span>
            )}
            {isMobile && (
              <div className="mt-2">用电脑打开{settings['site.name']}，写一篇文章吧~</div>
            )}
          </div>
        )}
        {loading && (
          <div className="pt-24 flex items-center justify-center">
            <Loading />
          </div>
        )}
        {!loading &&
          state.posts.map((post) => (
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-300">
              <div className="truncate w-56 mr-4 text-14 font-bold">{post.title}</div>
              {!state.includedRIdMap[post.rId] && (
                <Button size="small" onClick={() => addContribution(post)}>
                  {isMyself ? '收录' : '投稿'}
                </Button>
              )}
              {state.includedRIdMap[post.rId] && (
                <Button size="small" color="red" outline onClick={() => removeContribution(post)}>
                  移除
                </Button>
              )}
            </div>
          ))}
      </div>
      <style jsx>{`
        .content {
          max-height: 480px;
        }
      `}</style>
    </div>
  );
});

export default observer((props: IProps) => {
  const { open } = props;

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={() => props.close()}>
        <TopicContribution {...props} />
      </DrawerModal>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={() => props.close()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <TopicContribution {...props} />
    </Dialog>
  );
});
