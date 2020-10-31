import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import Tooltip from '@material-ui/core/Tooltip';
import { useStore } from 'store';
import Button from 'components/Button';
import Posts from 'components/Posts';
import Loading from 'components/Loading';
import FolderGrid from 'components/FolderGrid';
import Filter from 'components/PostsFilter';
import subscriptionApi from 'apis/subscription';
import authorApi from 'apis/author';
import { isMobile, isPc, getDefaultAvatar, sleep } from 'utils';
import { IAuthor } from 'apis/author';
import { FilterType } from 'apis/post';
import TopicEditorModal from 'components/TopicEditorModal';
import postApi from 'apis/post';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';
import { Edit } from '@material-ui/icons';
import { toJS } from 'mobx';
import { resizeImage, resizeFullImage } from 'utils';

const DEFAULT_BG_GRADIENT =
  'https://static-assets.xue.cn/images/8aa7ea2a80a7330f96f8d3b6990a6d114487a35559080baec4a176a6640133df';

export default observer((props: any) => {
  const {
    subscriptionStore,
    modalStore,
    userStore,
    snackbarStore,
    preloadStore,
    feedStore,
  } = useStore();
  const state = useLocalStore(() => ({
    isFetchingAuthor: false,
    isFetchedAuthor: false,
    author: {} as IAuthor,
    showTopicEditorModal: false,
    loadingOthers: false,
    showPosts: false,
  }));
  const loading = React.useMemo(() => state.isFetchingAuthor || !preloadStore.ready, [
    state.isFetchingAuthor,
    preloadStore.ready,
  ]);
  const { isLogin, user } = userStore;
  const { address } = props.match.params;
  const isMyself = isLogin && userStore.user.address === address;
  const thatName = isMyself ? '我' : 'TA';
  const isDefaultAvatar = state.author.avatar === getDefaultAvatar();
  const tabs = [
    {
      type: 'POPULARITY',
      name: '热门',
    },
    {
      type: 'PUB_DATE',
      name: '最新',
    },
  ];
  if (isMobile) {
    tabs.push({
      type: 'OTHERS',
      name: '动态',
    });
  }

  React.useEffect(() => {
    if (feedStore.provider !== `author:${address}`) {
      feedStore.setProvider(`author:${address}`);
      feedStore.clear();
      feedStore.setFilterType(tabs[0].type);
      window.scrollTo(0, 0);
    }
  }, [feedStore, address, tabs]);

  React.useEffect(() => {
    if (state.isFetchedAuthor) {
      (async () => {
        await sleep(500);
        state.showPosts = true;
      })();
    }
  }, [state.isFetchedAuthor, state]);

  React.useEffect(() => {
    if (!feedStore.isNew && !feedStore.willLoadingPage) {
      if (feedStore.belongedAuthor && feedStore.belongedAuthor.address === address) {
        state.author = feedStore.belongedAuthor;
        state.isFetchedAuthor = true;
        return;
      }
    }

    (async () => {
      state.isFetchingAuthor = true;
      try {
        const author = await authorApi.fetchAuthor(address, {
          withSummary: true,
          summaryPreviewCount: 3,
        });
        state.author = author;
        document.title = state.author.nickname;
      } catch (err) {
        console.log(err);
      }
      state.isFetchingAuthor = false;
      state.isFetchedAuthor = true;
    })();
  }, [state, address, feedStore]);

  React.useEffect(() => {
    if (!feedStore.filterType) {
      return;
    }
    if (feedStore.isFetching) {
      return;
    }
    if (!feedStore.isNew && !feedStore.willLoadingPage) {
      return;
    }
    feedStore.setIsFetching(true);
    (async () => {
      const { total, posts } = await postApi.fetchPosts({
        order: feedStore.filterType,
        address,
        offset: feedStore.page * feedStore.limit,
        limit: feedStore.limit,
      });
      feedStore.setTotal(total);
      feedStore.addPosts(posts);
      feedStore.setIsFetching(false);
      feedStore.setIsFetched(true);
    })();
  }, [address, state, feedStore.page, feedStore.filterType, feedStore]);

  React.useEffect(() => {
    if (isMyself) {
      state.author.nickname = user.nickname;
      state.author.avatar = user.avatar;
      state.author.cover = user.cover;
      state.author.bio = user.bio;
    }
  }, [user.nickname, user.avatar, user.cover, user.bio, isMyself, state]);

  React.useEffect(() => {
    feedStore.setBelongedAuthor(toJS(state.author));
  }, [
    state.author,
    state.author.nickname,
    state.author.avatar,
    state.author.cover,
    state.author.bio,
    feedStore,
  ]);

  const infiniteRef: any = useWindowInfiniteScroll({
    loading: feedStore.isFetching,
    hasNextPage: feedStore.hasMorePosts,
    threshold: 350,
    onLoadMore: () => {
      feedStore.setPage(feedStore.page + 1);
    },
  });

  const handleFilterChange = (type: string) => {
    if (feedStore.isFetching) {
      return;
    }
    if (type !== 'OTHERS') {
      feedStore.setIsFetched(false);
      feedStore.setPage(0);
    } else {
      (async () => {
        state.loadingOthers = true;
        await sleep(500);
        state.loadingOthers = false;
      })();
    }
    feedStore.filterType = type as FilterType;
  };

  const subscribe = async () => {
    try {
      await subscriptionApi.subscribe(address);
      state.author.following = true;
      subscriptionStore.addAuthor(state.author);
    } catch (err) {
      console.log(err);
    }
  };

  const unsubscribe = async () => {
    try {
      await subscriptionApi.unsubscribe(address);
      state.author.following = false;
      subscriptionStore.removeAuthor(state.author.address);
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="w-full md:w-916 md:m-auto -mt-2 md:mt-0">
        <div>
          <div className="flex items-stretch overflow-hidden relative pb-6 md:rounded-12">
            <div
              className="absolute top-0 left-0 w-full h-full overflow-hidden bg-cover bg-center md:rounded-12"
              style={{
                backgroundImage: `url('${resizeFullImage(
                  isDefaultAvatar ? DEFAULT_BG_GRADIENT : state.author.cover || state.author.avatar,
                )}')`,
              }}
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 blur-layer md:rounded-12" />
            </div>
            <div className="flex justify-between z-10 w-full box-border pt-8 md:pt-16 px-5 md:px-16 text-white relative">
              <div className="w-10/12 md:w-auto">
                <img
                  className="rounded-full avatar bg-white"
                  src={resizeImage(state.author.avatar, 200)}
                  alt={state.author.nickname}
                  onError={(e: any) => {
                    e.target.src = getDefaultAvatar();
                  }}
                />
                <div className="font-bold mt-3 md:mt-2 text-18 md:text-24 pt-1 leading-snug nickname">
                  {state.author.nickname}
                </div>
                <div className="text-14 md:text-16 flex items-center">
                  <span className="mt-2">
                    {' '}
                    <span className="text-16 font-bold">
                      {state.author.summary?.post.count}
                    </span>{' '}
                    篇文章{' '}
                  </span>
                  {Number(state.author.summary?.followingAuthor.count) > 0 && (
                    <span className="mx-3 mt-2 opacity-50">|</span>
                  )}
                  {Number(state.author.summary?.followingAuthor.count) > 0 && (
                    <span
                      className="cursor-pointer mt-2"
                      onClick={() => {
                        modalStore.openUserList({
                          authorAddress: state.author.address,
                          title: `${thatName}关注的人`,
                          type: 'FOLLOWING_USERS',
                        });
                      }}
                    >
                      <span className="text-16 font-bold">
                        {state.author.summary?.followingAuthor.count}
                      </span>{' '}
                      关注{' '}
                    </span>
                  )}
                  {Number(state.author.summary?.follower.count) > 0 && (
                    <span className="opacity-50 mx-3 mt-2">|</span>
                  )}
                  {Number(state.author.summary?.follower.count) > 0 && (
                    <span
                      className="cursor-pointer mt-2"
                      onClick={() => {
                        modalStore.openUserList({
                          authorAddress: state.author.address,
                          title: `关注${thatName}的人`,
                          type: 'USER_FOLLOWERS',
                        });
                      }}
                    >
                      <span className="text-16 font-bold">
                        {state.author.summary?.follower.count}
                      </span>{' '}
                      关注者
                    </span>
                  )}
                </div>
                <div className="md:hidden pt-2 pr-5 text-white opacity-90">
                  {state.author.bio && <div className="text-13">{state.author.bio}</div>}
                </div>
              </div>
              <div className="mt-16 md:mt-12 pt-4 mr-6 md:mr-3 absolute md:static top-0 right-0">
                {!isMyself && (
                  <div>
                    {state.author.following ? (
                      <Button onClick={unsubscribe} outline color="white">
                        已关注
                      </Button>
                    ) : (
                      <Button onClick={subscribe}>关注</Button>
                    )}
                  </div>
                )}
                {isMyself && (
                  <Button
                    outline={!state.author.cover}
                    color={state.author.cover ? 'gray' : 'white'}
                    size={isMobile ? 'small' : 'normal'}
                    onClick={() => {
                      modalStore.openSettings('profile');
                    }}
                  >
                    <div className="flex items-center text-18 mr-1">
                      <Edit />
                    </div>
                    编辑资料
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 md:pb-10 flex justify-between items-start">
          <div className="w-full md:w-8/12 box-border md:pr-3">
            <div className="bg-white md:px-5 pb-8 md:rounded-12 h-screen md:h-auto">
              <Filter onChange={handleFilterChange} type={feedStore.filterType} tabs={tabs} />
              {feedStore.filterType !== 'OTHERS' && (
                <div className="posts-container" ref={infiniteRef}>
                  <div className="mt-2" />
                  {feedStore.isFetched && state.showPosts && feedStore.hasPosts && (
                    <Posts posts={feedStore.posts} hideAuthor smallCoverSize />
                  )}
                  {feedStore.isFetched && state.showPosts && !feedStore.hasPosts && (
                    <div className="pt-20 pb-16 text-center text-gray-500">Ta 还没有发布过文章</div>
                  )}
                  {(!feedStore.isFetched || !state.showPosts) && (
                    <div className="pt-20 md:pt-20">
                      <Loading />
                    </div>
                  )}
                  {feedStore.isFetched && state.showPosts && feedStore.hasMorePosts && (
                    <div className="mt-10">
                      <Loading />
                    </div>
                  )}
                </div>
              )}
              {feedStore.filterType === 'OTHERS' && (
                <div>
                  {!state.loadingOthers && (
                    <FolderGrid
                      folders={[
                        {
                          hide: state.author.summary?.topic.count === 0,
                          authorAddress: state.author.address,
                          type: 'CREATED_TOPICS',
                          title: `专题`,
                          content: `${state.author.summary?.topic.count}个`,
                          gallery: state.author.summary?.topic.preview || [],
                        },
                        {
                          hide: state.author.summary?.followingTopic.count === 0,
                          authorAddress: state.author.address,
                          type: 'FOLLOWING_TOPICS',
                          title: `${thatName}关注的专题`,
                          content: `${state.author.summary?.followingTopic.count}个`,
                          gallery: state.author.summary?.followingTopic.preview || [],
                        },
                        {
                          hide: state.author.summary?.followingAuthor.count === 0,
                          authorAddress: state.author.address,
                          type: 'FOLLOWING_USERS',
                          title: `关注的人`,
                          content: `${state.author.summary?.followingAuthor.count}个`,
                          gallery: state.author.summary?.followingAuthor.preview || [],
                        },
                        {
                          hide: state.author.summary?.follower.count === 0,
                          authorAddress: state.author.address,
                          type: 'USER_FOLLOWERS',
                          title: `关注${thatName}的人`,
                          content: `${state.author.summary?.follower.count}个`,
                          gallery: state.author.summary?.follower.preview || [],
                        },
                      ]}
                    />
                  )}
                  {state.loadingOthers && (
                    <div className="pt-20 md:pt-20">
                      <Loading />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {isPc && (
            <div className="w-4/12">
              <div className="bg-white rounded-12 pb-2 mb-3 text-gray-4a">
                <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 flex justify-between items-center">
                  个人介绍
                </div>
                <div className="px-5 py-4">
                  {state.author.bio}
                  {!state.author.bio && (
                    <div className="text-center mt-2">
                      {isMyself && (
                        <span
                          className="text-blue-400 cursor-pointer"
                          onClick={() => modalStore.openSettings()}
                        >
                          点击填写介绍、让大家了解你
                        </span>
                      )}
                      {!isMyself && 'Ta 还没有填写自我介绍'}
                    </div>
                  )}
                </div>
              </div>
              {isMyself && state.author.summary?.topic.count === 0 && (
                <div className="bg-white rounded-12 pb-2 mb-3 text-gray-4a">
                  <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 flex justify-between items-center">
                    我的专题
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-center mt-2">
                      <Tooltip
                        placement="top"
                        arrow
                        title={
                          <div className="py-2 px-1 text-12">
                            <div>创建专题之后，你可以：</div>
                            <div className="mt-2">1. 收录整理自己的文章</div>
                            <div className="mt-1">2. 收录别人的好文章</div>
                            <div className="mt-1">3. 呼吁别人来投稿，一起创造精彩的文章合集</div>
                          </div>
                        }
                      >
                        <span
                          className="text-blue-400 cursor-pointer"
                          onClick={() => (state.showTopicEditorModal = true)}
                        >
                          点击创建专题
                        </span>
                      </Tooltip>
                      <TopicEditorModal
                        open={state.showTopicEditorModal}
                        close={() => (state.showTopicEditorModal = false)}
                        onChange={async (topic) => {
                          if (topic) {
                            snackbarStore.show({
                              message: `专题已创建，开始收录文章${
                                topic.contributionEnabled ? '，或者呼吁大家来投稿吧' : '吧'
                              }`,
                              duration: 4000,
                            });
                            props.history.push(`/topics/${topic.uuid}`);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <FolderGrid
                folders={[
                  {
                    hide: state.author.summary?.topic.count === 0,
                    authorAddress: state.author.address,
                    type: 'CREATED_TOPICS',
                    title: `专题`,
                    content: `${state.author.summary?.topic.count}个`,
                    gallery: state.author.summary?.topic.preview || [],
                  },
                  {
                    hide: state.author.summary?.followingTopic.count === 0,
                    authorAddress: state.author.address,
                    type: 'FOLLOWING_TOPICS',
                    title: `${thatName}关注的专题`,
                    content: `${state.author.summary?.followingTopic.count}个`,
                    gallery: state.author.summary?.followingTopic.preview || [],
                  },
                  {
                    hide: state.author.summary?.followingAuthor.count === 0,
                    authorAddress: state.author.address,
                    type: 'FOLLOWING_USERS',
                    title: `关注的人`,
                    content: `${state.author.summary?.followingAuthor.count}个`,
                    gallery: state.author.summary?.followingAuthor.preview || [],
                  },
                  {
                    hide: state.author.summary?.follower.count === 0,
                    authorAddress: state.author.address,
                    type: 'USER_FOLLOWERS',
                    title: `关注${thatName}的人`,
                    content: `${state.author.summary?.follower.count}个`,
                    gallery: state.author.summary?.follower.preview || [],
                  },
                ]}
              />
            </div>
          )}
        </div>
        {!loading && feedStore.hasMore && (
          <div className="mt-10">
            <Loading />
          </div>
        )}
        <style jsx>{`
          .avatar {
            width: ${isMobile ? 74 : 120}px;
            height: ${isMobile ? 74 : 120}px;
          }
          .nickname {
            max-width: ${isMobile ? '230px' : 'auto'};
          }
          .blur-layer {
            background: -webkit-linear-gradient(
              rgba(32, 32, 32, 0) 14%,
              rgba(32, 32, 32, 0.56) 100%
            );
            background: linear-gradient(rgba(32, 32, 32, 0) 14%, rgba(32, 32, 32, 0.56) 100%);
            -webkit-backdrop-filter: blur(${state.author.cover ? 0 : 20}px);
            backdrop-filter: blur(${state.author.cover ? 0 : 20}px);
          }
          .posts-container {
            min-height: 90vh;
          }
        `}</style>
      </div>
    </Fade>
  );
});
