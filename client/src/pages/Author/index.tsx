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
import { FilterType } from 'apis/post';
import postApi from 'apis/post';
import { isEmpty } from 'lodash';
import { toJS } from 'mobx';
import { resizeFullImage } from 'utils';
import Img from 'components/Img';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';
import { MdSearch, MdChevronLeft } from 'react-icons/md';
import { BiEditAlt } from 'react-icons/bi';
import { RiSettings4Fill } from 'react-icons/ri';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DrawerMenu from 'components/DrawerMenu';
import { MdMoreHoriz } from 'react-icons/md';
import copy from 'copy-to-clipboard';
import PostImportModal from 'components/PostImportModal';
import classNames from 'classnames';
import { FaBars } from 'react-icons/fa';
import {
  isMobile,
  isPc,
  getDefaultAvatar,
  getDefaultDeprecatedAvatar,
  sleep,
  isWeChat,
} from 'utils';

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
    authorStore,
    photoSwipeStore,
    contextStore,
  } = useStore();
  const state = useLocalStore(() => ({
    isFetchingAuthor: false,
    isFetchedAuthor: false,
    showTopicEditorModal: false,
    loadingOthers: false,
    showPosts: false,
    showDraftsModal: false,
    showMainMenu: false,
    showShareMenu: false,
    showPostImportModal: false,
  }));
  const loading = React.useMemo(() => state.isFetchingAuthor || !preloadStore.ready, [
    state.isFetchingAuthor,
    preloadStore.ready,
  ]);
  const { isMixinImmersive, isMixin } = contextStore;
  const { prevPath } = pathStore;
  const { isLogin, user } = userStore;
  const { author } = authorStore;
  const { address } = props.match.params;
  const isMyself = isLogin && userStore.user.address === address;
  const thatName = isMyself ? '我' : 'TA';
  const isDefaultAvatar =
    author.avatar === getDefaultAvatar() || author.avatar === getDefaultDeprecatedAvatar();
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
          authorStore.setAuthor(author);
          document.title = author.nickname;
        } catch (err) {
          console.log(err);
        }
        if (type !== 'SILENT') {
          state.isFetchingAuthor = false;
          state.isFetchedAuthor = true;
        }
      })();
    },
    [state, address, authorStore],
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
        authorStore.setAuthor(feedStore.belongedAuthor);
        state.isFetchedAuthor = true;
        return;
      }
    }

    fetchAuthor();
  }, [state, address, feedStore, fetchAuthor, authorStore]);

  const fetchPosts = React.useCallback(() => {
    (async () => {
      feedStore.setIsFetching(true);
      try {
        let fetchPostsPromise;
        if (feedStore.filterType === 'POPULARITY') {
          fetchPostsPromise = postApi.fetchPostsByPopularity({
            address,
            offset: feedStore.page * feedStore.limit,
            limit: feedStore.limit,
          });
        } else {
          fetchPostsPromise = postApi.fetchPosts({
            address,
            offset: feedStore.page * feedStore.limit,
            limit: feedStore.limit,
          });
        }
        const { total, posts } = await fetchPostsPromise;
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
      authorStore.updateAuthor({
        address: user.address,
        nickname: user.nickname,
        avatar: user.avatar,
        cover: user.cover,
        bio: user.bio,
        privateSubscriptionEnabled: user.privateSubscriptionEnabled,
      });
    }
  }, [
    authorStore,
    user,
    user.nickname,
    user.avatar,
    user.cover,
    user.bio,
    user.privateSubscriptionEnabled,
    isMyself,
  ]);

  React.useEffect(() => {
    feedStore.setBelongedAuthor(toJS(author));
  }, [
    author,
    author.nickname,
    author.avatar,
    author.cover,
    author.bio,
    author.privateSubscriptionEnabled,
    feedStore,
  ]);

  React.useEffect(() => {
    return () => {
      authorStore.clearAuthor();
    };
  }, [authorStore]);

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
      author.following = true;
      author.summary!.follower!.count += 1;
    } catch (err) {
      console.log(err);
    }
  };

  const unsubscribe = async () => {
    try {
      await subscriptionApi.unsubscribe(address);
      author.following = false;
      author.summary!.follower!.count -= 1;
    } catch (err) {
      console.log(err);
    }
  };

  const Menu = () => {
    return (
      <div>
        <div className="absolute top-0 left-0 z-10 w-full">
          <div
            className={classNames(
              {
                'pt-0': isMixinImmersive,
                'pt-2': !isMixinImmersive,
              },
              'flex items-center justify-between text-gray-f7 h-12 pb-1 pr-1',
            )}
          >
            <div className="flex items-center">
              {!isMyself && (
                <div
                  className="flex items-center pl-3 text-20"
                  onClick={() => (prevPath ? props.history.goBack() : props.history.push('/'))}
                >
                  <MdChevronLeft className="text-30" />
                </div>
              )}
            </div>
            <div className="flex items-center">
              {settingsStore.settings.extra['search.enabled'] && (
                <div
                  className="pl-5 pr-3 flex items-center text-26 py-2"
                  onClick={() => {
                    if (!userStore.isLogin) {
                      modalStore.openLogin();
                      return;
                    }
                    props.history.push(
                      `/search?address=${author.address}&nickname=${author.nickname}`,
                    );
                  }}
                >
                  <MdSearch />
                </div>
              )}
              {isMyself && (
                <div
                  className="pl-5 pr-4 flex items-center text-24 py-2"
                  onClick={() => (state.showMainMenu = true)}
                >
                  <FaBars />
                </div>
              )}
              {!isMyself && !isMixin && (
                <div
                  className="pl-5 pr-3 flex items-center text-26 py-2"
                  onClick={() => (state.showShareMenu = true)}
                >
                  <MdMoreHoriz />
                </div>
              )}
              {isMixinImmersive && <div className="pr-24 mr-4" />}
            </div>
          </div>
        </div>
        <DrawerMenu
          open={state.showMainMenu}
          onClose={() => {
            state.showMainMenu = false;
          }}
          items={[
            {
              invisible: !settingsStore.settings['import.enabled'] || !userStore.canPublish,
              name: '导入微信公众号文章',
              onClick: () => {
                state.showPostImportModal = true;
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
            {
              invisible: isMixin,
              name: '分享',
              onClick: () => {
                copy(window.location.href);
                snackbarStore.show({
                  message: '主页链接已复制',
                });
              },
            },
          ]}
        />
        <DrawerMenu
          open={state.showShareMenu}
          onClose={() => {
            state.showShareMenu = false;
          }}
          items={[
            {
              name: '分享',
              onClick: () => {
                copy(window.location.href);
                snackbarStore.show({
                  message: '主页链接已复制',
                });
              },
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
        {settingsStore.settings['import.enabled'] && (
          <PostImportModal
            open={state.showPostImportModal}
            close={() => (state.showPostImportModal = false)}
          />
        )}
      </div>
    );
  };

  const EditorEntry = () => {
    return (
      <div className="fixed bottom-0 right-0 m-4 mb-20 z-10">
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
        <div className="-mt-24 md:-mt-40">
          <Loading />
        </div>
      </div>
    );
  }

  if (state.isFetchedAuthor && isEmpty(author)) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-24 md:-mt-40 text-base md:text-xl text-center text-gray-600">
          抱歉，你访问的作者不存在
        </div>
      </div>
    );
  }

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
                    : resizeFullImage(author.cover) || author.avatar
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
                  src={author.avatar}
                  alt={author.nickname}
                  resizeWidth={isMobile ? 74 : 120}
                  onClick={() => {
                    if (isMyself) {
                      modalStore.openSettings('profile');
                    } else if (author.avatar) {
                      photoSwipeStore.show(resizeFullImage(author.avatar));
                    }
                  }}
                />
                <div
                  className="font-bold mt-3 md:mt-2 text-18 md:text-24 pt-1 leading-snug nickname"
                  onClick={() => {
                    isMyself && modalStore.openSettings('profile');
                  }}
                >
                  {author.nickname}
                </div>
                <div className="text-14 md:text-16 flex items-center">
                  <span className="mt-2">
                    {' '}
                    <span className="text-16 font-bold">
                      {author.summary?.post.count}
                    </span> 篇文章{' '}
                  </span>
                  {Number(author.summary?.followingAuthor.count) > 0 && (
                    <span className="mx-3 mt-2 opacity-50">|</span>
                  )}
                  {Number(author.summary?.followingAuthor.count) > 0 && (
                    <span
                      className="cursor-pointer mt-2"
                      onClick={() => {
                        if (isMyself || !author.privateSubscriptionEnabled) {
                          modalStore.openUserList({
                            authorAddress: author.address,
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
                        {author.summary?.followingAuthor.count}
                      </span>{' '}
                      关注{' '}
                    </span>
                  )}
                  {Number(author.summary?.follower.count) > 0 && (
                    <span className="opacity-50 mx-3 mt-2">|</span>
                  )}
                  {Number(author.summary?.follower.count) > 0 && (
                    <span
                      className="cursor-pointer mt-2"
                      onClick={() => {
                        if (isMyself || !author.privateSubscriptionEnabled) {
                          modalStore.openUserList({
                            authorAddress: author.address,
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
                      <span className="text-16 font-bold">{author.summary?.follower.count}</span>{' '}
                      被关注
                    </span>
                  )}
                </div>
                <div className="md:hidden pt-2 pr-5 text-white opacity-90">
                  {author.bio && <div className="text-13">{author.bio}</div>}
                </div>
              </div>
              <div className="mt-16 md:mt-12 pt-4 mr-6 md:mr-3 absolute md:static top-0 right-0">
                {!isMyself && (
                  <div>
                    {author.following ? (
                      <Button onClick={unsubscribe} outline color="white">
                        已关注
                      </Button>
                    ) : (
                      <Button onClick={subscribe}>关注</Button>
                    )}
                  </div>
                )}
                {isPc && isMyself && (
                  <Button
                    outline
                    color="white"
                    size={isMobile ? 'small' : 'normal'}
                    onClick={() => {
                      modalStore.openSettings('profile');
                    }}
                  >
                    <div className="flex items-center text-16 mr-1">
                      <BiEditAlt />
                    </div>
                    编辑资料
                  </Button>
                )}
                {isMobile && isMyself && (
                  <Link to="/settings">
                    <Button outline color="white" size={isMobile ? 'small' : 'normal'}>
                      <div className="flex items-center text-16 mr-1">
                        <RiSettings4Fill />
                      </div>
                      账号设置
                    </Button>
                  </Link>
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
              <div className="pb-1 md:pb-0" />
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
                <div className="bg-white min-h-70-vh -mt-2 md:-mt-0">
                  {!state.loadingOthers && (
                    <FolderGrid
                      folders={[
                        {
                          hide: author.summary?.topic.count === 0,
                          authorAddress: author.address,
                          type: 'CREATED_TOPICS',
                          title: `专题`,
                          content: `${author.summary?.topic.count}个`,
                          gallery: author.summary?.topic.preview || [],
                          onClose: () => fetchAuthor('SILENT'),
                        },
                        {
                          hide: author.summary?.followingTopic.count === 0,
                          authorAddress: author.address,
                          type: 'FOLLOWING_TOPICS',
                          title: `${thatName}关注的专题`,
                          content: `${author.summary?.followingTopic.count}个`,
                          gallery: author.summary?.followingTopic.preview || [],
                          onClose: () => fetchAuthor('SILENT'),
                        },
                        {
                          hide:
                            (author.privateSubscriptionEnabled && !isMyself) ||
                            author.summary?.followingAuthor.count === 0,
                          authorAddress: author.address,
                          type: 'FOLLOWING_USERS',
                          title: `关注的人`,
                          content: `${author.summary?.followingAuthor.count}个`,
                          gallery: author.summary?.followingAuthor.preview || [],
                          onClose: () => fetchAuthor('SILENT'),
                        },
                        {
                          hide:
                            (author.privateSubscriptionEnabled && !isMyself) ||
                            author.summary?.follower.count === 0,
                          authorAddress: author.address,
                          type: 'USER_FOLLOWERS',
                          title: `关注${thatName}的人`,
                          content: `${author.summary?.follower.count}个`,
                          gallery: author.summary?.follower.preview || [],
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
                  {author.bio}
                  {!author.bio && (
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
              {isMyself && author.summary?.topic.count === 0 && (
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
                    hide: author.summary?.topic.count === 0,
                    authorAddress: author.address,
                    type: 'CREATED_TOPICS',
                    title: `专题`,
                    content: `${author.summary?.topic.count}个`,
                    gallery: author.summary?.topic.preview || [],
                    onClose: () => fetchAuthor('SILENT'),
                  },
                  {
                    hide: author.summary?.followingTopic.count === 0,
                    authorAddress: author.address,
                    type: 'FOLLOWING_TOPICS',
                    title: `${thatName}关注的专题`,
                    content: `${author.summary?.followingTopic.count}个`,
                    gallery: author.summary?.followingTopic.preview || [],
                    onClose: () => fetchAuthor('SILENT'),
                  },
                  {
                    hide:
                      (author.privateSubscriptionEnabled && !isMyself) ||
                      author.summary?.followingAuthor.count === 0,
                    authorAddress: author.address,
                    type: 'FOLLOWING_USERS',
                    title: `关注的人`,
                    content: `${author.summary?.followingAuthor.count}个`,
                    gallery: author.summary?.followingAuthor.preview || [],
                    onClose: () => fetchAuthor('SILENT'),
                  },
                  {
                    hide:
                      (author.privateSubscriptionEnabled && !isMyself) ||
                      author.summary?.follower.count === 0,
                    authorAddress: author.address,
                    type: 'USER_FOLLOWERS',
                    title: `关注${thatName}的人`,
                    content: `${author.summary?.follower.count}个`,
                    gallery: author.summary?.follower.preview || [],
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
