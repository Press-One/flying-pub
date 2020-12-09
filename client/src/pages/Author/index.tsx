import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import Tooltip from '@material-ui/core/Tooltip';
import Button from 'components/Button';
import Posts from 'components/Posts';
import Loading from 'components/Loading';
import FolderGrid from 'components/FolderGrid';
import Filter from 'components/PostsFilter';
import TopicEditorModal from 'components/TopicEditorModal';
import DraftsModal from './DraftsModal';
import subscriptionApi from 'apis/subscription';
import authorApi from 'apis/author';
import {
  isMobile,
  isPc,
  getDefaultAvatar,
  getDefaultDeprecatedAvatar,
  sleep,
  isWeChat,
  getApiEndpoint,
} from 'utils';
import { IAuthor } from 'apis/author';
import { FilterType } from 'apis/post';
import postApi from 'apis/post';
import { isEmpty } from 'lodash';
import { toJS } from 'mobx';
import { resizeFullImage, disableBackgroundScroll } from 'utils';
import Img from 'components/Img';
import Viewer from 'react-viewer';
import classNames from 'classnames';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';
import { Edit, Settings } from '@material-ui/icons';
import { faPen, faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DrawerMenu from 'components/DrawerMenu';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';

const DEFAULT_BG_GRADIENT =
  'https://static-assets.xue.cn/images/8aa7ea2a80a7330f96f8d3b6990a6d114487a35559080baec4a176a6640133df';

export default observer((props: any) => {
  const {
    modalStore,
    userStore,
    snackbarStore,
    preloadStore,
    feedStore,
    confirmDialogStore,
    walletStore,
    settingsStore,
    pathStore,
  } = useStore();
  const state = useLocalStore(() => ({
    isFetchingAuthor: false,
    isFetchedAuthor: false,
    author: {} as IAuthor,
    showTopicEditorModal: false,
    loadingOthers: false,
    showPosts: false,
    showDraftsModal: false,
    showMainMenu: false,
    showSettingsMenu: false,
  }));
  const loading = React.useMemo(() => state.isFetchingAuthor || !preloadStore.ready, [
    state.isFetchingAuthor,
    preloadStore.ready,
  ]);
  const { prevPath } = pathStore;
  const { isLogin, user } = userStore;
  const { address } = props.match.params;
  const isMyself = isLogin && userStore.user.address === address;
  const thatName = isMyself ? '我' : 'TA';
  const isDefaultAvatar =
    state.author.avatar === getDefaultAvatar() ||
    state.author.avatar === getDefaultDeprecatedAvatar();
  const tabs = [
    {
      type: 'POPULARITY',
      name: '热门',
    },
    {
      type: 'LATEST',
      name: '最新',
    },
  ];
  if (isMobile) {
    tabs.push({
      type: 'OTHERS',
      name: '动态',
    });
  }

  const [showImage, setShowImage] = React.useState(false);
  const ref = React.useRef(document.createElement('div'));

  const fetchAuthor = React.useCallback(
    (type?: string) => {
      (async () => {
        if (type !== 'SILENT') {
          state.isFetchingAuthor = true;
        }
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
        if (type !== 'SILENT') {
          state.isFetchingAuthor = false;
          state.isFetchedAuthor = true;
        }
      })();
    },
    [state, address],
  );

  React.useEffect(() => {
    if (feedStore.provider !== `author:${address}`) {
      feedStore.setProvider(`author:${address}`);
      feedStore.clear();
      feedStore.setFilterType(tabs[1].type);
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

    fetchAuthor();
  }, [state, address, feedStore, fetchAuthor]);

  const fetchPosts = React.useCallback(() => {
    (async () => {
      feedStore.setIsFetching(true);
      try {
        const order = feedStore.filterType === 'LATEST' ? 'PUB_DATE' : feedStore.filterType;
        const { total, posts } = await postApi.fetchPosts({
          order,
          address,
          offset: feedStore.page * feedStore.limit,
          limit: feedStore.limit,
        });
        feedStore.setTotal(total);
        feedStore.addPosts(posts);
      } catch (err) {
        console.log(err);
      }
      feedStore.setIsFetching(false);
      feedStore.setIsFetched(true);
      feedStore.setPendingNewPage(false);
    })();
  }, [feedStore, address]);

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
    fetchPosts();
  }, [address, state, feedStore.page, feedStore.filterType, feedStore, fetchPosts]);

  React.useEffect(() => {
    if (isMyself) {
      state.author.nickname = user.nickname;
      state.author.avatar = user.avatar;
      state.author.cover = user.cover;
      state.author.bio = user.bio;
      state.author.privateSubscriptionEnabled = user.privateSubscriptionEnabled;
    }
  }, [
    user.nickname,
    user.avatar,
    user.cover,
    user.bio,
    user.privateSubscriptionEnabled,
    isMyself,
    state,
  ]);

  React.useEffect(() => {
    feedStore.setBelongedAuthor(toJS(state.author));
  }, [
    state.author,
    state.author.nickname,
    state.author.avatar,
    state.author.cover,
    state.author.bio,
    state.author.privateSubscriptionEnabled,
    feedStore,
  ]);

  const infiniteRef: any = useWindowInfiniteScroll({
    loading: feedStore.isFetching,
    hasNextPage: feedStore.hasMorePosts,
    threshold: 350,
    onLoadMore: () => {
      if (!feedStore.isFetching && !feedStore.pendingNewPage) {
        feedStore.setPendingNewPage(true);
        feedStore.setPage(feedStore.page + 1);
      }
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
      state.author.summary!.follower!.count += 1;
    } catch (err) {
      console.log(err);
    }
  };

  const unsubscribe = async () => {
    try {
      await subscriptionApi.unsubscribe(address);
      state.author.following = false;
      state.author.summary!.follower!.count -= 1;
    } catch (err) {
      console.log(err);
    }
  };

  const Menu = () => {
    const logoutUrl = `${getApiEndpoint()}/api/logout?from=${window.location.origin}`;
    const supportPhoneBinding = !!settingsStore.settings['auth.providers']?.includes('phone');
    const hasPhoneBinding = userStore.profiles.some((v) => v.provider === 'phone');
    return (
      <div>
        <div className="absolute top-0 left-0 z-10 w-full">
          <div className="flex items-center justify-between text-gray-f2 h-12 pb-1 pt-2 pr-1">
            <div className="flex items-center">
              <div
                className="flex items-center p-2 pl-5 text-20"
                onClick={() => (prevPath ? props.history.goBack() : props.history.push('/'))}
              >
                <ArrowBackIos />
              </div>
            </div>
            {isMyself && (
              <div className="flex items-center">
                <div
                  className="pl-5 pr-3 flex items-center text-26 py-2"
                  onClick={() => (state.showSettingsMenu = true)}
                >
                  <Settings />
                </div>
                <div
                  className="pl-5 pr-4 flex items-center text-24 py-2"
                  onClick={() => (state.showMainMenu = true)}
                >
                  <FontAwesomeIcon icon={faBars} />
                </div>
              </div>
            )}
          </div>
        </div>
        <DrawerMenu
          open={state.showMainMenu}
          onClose={() => {
            state.showMainMenu = false;
          }}
          items={[
            {
              invisible: isWeChat && !userStore.canPublish,
              name: '写文章',
              onClick: () => {
                props.history.push(`/editor`);
              },
            },
            {
              invisible: isWeChat && !userStore.canPublish,
              name: '草稿箱',
              onClick: () => {
                state.showDraftsModal = true;
              },
            },
            {
              name: '收藏夹',
              onClick: () => {
                modalStore.openFavorites();
              },
            },
            {
              invisible: !userStore.isLogin,
              name: walletStore.rewardOnly ? '打赏记录' : '所有交易记录',
              onClick: () => {
                modalStore.openWallet({
                  tab: 'receipts',
                });
              },
            },
          ]}
        />
        <DrawerMenu
          open={state.showSettingsMenu}
          onClose={() => {
            state.showSettingsMenu = false;
          }}
          items={[
            {
              invisible: !walletStore.canSpendBalance,
              name: '余额',
              onClick: () => {
                modalStore.openWallet({
                  tab: 'assets',
                });
              },
            },
            {
              invisible: !walletStore.canSpendBalance,
              name: '设置密码',
              onClick: () => {
                modalStore.openSettings('password');
              },
            },
            {
              invisible: !userStore.isLogin,
              name: '账号绑定',
              onClick: () => {
                modalStore.openSettings('bind');
              },
            },
            {
              invisible: !(supportPhoneBinding && hasPhoneBinding),
              name: '设置密码',
              onClick: () => {
                modalStore.openSettings('password');
              },
            },
            {
              invisible: !userStore.isLogin,
              name: '退出账号',
              onClick: () => {
                modalStore.openPageLoading();
                window.location.href = logoutUrl;
              },
              stayOpenAfterClick: true,
            },
          ]}
        />
        <DraftsModal
          open={state.showDraftsModal}
          close={() => {
            state.showDraftsModal = false;
            feedStore.clear();
            feedStore.filterType = 'LATEST';
            fetchPosts();
          }}
        />
      </div>
    );
  };

  const EditorEntry = () => {
    return (
      <div className="fixed bottom-0 right-0 m-4 z-10">
        <Link to={`/editor`}>
          <div className="text-20 flex items-center justify-center w-12 h-12 rounded-full bg-blue-400 text-white">
            <FontAwesomeIcon icon={faPen} />
          </div>
        </Link>
      </div>
    );
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

  if (state.isFetchedAuthor && isEmpty(state.author)) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30 text-base md:text-xl text-center text-gray-600">
          抱歉，你访问的作者不存在
        </div>
      </div>
    );
  }

  const showImageView = (show: boolean) => {
    setShowImage(show);
    if (isMobile) {
      disableBackgroundScroll(show);
    }
  };

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="w-full md:w-916 md:m-auto relative">
        {isMobile && (
          <div>
            {Menu()}
            {isMyself && !(isWeChat && !userStore.canPublish) && EditorEntry()}
          </div>
        )}
        <div>
          <div className="flex items-stretch overflow-hidden relative pt-8 md:pt-0 pb-6 md:rounded-12">
            <div
              className="absolute top-0 left-0 w-full h-full overflow-hidden bg-cover bg-center md:rounded-12"
              style={{
                backgroundImage: `url('${
                  isDefaultAvatar
                    ? resizeFullImage(DEFAULT_BG_GRADIENT)
                    : resizeFullImage(state.author.cover) || state.author.avatar
                }')`,
              }}
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 blur-layer md:rounded-12" />
            </div>
            <div className="flex justify-between z-10 w-full box-border pt-8 md:pt-16 px-5 md:px-16 text-white relative">
              <div className="w-10/12 md:w-auto">
                <Img
                  width={isMobile ? 74 : 120}
                  height={isMobile ? 74 : 120}
                  className="rounded-full avatar bg-white"
                  src={state.author.avatar}
                  alt={state.author.nickname}
                  resizeWidth={isMobile ? 74 : 120}
                  onClick={() => {
                    if (isMyself) {
                      modalStore.openSettings('profile');
                    } else if (state.author.avatar) {
                      showImageView(true);
                    }
                  }}
                />
                <div
                  className="font-bold mt-3 md:mt-2 text-18 md:text-24 pt-1 leading-snug nickname"
                  onClick={() => {
                    isMyself && modalStore.openSettings('profile');
                  }}
                >
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
                        if (isMyself || !state.author.privateSubscriptionEnabled) {
                          modalStore.openUserList({
                            authorAddress: state.author.address,
                            title: `${thatName}关注的人`,
                            type: 'FOLLOWING_USERS',
                            onClose: () => fetchAuthor('SILENT'),
                          });
                        } else {
                          confirmDialogStore.show({
                            content: 'Ta 没有公开这个列表哦',
                            okText: '我知道了',
                            cancelDisabled: true,
                            ok: () => {
                              confirmDialogStore.hide();
                            },
                          });
                        }
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
                        if (isMyself || !state.author.privateSubscriptionEnabled) {
                          modalStore.openUserList({
                            authorAddress: state.author.address,
                            title: `关注${thatName}的人`,
                            type: 'USER_FOLLOWERS',
                            onClose: () => fetchAuthor('SILENT'),
                          });
                        } else {
                          confirmDialogStore.show({
                            content: 'Ta 没有公开这个列表哦',
                            okText: '我知道了',
                            cancelDisabled: true,
                            ok: () => {
                              confirmDialogStore.hide();
                            },
                          });
                        }
                      }}
                    >
                      <span className="text-16 font-bold">
                        {state.author.summary?.follower.count}
                      </span>{' '}
                      被关注
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
                    outline
                    color="white"
                    size={isMobile ? 'small' : 'normal'}
                    onClick={() => {
                      modalStore.openSettings('profile');
                    }}
                  >
                    <div className="flex items-center text-16 mr-1">
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
            <div className="bg-white md:px-5 pb-8 md:rounded-12 md:pt-2">
              <Filter
                provider="author"
                onChange={handleFilterChange}
                type={feedStore.filterType}
                tabs={tabs}
              />
              {feedStore.filterType !== 'OTHERS' && (
                <div className="posts-container" ref={infiniteRef}>
                  <div className="md:mt-2" />
                  {feedStore.isFetched && state.showPosts && feedStore.hasPosts && (
                    <Posts posts={feedStore.posts} hideAuthor smallCoverSize />
                  )}
                  {feedStore.isFetched && state.showPosts && !feedStore.hasPosts && (
                    <div className="pt-20 pb-16 text-center text-gray-500">Ta 还没有发布过文章</div>
                  )}
                  {(!feedStore.isFetched || !state.showPosts) && (
                    <div className="pt-24 mt-5">
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
                          onClose: () => fetchAuthor('SILENT'),
                        },
                        {
                          hide: state.author.summary?.followingTopic.count === 0,
                          authorAddress: state.author.address,
                          type: 'FOLLOWING_TOPICS',
                          title: `${thatName}关注的专题`,
                          content: `${state.author.summary?.followingTopic.count}个`,
                          gallery: state.author.summary?.followingTopic.preview || [],
                          onClose: () => fetchAuthor('SILENT'),
                        },
                        {
                          hide:
                            (state.author.privateSubscriptionEnabled && !isMyself) ||
                            state.author.summary?.followingAuthor.count === 0,
                          authorAddress: state.author.address,
                          type: 'FOLLOWING_USERS',
                          title: `关注的人`,
                          content: `${state.author.summary?.followingAuthor.count}个`,
                          gallery: state.author.summary?.followingAuthor.preview || [],
                          onClose: () => fetchAuthor('SILENT'),
                        },
                        {
                          hide:
                            (state.author.privateSubscriptionEnabled && !isMyself) ||
                            state.author.summary?.follower.count === 0,
                          authorAddress: state.author.address,
                          type: 'USER_FOLLOWERS',
                          title: `关注${thatName}的人`,
                          content: `${state.author.summary?.follower.count}个`,
                          gallery: state.author.summary?.follower.preview || [],
                          onClose: () => fetchAuthor('SILENT'),
                        },
                      ]}
                    />
                  )}
                  {state.loadingOthers && (
                    <div className="pt-24 mt-5">
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
                    onClose: () => fetchAuthor('SILENT'),
                  },
                  {
                    hide: state.author.summary?.followingTopic.count === 0,
                    authorAddress: state.author.address,
                    type: 'FOLLOWING_TOPICS',
                    title: `${thatName}关注的专题`,
                    content: `${state.author.summary?.followingTopic.count}个`,
                    gallery: state.author.summary?.followingTopic.preview || [],
                    onClose: () => fetchAuthor('SILENT'),
                  },
                  {
                    hide:
                      (state.author.privateSubscriptionEnabled && !isMyself) ||
                      state.author.summary?.followingAuthor.count === 0,
                    authorAddress: state.author.address,
                    type: 'FOLLOWING_USERS',
                    title: `关注的人`,
                    content: `${state.author.summary?.followingAuthor.count}个`,
                    gallery: state.author.summary?.followingAuthor.preview || [],
                    onClose: () => fetchAuthor('SILENT'),
                  },
                  {
                    hide:
                      (state.author.privateSubscriptionEnabled && !isMyself) ||
                      state.author.summary?.follower.count === 0,
                    authorAddress: state.author.address,
                    type: 'USER_FOLLOWERS',
                    title: `关注${thatName}的人`,
                    content: `${state.author.summary?.follower.count}个`,
                    gallery: state.author.summary?.follower.preview || [],
                    onClose: () => fetchAuthor('SILENT'),
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
        <div
          ref={ref}
          className={classNames(
            {
              hidden: !isMobile || !showImage,
            },
            'mobile-viewer-container fixed bg-black',
          )}
          onClick={() => showImageView(false)}
          //style={{ width: '125vw', height: '125vh', top: '-12.5vh', left: '-12.5vw', zIndex: 100 }}
        ></div>
        <Viewer
          className={isMobile ? 'mobile-viewer' : ''}
          onMaskClick={() => showImageView(false)}
          noNavbar={true}
          noToolbar={true}
          visible={showImage}
          onClose={() => showImageView(false)}
          images={[{ src: resizeFullImage(state.author.avatar) }]}
          container={isMobile && !!ref.current ? ref.current : undefined}
          noClose={isMobile}
        />
        <style jsx>{`
          .nickname {
            max-width: ${isMobile ? '230px' : 'auto'};
          }
          .blur-layer {
            background: -webkit-linear-gradient(
              rgba(32, 32, 32, 0) 14%,
              rgba(32, 32, 32, 0.56) 100%
            );
            background: linear-gradient(rgba(32, 32, 32, 0) 14%, rgba(32, 32, 32, 0.56) 100%);
            -webkit-backdrop-filter: blur(20px);
            backdrop-filter: blur(20px);
          }
          .posts-container {
            min-height: 90vh;
          }
        `}</style>
      </div>
    </Fade>
  );
});
