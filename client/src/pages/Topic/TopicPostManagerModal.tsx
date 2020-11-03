import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Button from 'components/Button';
import { Dialog, TextField } from '@material-ui/core';
import ModalLink from 'components/ModalLink';
import { IPost } from 'apis/post';
import topicApi from 'apis/topic';
import Loading from 'components/Loading';
import { useStore } from 'store';
import { sleep, isMobile, isPc } from 'utils';
import DrawerModal from 'components/DrawerModal';
import useInfiniteScroll from 'react-infinite-scroll-hook';

const LIMIT = 10;

const ConfirmContent = observer(
  (props: { topicUuid: string; post: IPost; afterRemovedContribution: () => void }) => {
    const { userStore } = useStore();
    const state = useLocalStore(() => ({
      isRemoving: false,
      note: '',
    }));
    const isMyself = props.post.author && userStore.user.address === props.post.author.address;

    const removeContribution = async (topicUuid: string, post: IPost, note?: string) => {
      try {
        state.isRemoving = true;
        await topicApi.removeContribution(topicUuid, post.rId, note);
        state.isRemoving = false;
        props.afterRemovedContribution();
      } catch (err) {}
    };

    return (
      <div className="p-8 bg-white rounded-12 text-gray-4a">
        <div className="font-bold items-center text-xl flex justify-center md:justify-start">
          移除文章
        </div>
        <div className={`w-auto ${isMyself ? 'md:w-64' : 'md:w-100'}`}>
          <div className="flex items-start mt-8">
            文章：《<div className="truncate m-w-56">{props.post.title}</div>》
          </div>
          {props.post.author && (
            <div className="mt-3">
              作者：
              <ModalLink
                openInNew={isPc}
                to={`/authors/${props.post.author.address}`}
                className="text-blue-400"
              >
                {props.post.author.nickname}
              </ModalLink>
            </div>
          )}
          {!isMyself && (
            <div className="pt-4 md:w-100">
              <TextField
                className="w-full"
                value={state.note}
                onChange={(e) => {
                  state.note = e.target.value;
                }}
                margin="dense"
                label="告诉 Ta 移除的具体原因"
                rowsMax={6}
                rows={4}
                multiline
                inputProps={{
                  maxLength: 200,
                }}
                variant="outlined"
              />
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-end">
          <Button
            onClick={() => removeContribution(props.topicUuid, props.post, state.note)}
            isDoing={state.isRemoving}
            className="w-full md:w-auto"
          >
            确定
          </Button>
        </div>
      </div>
    );
  },
);

interface IProps {
  open: boolean;
  close: () => void;
  topicUuid: string;
}

const TopicPostManager = observer((props: IProps) => {
  const { topicUuid } = props;
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    hasMore: false,
    isFetching: false,
    isFetched: false,
    total: 0,
    page: 0,
    posts: [] as IPost[],
    post: {} as IPost,
    showConfirmDialog: false,
  }));
  const loading = React.useMemo(() => !state.isFetched, [state.isFetched]);

  const fetchTopicPosts = React.useCallback(() => {
    (async () => {
      state.isFetching = true;
      try {
        const res = await topicApi.fetchTopicPosts(topicUuid, {
          offset: state.page * LIMIT,
          limit: LIMIT,
        });
        state.total = res.total;
        state.posts.push(...res.posts);
        state.hasMore = res.posts.length === LIMIT;
      } catch (err) {}
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [state, topicUuid]);

  const infiniteRef: any = useInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    scrollContainer: 'parent',
    threshold: 80,
    onLoadMore: () => {
      state.page = state.page + 1;
    },
  });

  React.useEffect(() => {
    fetchTopicPosts();
  }, [state, fetchTopicPosts, state.page]);

  const afterRemovedContribution = async () => {
    try {
      state.showConfirmDialog = false;
      state.page = 0;
      state.total = 0;
      state.posts = [];
      fetchTopicPosts();
      await sleep(300);
      snackbarStore.show({
        message: '文章已从专题移除',
      });
    } catch (err) {}
  };

  return (
    <div className="bg-white rounded-12 text-gray-4a">
      <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 text-gray-4a flex justify-between items-center">
        已收录的文章
      </div>
      <div className="w-full md:w-100 h-80-vh md:h-90 overflow-auto content" ref={infiniteRef}>
        {loading && (
          <div className="pt-24 flex items-center justify-center">
            <Loading />
          </div>
        )}
        {!loading &&
          state.posts.map((post) => (
            <div
              className="px-5 py-4 flex items-center justify-between border-b border-gray-300"
              key={post.rId}
            >
              <ModalLink openInNew={isPc} to={`/posts/${post.rId}`}>
                <div className="truncate w-56 mr-4 text-14 font-bold">{post.title}</div>
              </ModalLink>
              <Button
                size="small"
                color="red"
                outline
                onClick={() => {
                  state.post = post;
                  state.showConfirmDialog = true;
                }}
              >
                移除
              </Button>
            </div>
          ))}
        {state.hasMore && (
          <div className="py-8 flex items-center justify-center">
            <Loading />
          </div>
        )}
      </div>

      {isMobile && (
        <DrawerModal
          open={state.showConfirmDialog}
          onClose={() => (state.showConfirmDialog = false)}
        >
          <ConfirmContent
            topicUuid={props.topicUuid}
            post={state.post}
            afterRemovedContribution={afterRemovedContribution}
          />
        </DrawerModal>
      )}

      {!isMobile && (
        <Dialog
          open={state.showConfirmDialog}
          onClose={() => (state.showConfirmDialog = false)}
          transitionDuration={{
            enter: 300,
          }}
        >
          <ConfirmContent
            topicUuid={props.topicUuid}
            post={state.post}
            afterRemovedContribution={afterRemovedContribution}
          />
        </Dialog>
      )}
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
        <TopicPostManager {...props} />
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
      <TopicPostManager {...props} />
    </Dialog>
  );
});
