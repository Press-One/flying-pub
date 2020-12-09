import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import DrawerModal from 'components/DrawerModal';
import { sleep, isMobile } from 'utils';
import Loading from 'components/Loading';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import Posts from 'components/Posts';
import postApi, { IPost } from 'apis/post';
import { useStore } from 'store';
import { Dialog } from '@material-ui/core';

const Favorites = observer((props: any) => {
  const { confirmDialogStore, snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    get hasPosts() {
      return this.posts.length > 0;
    },
    hasMore: false,
    page: 0,
    total: 0,
    posts: [] as IPost[],
    isFetching: false,
    isFetched: false,
  }));
  const LIMIT = 10;

  const fetchPosts = React.useCallback(() => {
    (async () => {
      if (state.isFetching) {
        return;
      }
      state.isFetching = true;
      try {
        const res = await postApi.fetchFavorites({
          offset: state.page * LIMIT,
          limit: LIMIT,
        });
        state.posts.push(...(res.posts as IPost[]));
        state.total = res.total as number;
        state.hasMore = res.posts.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [state]);

  const refreshPosts = () => {
    state.page = 0;
    state.isFetched = false;
    state.posts = [];
    fetchPosts();
  };

  React.useEffect(() => {
    fetchPosts();
  }, [state, state.page, fetchPosts]);

  const infiniteRef: any = useInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    scrollContainer: 'parent',
    threshold: 80,
    onLoadMore: () => {
      state.page = state.page + 1;
    },
  });

  const onClickFavorite = (post: IPost) => {
    confirmDialogStore.show({
      content: '不再收藏这篇文章？',
      ok: async () => {
        try {
          await postApi.unfavorite(post.rId);
          confirmDialogStore.hide();
          await sleep(300);
          snackbarStore.show({
            message: '已取消收藏',
            duration: 1000,
          });
          refreshPosts();
        } catch (err) {
          snackbarStore.show({
            message: '取消收藏失败',
            type: 'error',
          });
        }
      },
    });
  };

  return (
    <div className="bg-white rounded-12 text-gray-4a">
      <div className="font-bold items-center text-16 text-center border-b border-gray-200 py-3">
        收藏夹
      </div>
      <div className="pb-8 box-border h-80-vh md:h-500-px md:w-400-px overflow-y-auto">
        <div ref={infiniteRef}>
          {!state.isFetched && (
            <div className="pt-24 flex items-center justify-center">
              <Loading />
            </div>
          )}
          {state.isFetched && !state.hasPosts && (
            <div className="py-20 text-center text-gray-500 text-14">空空如也 ~</div>
          )}
          {state.isFetched && (
            <Posts
              posts={state.posts}
              authorPageEnabled
              hideTopics
              isMobileMode
              showFavorite
              onCloseModal={() => {
                props.close();
              }}
              onClickFavorite={onClickFavorite}
            />
          )}
          {state.isFetched && state.isFetching && (
            <div className="pt-8">
              <Loading />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();

  if (isMobile) {
    return (
      <DrawerModal open={modalStore.favorites.open} onClose={modalStore.closeFavorites}>
        <Favorites close={modalStore.closeFavorites} />
      </DrawerModal>
    );
  }

  return (
    <Dialog
      open={modalStore.favorites.open}
      onClose={modalStore.closeFavorites}
      transitionDuration={{
        enter: 300,
      }}
    >
      <Favorites close={modalStore.closeFavorites} />
    </Dialog>
  );
});
