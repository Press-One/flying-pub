import React from 'react';
import { Link } from 'react-router-dom';
import { observer, useLocalStore } from 'mobx-react-lite';
import Viewer from 'react-viewer';
import marked from 'marked';
import BackButton from 'components/BackButton';
import Button from 'components/Button';
import Loading from 'components/Loading';
import BackToTop from 'components/BackToTop';
import TopicLabels, { IncludedButton } from 'components/TopicLabels';
import Fade from '@material-ui/core/Fade';
import { faCommentDots, faThumbsUp, faStar } from '@fortawesome/free-regular-svg-icons';
import { faStar as faSolidStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ShareIcon from '@material-ui/icons/Share';
import Badge from '@material-ui/core/Badge';
import MoreHoriz from '@material-ui/icons/MoreHoriz';
import classNames from 'classnames';
import RewardSummary from './rewardSummary';
import RewardModal from './rewardModal';
import DrawerMenu from 'components/DrawerMenu';
import CommentApi from 'apis/comment';
import Comment from './comment';
import { IPost } from 'apis/post';
import postApi from 'apis/post';
import fileApi from 'apis/file';
import subscriptionApi from 'apis/subscription';
import { useStore } from 'store';
import { ago, isPc, isMobile, sleep, getQuery, stopBodyScroll } from 'utils';
import FeedApi from './api';
import Api from 'api';
import Popover from '@material-ui/core/Popover';
import QRCode from 'qrcode.react';
import Img from 'components/Img';
import useWindowInfiniteScroll from 'hooks/useWindowInfiniteScroll';
import editorJsDataToHTML from './editorJsDataToHTML';
import copy from 'copy-to-clipboard';

import 'react-viewer/dist/index.css';
import './github.css';

const COMMENTS_LIMIT = isMobile ? 10 : 15;

export default observer((props: any) => {
  const {
    preloadStore,
    feedStore,
    userStore,
    modalStore,
    commentStore,
    confirmDialogStore,
    snackbarStore,
    settingsStore,
  } = useStore();

  const { ready } = preloadStore;
  const { post, setPost } = feedStore;
  const { isLogin, user } = userStore;
  const state = useLocalStore(() => ({
    isFetchedPost: false,
    showExtra: false,
    posting: false,
    showImage: false,
    imgSrc: '',
    openRewardModal: false,
    isFetchedReward: false,
    rewardSummary: { amountMap: {}, users: [] },
    isFetchingComments: false,
    isFetchedComments: false,
    commentPage: 0,
    hasMoreComments: true,
    isBan: false,
    anchorEl: null as any,
    showMenu: false,
  }));

  const noReward = state.rewardSummary.users.length === 0;
  const { rId } = props.match.params;
  const isMyself = React.useMemo(
    () => post && post.author && user.address === post.author.address,
    [user.address, post],
  );

  const ref = React.useRef(document.createElement('div'));

  const postHTMLContent = React.useMemo(() => {
    if (!post) {
      return '';
    }
    if (post.mimeType === 'application/json') {
      return editorJsDataToHTML(JSON.parse(post.content));
    } else if (post.mimeType === 'text/markdown') {
      marked.setOptions({
        highlight: (code: string) => {
          return require('highlight.js').highlightAuto(code).value;
        },
      });
      return marked.parse(post.content);
    }
    return '';
  }, [post]);

  React.useEffect(() => {
    return () => {
      feedStore.clearPost();
    };
  }, [feedStore]);

  React.useEffect(() => {
    if (state.isFetchedPost) {
      (async () => {
        await sleep(200);
        state.showExtra = true;
      })();
    }
  }, [state, state.isFetchedPost]);

  React.useEffect(() => {
    const commentId = getQuery('commentId');
    if (commentId) {
      modalStore.openPageLoading();
    }
  }, [modalStore]);

  React.useEffect(() => {
    state.rewardSummary = { amountMap: {}, users: [] };
  }, [rId, commentStore, state]);

  React.useEffect(() => {
    return () => {
      commentStore.setOpenSubCommentPage(false);
      commentStore.setSelectedTopComment(null);
    };
  }, [commentStore]);

  React.useEffect(() => {
    (async () => {
      try {
        const post: IPost = await postApi.fetchPost(rId, {
          withPendingTopicUuids: true,
        });
        if (post.latestRId) {
          window.location.replace(`/posts/${post.latestRId}${window.location.search}`);
          return;
        }
        document.title = post.title;
        setPost(post);
      } catch (err) {
        modalStore.closePageLoading();
        state.isBan = err.message === 'Post has been deleted';
      }
      state.isFetchedPost = true;
    })();
  }, [rId, setPost, modalStore, state]);

  const syncTopics = async () => {
    try {
      const resPost: IPost = await postApi.fetchPost(rId, {
        withPendingTopicUuids: true,
      });
      post.topics = resPost.topics || [];
    } catch (err) {}
  };

  React.useEffect(() => {
    (async () => {
      try {
        state.rewardSummary = await FeedApi.getRewardSummary(rId);
      } catch (err) {}
      state.isFetchedReward = true;
    })();
  }, [rId, state]);

  const showImageView = React.useCallback(
    (show: boolean) => {
      if (isMobile) {
        return;
      }
      state.showImage = show;
      if (isMobile) {
        stopBodyScroll(show);
      }
    },
    [state],
  );

  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (!post) {
      return;
    }
    const bindClickEvent = (e: any) => {
      if (e.target.tagName === 'A') {
        const href = e.target.getAttribute('href');
        window.open(href);
        e.preventDefault();
      } else if (e.target.tagName === 'IMG') {
        state.imgSrc = e.target.src;
        showImageView(true);
      }
    };

    setTimeout(() => {
      const markdownBody = document.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.addEventListener('click', bindClickEvent);
      }
    }, 2000);

    return () => {
      const markdownBody = document.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.addEventListener('click', bindClickEvent);
      }
    };
  }, [post, state, showImageView]);

  React.useEffect(() => {
    state.isFetchingComments = true;
    (async () => {
      try {
        const options = {
          offset: state.commentPage * COMMENTS_LIMIT,
          limit: COMMENTS_LIMIT,
          includedCommentId: getQuery('commentId'),
        };
        const res = await CommentApi.list(rId, options);
        if (state.commentPage === 0) {
          commentStore.reset();
        }
        commentStore.setTotal(res.total);
        commentStore.addComments(res.comments);
        commentStore.setHasMoreComments(res.comments.length >= COMMENTS_LIMIT);
        state.isFetchedComments = true;
      } catch (err) {
        console.log(err);
      }
      state.isFetchingComments = false;
    })();
  }, [commentStore, rId, state, state.commentPage]);

  const infiniteRef: any = useWindowInfiniteScroll({
    loading: state.isFetchingComments,
    hasNextPage: commentStore.hasMoreComments,
    threshold: 350,
    onLoadMore: () => {
      if (!state.isFetchingComments) {
        state.commentPage += 1;
      }
    },
  });

  React.useEffect(() => {
    if (ready && state.isFetchedPost && post) {
      const postContent: any = document.getElementById('post-content');
      if (postContent) {
        const images = postContent.querySelectorAll('img');
        for (const image of images) {
          image.onerror = function () {
            this.onerror = null;
            this.src = `${this.src}#retry`;
          };
        }
      }
    }
  }, [ready, state.isFetchedPost, post]);

  if (userStore.shouldLogin) {
    return null;
  }

  if (!ready || !state.isFetchedPost) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

  if (state.isBan || !post) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30 text-base md:text-xl text-center text-gray-600">
          抱歉，你访问的文章不存在
        </div>
      </div>
    );
  }

  const renderLoading = () => {
    return (
      <div className="py-20">
        <Loading />
      </div>
    );
  };

  const onCloseRewardModal = async (isSuccess: boolean) => {
    state.openRewardModal = false;
    if (isSuccess) {
      await sleep(200);
      state.rewardSummary = await FeedApi.getRewardSummary(rId);
    }
  };

  const reward = () => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    if (isMyself) {
      confirmDialogStore.show({
        content: '你不能打赏给自己哦',
        okText: '我知道了',
        cancelDisabled: true,
        ok: () => {
          confirmDialogStore.hide();
        },
      });
      return;
    }
    state.openRewardModal = true;
  };

  const RewardView = () => {
    return (
      <div>
        <div className="text-center pb-6 md:pb-8 mt-5 md:mt-8">
          <div>
            <Button onClick={reward}>打赏作者</Button>
          </div>
          {noReward && (
            <div className="mt-3 md:mt-5 text-gray-af pb-0 md:pb-5">
              还没有人打赏，来支持一下作者吧！
            </div>
          )}
        </div>
        {!noReward && <RewardSummary summary={state.rewardSummary} />}
      </div>
    );
  };

  const subscribe = async () => {
    try {
      await subscriptionApi.subscribe(post.author.address);
      post.author.following = true;
      post.author.summary.follower.count += 1;
    } catch (err) {
      console.log(err);
    }
  };

  const unsubscribe = async () => {
    try {
      await subscriptionApi.unsubscribe(post.author.address);
      post.author.following = false;
      post.author.summary.follower.count -= 1;
    } catch (err) {
      console.log(err);
    }
  };

  const AuthorInfoView = (author: any) => {
    return (
      <div className="md:mb-12 md:-mt-3">
        <div
          className={classNames(
            {
              'p-5': isPc,
              'p-3': isMobile,
            },
            'flex justify-between bg-gray-f7 rounded-8 border border-gray-d8 border-opacity-75',
          )}
        >
          <div className="flex items-center">
            <Link to={`/authors/${author.address}`}>
              <Img
                className={classNames(
                  {
                    'mr-6': isPc,
                    'mr-3': isMobile,
                  },
                  'w-12 h-12 rounded-full',
                )}
                src={author.avatar}
                alt={author.nickname}
              />
            </Link>
            <div className="text-gray-9b">
              <div
                className={classNames(
                  {
                    'md:flex-row md:items-center': author.bio,
                  },
                  'mr-8 flex flex-col',
                )}
              >
                <div
                  className={classNames(
                    {
                      'text-base': isPc,
                    },
                    'flex items-center mt-1 md:mt-0',
                  )}
                >
                  <Link to={`/authors/${author.address}`}>
                    <span className="text-gray-88 font-bold mr-0 md:mr-4 truncate block author-view-nickname">
                      {author.nickname}
                    </span>
                  </Link>
                </div>
                {author.summary && (
                  <div className="text-13 mt-1 md:mt-0 flex items-center">
                    {author.summary.post.count} 篇文章
                    {Number(author.summary.follower.count) > 0 && <span className="mx-1">·</span>}
                    {Number(author.summary.follower.count) > 0 && (
                      <span>{author.summary.follower.count} 人关注</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                {author.bio && (
                  <div className="mt-1 truncate hidden md:block w-400-px">{author.bio}</div>
                )}
              </div>
            </div>
          </div>
          {!isMyself && (
            <div className="ml-3 mt-3">
              {author.following ? (
                <Button onClick={unsubscribe} size="small" outline>
                  已关注
                </Button>
              ) : (
                <Button onClick={subscribe} size="small">
                  关注
                </Button>
              )}
            </div>
          )}
        </div>
        <style jsx>{`
          .author-view-nickname {
            max-width: 150px;
          }
        `}</style>
      </div>
    );
  };

  const CommentView = () => {
    return (
      <div className="pb-10" ref={infiniteRef}>
        <Comment
          isMyself={isMyself}
          authorAddress={post.author.address}
          fileRId={post.rId}
          alwaysShowCommentEntry
          tryVote={() => {
            post.voted ? resetVote(post.rId) : createVote(post.rId);
          }}
          tryFavorite={() => {
            post.favorite ? unfavorite(post.rId) : favorite(post.rId);
          }}
        />
        {state.isFetchedComments && state.isFetchingComments && (
          <div className="pb-12 md:pb-0 md:pt-10">
            <Loading />
          </div>
        )}
      </div>
    );
  };

  const createVote = async (rId: string) => {
    if (state.posting) {
      return;
    }
    state.posting = true;
    try {
      const { upVotesCount, voted } = await Api.createVote({
        objectType: 'posts',
        objectId: rId,
        type: 'UP',
      });
      feedStore.updatePost(post.rId, {
        upVotesCount,
        voted,
      });
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '文章已经被作者删除了',
          type: 'error',
        });
      }
      console.log(err);
    }
    state.posting = false;
  };

  const resetVote = async (rId: string) => {
    if (state.posting) {
      return;
    }
    state.posting = true;
    try {
      const { upVotesCount, voted } = await Api.deleteVote({
        objectType: 'posts',
        objectId: rId,
      });
      feedStore.updatePost(post.rId, {
        upVotesCount,
        voted,
      });
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '文章已经被作者删除了',
          type: 'error',
        });
      }
      console.log(err);
    }
    state.posting = false;
  };

  const favorite = async (rId: string) => {
    if (state.posting) {
      return;
    }
    state.posting = true;
    try {
      await postApi.favorite(rId);
      feedStore.updatePost(post.rId, {
        favorite: true,
      });
      await sleep(100);
      snackbarStore.show({
        message: '已添加到收藏夹',
      });
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '文章已经被作者删除了',
          type: 'error',
        });
      }
      console.log(err);
    }
    state.posting = false;
  };

  const unfavorite = async (rId: string) => {
    if (state.posting) {
      return;
    }
    state.posting = true;
    try {
      await postApi.unfavorite(rId);
      feedStore.updatePost(post.rId, {
        favorite: false,
      });
    } catch (err) {
      if (err.status === 404) {
        snackbarStore.show({
          message: '文章已经被作者删除了',
          type: 'error',
        });
      }
      console.log(err);
    }
    state.posting = false;
  };

  const VoteView = (post: IPost) => {
    return (
      <div
        className={classNames(
          {
            'border-blue-400 active': post.voted,
            'border-gray-400': !post.voted,
            'badge-visible': Number(post.upVotesCount) > 0,
          },
          'badge rounded-full border flex justify-center items-center cursor-pointer small-icon-badge w-10 h-10',
        )}
        onClick={() => {
          post.voted ? resetVote(post.rId) : createVote(post.rId);
        }}
      >
        <Badge badgeContent={Number(post.upVotesCount) || 0} invisible={!Number(post.upVotesCount)}>
          <div
            className={classNames(
              {
                'text-blue-400': post.voted,
                'text-gray-600': !post.voted,
              },
              'flex items-center text-xl transform scale-90',
            )}
          >
            <FontAwesomeIcon icon={faThumbsUp} />
          </div>
        </Badge>
      </div>
    );
  };

  const CommentButtonView = () => {
    return (
      <div
        className={classNames(
          {
            'mt-6': isPc,
            'badge-visible': Number(commentStore.total) > 0,
          },
          'border-gray-400 w-10 h-10 rounded-full border flex justify-center items-center badge small-icon-badge cursor-pointer relative',
        )}
        onClick={() => {
          const textField = document.getElementById('comment-text-field');
          if (textField) {
            textField.scrollIntoView();
            textField.focus();
          }
        }}
      >
        <Badge
          badgeContent={Number(commentStore.total) || 0}
          invisible={!state.isFetchedComments || !Number(commentStore.total)}
        >
          <div className={classNames('text-gray-600 flex items-center text-xl')}>
            <FontAwesomeIcon icon={faCommentDots} />
          </div>
        </Badge>
      </div>
    );
  };

  const FavoriteButtonView = () => {
    return (
      <div
        className={classNames(
          {
            'border-yellow-500 active': post.favorite,
            'border-gray-400': !post.favorite,
          },
          'mt-6 rounded-full border flex justify-center items-center cursor-pointer w-10 h-10',
        )}
        onClick={() => {
          post.favorite ? unfavorite(post.rId) : favorite(post.rId);
        }}
      >
        <div
          className={classNames(
            {
              'text-yellow-500': post.favorite,
              'text-gray-600': !post.favorite,
            },
            'flex items-center text-xl transform scale-90 ml-1-px',
          )}
        >
          <FontAwesomeIcon icon={post.favorite ? faSolidStar : faStar} />
        </div>
      </div>
    );
  };

  const ShareButtonView = () => {
    return (
      <div
        className={classNames(
          {
            'mt-6': isPc,
          },
          'border-gray-400 w-10 h-10 rounded-full border flex justify-center items-center badge small-icon-badge cursor-pointer',
        )}
        aria-describedby="share-qrcode"
        onClick={(event) => {
          state.anchorEl = state.anchorEl ? null : event.currentTarget;
        }}
      >
        <div className={classNames('text-gray-600 flex items-center text-xl')}>
          <ShareIcon />
        </div>
        <Popover
          id="share-qrcode"
          open={!!state.anchorEl}
          anchorEl={state.anchorEl}
          anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: -20 }}
        >
          <div style={{ width: '250px', height: '285px' }}>
            <div style={{ color: '#8b8b8b' }} className="text-xs text-right mt-2 mr-3">
              关闭
            </div>
            <div className="text-gray-700 text-center font-bold mt-2">微信分享</div>
            <div className="flex justify-center mt-5">
              <QRCode size={136} value={window.location.href} />
            </div>
            <div className="text-gray-700 text-center font-normal mt-4">打开微信扫一扫</div>
            <div className="text-gray-700 text-center font-normal">
              再点击手机屏幕右上角分享按钮
            </div>
          </div>
        </Popover>
      </div>
    );
  };

  const Menu = () => (
    <Fade in={true} timeout={500}>
      <div>
        <div className="absolute top-0 right-0 -mt-16 z-10 pt-1">
          <div
            className={classNames(
              {
                'pl-8': !isLogin,
                'pl-4': isLogin,
              },
              'px-4 text-gray-88 text-28 flex items-center h-10 pt-2 py-0 bg-white pb-2',
            )}
            onClick={() => (state.showMenu = true)}
          >
            <MoreHoriz />
          </div>
        </div>
        <DrawerMenu
          open={state.showMenu}
          onClose={() => {
            state.showMenu = false;
          }}
          items={[
            {
              name: '分享',
              onClick: () => {
                copy(window.location.href);
                snackbarStore.show({
                  message: '链接已复制',
                });
              },
            },
            {
              invisible: !isMyself,
              name: '编辑',
              onClick: () => {
                props.history.push(`/editor?id=${post.fileId}`);
              },
            },
            {
              invisible: !isMyself,
              name: '投稿',
              onClick: () => {
                modalStore.openTopicList({
                  post,
                  userAddress: userStore.user.address,
                  title: '开放投稿的专题',
                  type: 'CONTRIBUTION_TO_PUBLIC_TOPICS',
                  onClose: async () => {
                    try {
                      const updatedPost: IPost = await postApi.fetchPost(post.rId, {
                        withPendingTopicUuids: true,
                      });
                      setPost(updatedPost);
                    } catch (err) {
                      console.log(err);
                    }
                  },
                });
              },
            },
            {
              invisible: !isMyself,
              name: '隐藏',
              onClick: () => {
                confirmDialogStore.show({
                  content: '隐藏后的文章对他人不可见',
                  ok: async () => {
                    try {
                      await fileApi.hideFile(post.fileId);
                      confirmDialogStore.hide();
                      await sleep(100);
                      state.showMenu = false;
                      await sleep(200);
                      feedStore.clear();
                      feedStore.setFilterType('LATEST');
                      props.history.push(`/authors/${userStore.user.address}`);
                      await sleep(200);
                      snackbarStore.show({
                        message: '文章已经隐藏，已经放到草稿箱',
                      });
                    } catch (err) {
                      snackbarStore.show({
                        message: '隐藏失败',
                        type: 'error',
                      });
                    }
                  },
                });
              },
              stayOpenAfterClick: true,
            },
            {
              invisible: !isMyself,
              name: '删除',
              onClick: () => {
                confirmDialogStore.show({
                  content: '删除后无法找回，确定删除吗？',
                  ok: async () => {
                    try {
                      await fileApi.deleteFile(post.fileId);
                      confirmDialogStore.hide();
                      await sleep(100);
                      state.showMenu = false;
                      await sleep(200);
                      feedStore.clear();
                      feedStore.setFilterType('LATEST');
                      props.history.push(`/authors/${userStore.user.address}`);
                      await sleep(200);
                      snackbarStore.show({
                        message: '文章已经删除',
                      });
                    } catch (err) {
                      snackbarStore.show({
                        message: '删除失败',
                        type: 'error',
                      });
                    }
                  },
                });
              },
              className: 'text-red-400',
              stayOpenAfterClick: true,
            },
          ]}
        />
      </div>
    </Fade>
  );

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="px-4 md:px-0 md:w-7/12 m-auto relative post-page">
        <div className="hidden md:block fixed">
          <BackButton className="-ml-40" />
        </div>
        {isPc && state.showExtra && (
          <Fade in={true} timeout={500}>
            <div className="absolute top-0 left-0 -ml-24 mt-24">
              <div className="fixed -ml-8">
                {VoteView(post)}
                {CommentButtonView()}
                {FavoriteButtonView()}
                {!settingsStore.settings['permission.isPrivate'] && ShareButtonView()}
              </div>
            </div>
          </Fade>
        )}
        {isMobile && Menu()}
        <h2 className={`text-xl md:text-2xl text-gray-900 font-bold pt-0 pb-0`}>{post.title}</h2>
        <div className="flex items-center justify-between mt-2">
          <div className={`flex items-center gray info ${isMobile ? ' text-sm' : ''}`}>
            <Link to={`/authors/${post.author.address}`}>
              <div className="flex items-center">
                <div className="flex items-center w-6 h-6 mr-2">
                  <Img
                    className="w-6 h-6 rounded-full border border-gray-300"
                    src={post.author.avatar}
                    alt={post.author.nickname}
                  />
                </div>
                <span className={classNames({ 'name-max-width': isMobile }, 'mr-5 truncate')}>
                  {post.author.nickname}
                </span>
              </div>
            </Link>
            <span className="mr-5">{ago(post.pubDate)}</span>
            {(localStorage.getItem('VIEW_COUNT_ENABLED') ||
              settingsStore.settings.extra['postView.visible']) && (
              <span className="mr-5">阅读 {post.viewCount}</span>
            )}
            {isMyself && !isMobile && <Link to={`/editor?id=${post.fileId}`}>编辑</Link>}
          </div>
        </div>
        <div
          id="post-content"
          className={`mt-3 md:mt-4 text-base md:text-lg markdown-body pb-6 px-2 md:px-0 overflow-hidden`}
          dangerouslySetInnerHTML={{ __html: postHTMLContent }}
        />
        <div className="mt-1 pb-2 px-2 md:px-0">
          <div className="border-l-4 border-blue-400 pl-3 text-gray-9b mt-2 md:mt-0">
            {post.topics && post.topics.length > 0 && '被以下专题收录'}
            <div>
              {(!post.topics || post.topics.length === 0) &&
                (isMyself || !post.author.privateContributionEnabled) && (
                  <div className="flex items-center">
                    收录到我的专题
                    <div className="ml-3">
                      <IncludedButton post={post as IPost} onClose={() => syncTopics()} />
                    </div>
                  </div>
                )}
            </div>
          </div>
          <div className="pt-2 pb-5 md:pb-0">
            <TopicLabels
              topics={post.topics || []}
              post={post}
              showContributionButton={isMyself || !post.author.privateContributionEnabled}
              maxListCount={isMobile ? 1 : 10}
              onClose={() => syncTopics()}
            />
          </div>
        </div>
        {isPc && post.content.length > 100 && <BackToTop />}
        {state.isFetchedReward && state.isFetchedComments && (
          <div>
            <div
              className={classNames({
                invisible: !state.showExtra,
              })}
            >
              {post.paymentUrl && RewardView()}
              {!post.paymentUrl && <div className="pt-6" />}
              {post && post.author && !isMyself && AuthorInfoView(post.author)}
              {CommentView()}
            </div>
            <RewardModal
              open={state.openRewardModal}
              onClose={onCloseRewardModal}
              toAddress={post.author.address}
              toAuthor={post.author.nickname}
              fileRId={post.rId}
            />
          </div>
        )}
        {(!state.isFetchedReward || !state.isFetchedComments) && renderLoading()}
        <div
          ref={ref}
          className={classNames(
            {
              hidden: !isMobile || !state.showImage,
            },
            'mobile-viewer-container fixed bg-black',
          )}
          onClick={() => showImageView(false)}
        ></div>
        <Viewer
          className={isMobile ? 'mobile-viewer' : ''}
          onMaskClick={() => showImageView(false)}
          noNavbar={true}
          noToolbar={true}
          visible={state.showImage}
          onClose={() => showImageView(false)}
          images={[{ src: state.imgSrc }]}
          container={isMobile && !!ref.current ? ref.current : undefined}
          noClose={isMobile}
        />
        <style jsx>{`
          .name-max-width {
            max-width: 115px;
          }
          .gray {
            color: #aea9ae;
          }
          .post-page :global(.small-icon-badge .MuiBadge-root) {
            width: 17px;
          }
          .post-page :global(.badge-visible .MuiBadge-anchorOriginTopRightRectangle) {
            transform: scale(0.9) translate(50%, -50%);
          }
          .post-page :global(.small-icon-badge .MuiBadge-badge) {
            top: -6px;
          }
          .post-page :global(.large-icon-badge .MuiBadge-badge) {
            top: -8px;
          }
          .post-page :global(.badge .MuiBadge-badge) {
            right: -8px;
            color: #fff;
            background: #66758b;
          }
          .post-page :global(.badge.active .MuiBadge-badge) {
            color: #fff;
            background: #63b3ed;
          }
          .post-page .markdown-body {
            font-size: 16px;
          }
        `}</style>
      </div>
    </Fade>
  );
});
