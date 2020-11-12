import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog, Tab, Tabs } from '@material-ui/core';
import { useStore } from 'store';
import Button from 'components/Button';
import classNames from 'classnames';
import TopicEditorModal from 'components/TopicEditorModal';
import postApi, { IPost } from 'apis/post';
import topicApi, { ITopic } from 'apis/topic';
import Loading from 'components/Loading';
import { sleep, isMobile } from 'utils';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import Img from 'components/Img';
import Tooltip from '@material-ui/core/Tooltip';

const LIMIT = 20;

interface IProps {
  type: string;
  post: IPost;
  isMyTopicsList?: boolean;
}

const TopicLists = observer((props: IProps) => {
  const { userStore, snackbarStore } = useStore();
  const { post, isMyTopicsList } = props;
  const state = useLocalStore(() => ({
    hasMore: false,
    topics: [] as ITopic[],
    total: 0,
    page: 0,
    isFetching: false,
    isFetched: false,
    includedTopicUuidMap: {} as any,
    pendingTopicUuidMap: {} as any,
    showTopicEditorModal: false,
  }));

  React.useEffect(() => {
    if (post && post.topics) {
      for (const topic of post.topics) {
        state.includedTopicUuidMap[topic.uuid] = true;
      }
    }
    if (post && post.pendingTopicUuids) {
      for (const uuid of post.pendingTopicUuids) {
        state.pendingTopicUuidMap[uuid] = true;
      }
    }
  }, [post, state]);

  React.useEffect(() => {
    (async () => {
      state.isFetching = true;
      try {
        const apiAction =
          props.type === 'myTopics'
            ? topicApi.fetchTopicsByUserAddress(userStore.user.address, {
                offset: state.page * LIMIT,
                limit: LIMIT,
              })
            : topicApi.fetchPublicTopics({
                offset: state.page * LIMIT,
                limit: LIMIT,
              });
        const { total, topics } = await apiAction;
        state.topics.push(...(topics as ITopic[]));
        state.total = total as number;
        state.hasMore = topics.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [state, state.page, props.type, userStore.user.address]);

  const infiniteRef: any = useInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    scrollContainer: 'parent',
    threshold: 80,
    onLoadMore: () => {
      state.page = state.page + 1;
    },
  });

  const addContribution = async (topic: ITopic, post: IPost) => {
    try {
      await topicApi.addContribution(topic.uuid, post.rId);
      state.includedTopicUuidMap[topic.uuid] = true;
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '粘贴已经被作者删除了',
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

  if (!state.isFetched) {
    return (
      <div className="pt-24 mt-2">
        <Loading />
      </div>
    );
  }

  return (
    <div className="mt-5 text-left overflow-y-auto box-content topics-container px-2">
      <div className="border rounded-8 border-gray-d8 border-opacity-75 mb-2">
        {state.topics.length === 0 && (
          <div className="py-4 text-center text-gray-70 text-14">
            {isMyTopicsList ? (
              <div>
                你还没有专题，
                <span
                  className="text-blue-400 cursor-pointer"
                  onClick={() => (state.showTopicEditorModal = true)}
                >
                  点击创建一个
                </span>{' '}
              </div>
            ) : (
              '暂无专题'
            )}
          </div>
        )}
        <div className="flex items-start flex-wrap topics-list" ref={infiniteRef}>
          {state.topics.map((topic, index: number) => {
            const isTopicOwner = topic.user && topic.user.id === userStore.user.id;
            return (
              <div
                key={index}
                className={classNames(
                  {
                    'border-r': (index + 1) % 2 !== 0,
                  },
                  'px-4 py-3 flex items-center justify-between border-b border-gray-300 row box-border w-1/2',
                )}
              >
                <a href={`/topics/${topic.uuid}`} rel="noopener noreferrer" target="_blank">
                  <div className="flex items-center mr-2">
                    <div className="w-10 h-10">
                      <Img
                        className="w-10 h-10 rounded"
                        src={topic.cover}
                        resizeWidth={40}
                        alt="."
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-14 text-gray-70 truncate topic-name">{topic.name}</div>
                      {!isMyTopicsList && (
                        <div className="text-12 text-gray-af">
                          {topic.summary.post.count} 文章 · {topic.summary.follower.count} 关注
                        </div>
                      )}
                    </div>
                  </div>
                </a>
                {!isTopicOwner && topic.reviewEnabled && !state.includedTopicUuidMap[topic.uuid] && (
                  <div>
                    {!state.pendingTopicUuidMap[topic.uuid] && (
                      <Button size="mini" onClick={() => addContributionRequest(topic, post)}>
                        投稿
                      </Button>
                    )}
                    {state.pendingTopicUuidMap[topic.uuid] && (
                      <Tooltip
                        disableHoverListener={isMobile}
                        placement="top"
                        title="专题创建者将会审核你的投稿，一旦有了审核结果，你将收到通知提醒"
                        arrow
                      >
                        <div>
                          <Button
                            size="mini"
                            color="gray"
                            onClick={() => removeContributionRequest(topic, post)}
                          >
                            待审核
                          </Button>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                )}
                {(isTopicOwner || !topic.reviewEnabled) && !state.includedTopicUuidMap[topic.uuid] && (
                  <Button size="mini" onClick={() => addContribution(topic, post)}>
                    {isTopicOwner ? '收录' : '投稿'}
                  </Button>
                )}
                {state.includedTopicUuidMap[topic.uuid] && (
                  <Button
                    size="mini"
                    color="gray"
                    outline
                    onClick={() => removeContribution(topic, post)}
                  >
                    已投稿
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {state.isFetched && state.hasMore && (
        <div className="py-8 flex items-center justify-center">
          <Loading />
        </div>
      )}
      {isMyTopicsList && state.topics.length > 0 && (
        <div className="flex py-4 justify-center">
          <Button
            outline
            size="small"
            onClick={() => (state.showTopicEditorModal = true)}
            className="text-blue-400 text-13 mt-1 cursor-pointer mr-12 md:mr-0"
          >
            新建专题
          </Button>
        </div>
      )}
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

const Contribution = observer(() => {
  const { modalStore } = useStore();
  const {
    data: { file },
  } = modalStore.contribution;
  const state = useLocalStore(() => ({
    tab: 'myTopics',
    post: {} as IPost,
    isFetchingPost: false,
  }));

  React.useEffect(() => {
    (async () => {
      state.isFetchingPost = true;
      try {
        const post = await postApi.fetchPost(file.rId, {
          dropContent: true,
          withPendingTopicUuids: true,
        });
        state.post = post;
      } catch (err) {
        console.log(err);
      }
      state.isFetchingPost = false;
    })();
  }, [state, file.rId]);

  return (
    <div className="pt-4 px-8 pb-8 bg-white rounded-12 text-center relative contribution-modal">
      <div className="mt-6 text-gray-700 title mb-5">
        <div className="content">
          {state.isFetchingPost && (
            <div className="pt-48">
              <Loading />
            </div>
          )}
          {!state.isFetchingPost && (
            <div className="pb-4">
              <div className="font-bold flex justify-center text-18">
                投稿《<div className="truncate post-title">{state.post.title}</div>》
              </div>
              <div>
                <div className="flex justify-center mt-2">
                  <Tabs
                    value={state.tab}
                    onChange={(_e, tab) => {
                      state.tab = tab;
                    }}
                  >
                    <Tab value="myTopics" className="form-tab" label="我的专题" />
                    <Tab value="publicTopics" className="form-tab" label="开放投稿的专题" />
                  </Tabs>
                </div>
                <div className="flex justify-center">
                  {state.tab === 'myTopics' && (
                    <TopicLists type="myTopics" post={state.post} isMyTopicsList />
                  )}
                  {state.tab === 'publicTopics' && (
                    <TopicLists type="publicTopics" post={state.post} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {!state.isFetchingPost && (
        <div className="absolute bottom-0 left-0 w-full flex items-center justify-center mb-3 pt-3 border-t border-gray-200">
          <Button size="small" onClick={() => modalStore.closeContribution()}>
            完成
          </Button>
        </div>
      )}
      <style jsx global>{`
        .contribution-modal .content {
          height: 487px;
          width: 640px;
        }
        .contribution-modal .post-title {
          max-width: 400px;
        }
        .contribution-modal .topics-container {
          height: 365px;
          width: 592px;
        }
        .contribution-modal .topics-list {
          width: 592px;
        }
        .contribution-modal .topic-name {
          width: 142px;
        }
      `}</style>
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.contribution;

  return (
    <Dialog
      open={open}
      onClose={() => modalStore.closeContribution()}
      transitionDuration={{
        enter: 300,
      }}
      maxWidth="md"
    >
      <Contribution />
    </Dialog>
  );
});
