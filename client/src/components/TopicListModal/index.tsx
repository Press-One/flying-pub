import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog } from '@material-ui/core';
import { useStore } from 'store';
import Button from 'components/Button';
import TopicEditorModal from 'components/TopicEditorModal';
import Loading from 'components/Loading';
import postApi, { IPost } from 'apis/post';
import topicApi, { ITopic } from 'apis/topic';
import { sleep, isMobile } from 'utils';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import DrawerModal from 'components/DrawerModal';
import ModalLink from 'components/ModalLink';
import Img from 'components/Img';
import classNames from 'classnames';
import SearchInput from 'components/SearchInput';

const LIMIT = 15;

const TopicList = observer(() => {
  const state = useLocalStore(() => ({
    get hasTopics() {
      return this.topics.length > 0;
    },
    hasMore: false,
    page: 0,
    total: 0,
    topics: [] as ITopic[],
    showTopicEditorModal: false,
    isFetching: true,
    isFetched: false,
    includedTopicUuidMap: {} as any,
    pendingTopicUuidMap: {} as any,
    keyword: '',
    searchKeyword: '',
  }));
  const { modalStore, userStore, snackbarStore } = useStore();
  const { data } = modalStore.topicList;
  const post = data.post as IPost;
  const isCreatedTopics = data.type === 'CREATED_TOPICS';
  const isFollowingTopics = data.type === 'FOLLOWING_TOPICS';
  const isContributionToMyTopics = data.type === 'CONTRIBUTION_TO_MY_TOPICS';
  const isContributedTopics = data.type === 'CONTRIBUTED_TOPICS';
  const isContributionToPublicTopics = data.type === 'CONTRIBUTION_TO_PUBLIC_TOPICS';
  const isMyself = userStore.isLogin && userStore.user.address === data.userAddress;
  const loading = React.useMemo(() => state.total === 0 && state.isFetching, [
    state.total,
    state.isFetching,
  ]);

  React.useEffect(() => {
    (async () => {
      state.isFetching = true;
      let res = {
        total: 0,
        topics: [],
      };
      try {
        if (isCreatedTopics || isContributionToMyTopics) {
          res = await topicApi.fetchTopicsByUserAddress(data.userAddress as string, {
            offset: state.page * LIMIT,
            limit: LIMIT,
          });
        } else if (isContributedTopics) {
          res = await postApi.fetchPostTopics(post.rId, {
            offset: state.page * LIMIT,
            limit: LIMIT,
          });
        } else if (isFollowingTopics) {
          res = await topicApi.fetchFollowingTopicsByUserAddress(data.userAddress as string, {
            offset: state.page * LIMIT,
            limit: LIMIT,
          });
        } else if (isContributionToPublicTopics) {
          res = await topicApi.fetchPublicTopics({
            offset: state.page * LIMIT,
            limit: LIMIT,
            keyword: state.searchKeyword,
          });
        }
        state.topics.push(...(res.topics as ITopic[]));
        state.total = res.total as number;
        state.hasMore = res.topics.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [
    state,
    data,
    post,
    state.page,
    state.searchKeyword,
    isCreatedTopics,
    isContributionToMyTopics,
    isContributedTopics,
    isFollowingTopics,
    isContributionToPublicTopics,
  ]);

  React.useEffect(() => {
    state.topics = [];
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

  React.useEffect(() => {
    if (post) {
      for (const topic of post.topics) {
        state.includedTopicUuidMap[topic.uuid] = true;
      }
      if (post.pendingTopicUuids) {
        for (const uuid of post.pendingTopicUuids) {
          state.pendingTopicUuidMap[uuid] = true;
        }
      }
    }
  }, [post, state]);

  const addContribution = async (topic: ITopic, post: IPost) => {
    try {
      await topicApi.addContribution(topic.uuid, post.rId);
      state.includedTopicUuidMap[topic.uuid] = true;
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '文章已经被作者删除了',
          type: 'error',
        });
      }
      console.log(err);
    }
  };

  const removeContribution = async (topic: ITopic, post: IPost) => {
    try {
      await topicApi.removeContribution(topic.uuid, post.rId);
      state.includedTopicUuidMap[topic.uuid] = false;
    } catch (err) {
      console.log(err);
    }
  };

  const addContributionRequest = async (topic: ITopic, post: IPost) => {
    try {
      await topicApi.addContributionRequest(topic.uuid, post.rId);
      state.pendingTopicUuidMap[topic.uuid] = true;
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '文章已经被作者删除了',
          type: 'error',
        });
      }
      console.log(err);
    }
  };

  const removeContributionRequest = async (topic: ITopic, post: IPost) => {
    try {
      await topicApi.removeContributionRequest(topic.uuid, post.rId);
      state.pendingTopicUuidMap[topic.uuid] = false;
    } catch (err) {
      console.log(err);
    }
  };

  const subscribe = async (topic: ITopic) => {
    try {
      await topicApi.subscribe(topic.uuid);
      topic.following = true;
      topic.summary.follower!.count += 1;
    } catch (err) {
      console.log(err);
    }
  };

  const unsubscribe = async (topic: ITopic) => {
    try {
      await topicApi.unsubscribe(topic.uuid);
      topic.following = false;
      topic.summary.follower!.count -= 1;
    } catch (err) {
      console.log(err);
    }
  };

  const search = (value: string) => {
    if (value === state.searchKeyword) {
      return;
    }
    state.isFetched = false;
    state.page = 0;
    state.topics = [];
    state.total = 0;
    state.searchKeyword = value;
  };

  return (
    <div className="bg-white rounded-12 text-gray-4a">
      <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 text-gray-4a flex justify-between items-center">
        {data.title}
        {(isCreatedTopics || isContributionToMyTopics) && isMyself && state.hasTopics && (
          <span
            onClick={() => (state.showTopicEditorModal = true)}
            className="text-blue-400 text-13 mt-1 cursor-pointer mr-12 md:mr-0"
          >
            +新建专题
          </span>
        )}
      </div>
      <div
        ref={infiniteRef}
        className={classNames(
          {
            'h-80-vh': isContributionToPublicTopics,
          },
          'w-full md:w-400-px h-60-vh md:h-400-px overflow-y-auto',
        )}
      >
        {state.isFetched && isContributionToPublicTopics && (
          <div className="mt-3 -mb-2 pb-9-px flex justify-center">
            <SearchInput className="w-64" placeholder="搜索专题" size="small" search={search} />
          </div>
        )}
        {loading && (
          <div className="pt-24 flex items-center justify-center">
            <Loading />
          </div>
        )}
        {!loading && (
          <div>
            {(isCreatedTopics || isContributionToMyTopics || isContributionToPublicTopics) &&
              state.isFetched &&
              !state.hasTopics && (
                <div className="py-20 text-center text-gray-500 text-14">
                  {!state.searchKeyword && isMyself ? (
                    <div>
                      你还没有专题，
                      <span
                        className="text-blue-400 cursor-pointer"
                        onClick={() => (state.showTopicEditorModal = true)}
                      >
                        点击创建一个
                      </span>{' '}
                    </div>
                  ) : state.searchKeyword ? (
                    '没有搜索到相关的专题'
                  ) : (
                    '暂无专题'
                  )}
                </div>
              )}
            {state.topics.map((topic) => (
              <div
                className="px-5 py-4 flex items-center justify-between border-gray-300 border-b"
                key={topic.uuid}
              >
                <ModalLink to={`/topics/${topic.uuid}`} onClick={() => modalStore.closeTopicList()}>
                  <div className="flex items-center">
                    <Img className="w-10 h-10 rounded" src={topic.cover} resizeWidth={40} alt="." />
                    <div className="ml-3">
                      <div className="text-14 text-gray-70 truncate w-48 md:w-56">{topic.name}</div>
                      {(Number(topic.summary.post.count) > 0 ||
                        Number(topic.summary.follower.count) > 0) && (
                        <div className="text-12 text-gray-af">
                          {topic.summary.post.count ? `${topic.summary.post.count} 篇文章` : ''}
                          {topic.summary.post.count > 0 && topic.summary.follower.count > 0 && (
                            <span> · </span>
                          )}
                          {topic.summary.follower.count
                            ? `${topic.summary.follower.count} 人关注`
                            : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </ModalLink>
                {(isContributedTopics || isFollowingTopics || isCreatedTopics) && (
                  <div>
                    {topic.following ? (
                      <Button size="small" onClick={() => unsubscribe(topic)} outline>
                        已关注
                      </Button>
                    ) : (
                      <Button size="small" onClick={() => subscribe(topic)}>
                        关注
                      </Button>
                    )}
                  </div>
                )}
                {isContributionToMyTopics &&
                  (state.includedTopicUuidMap[topic.uuid] ? (
                    <Button
                      size="small"
                      outline
                      color="gray"
                      onClick={() => removeContribution(topic, post)}
                    >
                      已收录
                    </Button>
                  ) : (
                    <Button size="small" onClick={() => addContribution(topic, post)}>
                      收录
                    </Button>
                  ))}
                {isContributionToPublicTopics && (
                  <div>
                    {topic.reviewEnabled && !state.includedTopicUuidMap[topic.uuid] && (
                      <div>
                        {!state.pendingTopicUuidMap[topic.uuid] && (
                          <Button size="small" onClick={() => addContributionRequest(topic, post)}>
                            投稿
                          </Button>
                        )}
                        {state.pendingTopicUuidMap[topic.uuid] && (
                          <div>
                            <Button
                              size="small"
                              color="gray"
                              onClick={() => removeContributionRequest(topic, post)}
                            >
                              待审核
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    {!topic.reviewEnabled && !state.includedTopicUuidMap[topic.uuid] && (
                      <Button size="small" onClick={() => addContribution(topic, post)}>
                        投稿
                      </Button>
                    )}
                    {state.includedTopicUuidMap[topic.uuid] && (
                      <Button
                        size="small"
                        color="gray"
                        outline
                        onClick={() => removeContribution(topic, post)}
                      >
                        已投稿
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {state.hasMore && (
              <div className="py-8 flex items-center justify-center">
                <Loading />
              </div>
            )}
          </div>
        )}
      </div>
      <TopicEditorModal
        open={state.showTopicEditorModal}
        close={() => (state.showTopicEditorModal = false)}
        onChange={async (topic) => {
          if (topic) {
            state.topics.unshift(topic);
            await sleep(400);
            snackbarStore.show({
              message: '专题已创建',
            });
          }
        }}
      />
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.topicList;

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={() => modalStore.closeTopicList()}>
        <TopicList />
      </DrawerModal>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={() => modalStore.closeTopicList()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <TopicList />
    </Dialog>
  );
});
