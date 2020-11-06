import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog } from '@material-ui/core';
import { useStore } from 'store';
import Button from 'components/Button';
import Loading from 'components/Loading';
import subscriptionApi from 'apis/subscription';
import topicApi from 'apis/topic';
import { IAuthor } from 'apis/author';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { isMobile } from 'utils';
import DrawerModal from 'components/DrawerModal';
import ModalLink from 'components/ModalLink';
import Img from 'components/Img';

const LIMIT = 15;

const UserList = observer(() => {
  const { modalStore, userStore } = useStore();
  const { data } = modalStore.userList;
  const state = useLocalStore(() => ({
    hasMore: false,
    page: 0,
    isFetching: false,
    submitting: false,
    total: 0,
    authors: [] as IAuthor[],
  }));
  const loading = React.useMemo(() => state.total === 0 && state.isFetching, [
    state.total,
    state.isFetching,
  ]);

  React.useEffect(() => {
    (async () => {
      state.isFetching = true;
      let res = {
        total: 0,
        authors: [],
      };
      try {
        if (data.type === 'FOLLOWING_USERS') {
          res = await subscriptionApi.fetchFollowing(data.authorAddress, {
            offset: state.page * LIMIT,
            limit: LIMIT,
          });
        } else if (data.type === 'USER_FOLLOWERS') {
          res = await subscriptionApi.fetchFollowers(data.authorAddress, {
            offset: state.page * LIMIT,
            limit: LIMIT,
          });
        } else if (data.type === 'TOPIC_FOLLOWERS') {
          res = await topicApi.fetchFollowers(data.topicUuid as string, {
            offset: state.page * LIMIT,
            limit: LIMIT,
          });
        } else if (data.type === 'TOPIC_AUTHORS') {
          res = await topicApi.fetchTopicAuthors(data.topicUuid as string, {
            offset: state.page * LIMIT,
            limit: LIMIT,
          });
        }
      } catch (err) {
        console.log(err);
      }
      state.authors.push(...(res.authors as IAuthor[]));
      state.total = res.total as number;
      state.hasMore = res.authors.length === LIMIT;
      state.isFetching = false;
    })();
  }, [state, data, state.page]);

  React.useEffect(() => {
    state.authors = [];
    state.total = 0;
  }, [data.type, state]);

  const infiniteRef: any = useInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    scrollContainer: 'parent',
    threshold: 80,
    onLoadMore: () => {
      state.page = state.page + 1;
    },
  });

  const subscribe = async (author: IAuthor) => {
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    try {
      await subscriptionApi.subscribe(author.address);
      author.following = true;
    } catch (err) {
      console.log(err);
    }
    state.submitting = false;
  };

  const unsubscribe = async (author: IAuthor) => {
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    try {
      await subscriptionApi.unsubscribe(author.address);
      author.following = false;
    } catch (err) {
      console.log(err);
    }
    state.submitting = false;
  };

  return (
    <div className="bg-white rounded-12 text-gray-4a">
      <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 flex justify-between items-center">
        {data.title}
      </div>
      <div className="w-full md:w-400-px h-80-vh md:h-400-px overflow-y-auto">
        {loading && (
          <div className="pt-24 flex items-center justify-center">
            <Loading />
          </div>
        )}
        {!loading && (
          <div ref={infiniteRef}>
            {state.authors.map((author) => {
              const isMyself = author.address === userStore.user.address;
              return (
                <div
                  className="border-b border-gray-300 py-3 px-4 flex items-center justify-between"
                  key={author.address}
                >
                  <ModalLink
                    to={`/authors/${author.address}`}
                    onClick={() => modalStore.closeUserList()}
                  >
                    <div className="flex items-center cursor-pointer">
                      <Img
                        className="w-10 h-10 rounded-full"
                        src={author.avatar}
                        alt={author.nickname}
                      />
                      <div className="ml-3">
                        <div className="text-14 truncate w-48 md:w-56">{author.nickname}</div>
                        {author.bio && (
                          <div className="truncate w-48 md:w-56 text-12 text-gray-af">
                            {author.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  </ModalLink>
                  {!isMyself && (
                    <div>
                      {author.following ? (
                        <Button size="small" onClick={() => unsubscribe(author)} outline>
                          已关注
                        </Button>
                      ) : (
                        <Button size="small" onClick={() => subscribe(author)}>
                          关注
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && state.hasMore && (
              <div className="py-8 flex items-center justify-center">
                <Loading />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.userList;

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={() => modalStore.closeUserList()}>
        <UserList />
      </DrawerModal>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={() => modalStore.closeUserList()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <UserList />
    </Dialog>
  );
});
