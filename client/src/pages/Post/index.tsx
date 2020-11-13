import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Viewer from 'react-viewer';
import marked from 'marked';
import BackButton from 'components/BackButton';
import Button from 'components/Button';
import Loading from 'components/Loading';
import ButtonOutlined from 'components/ButtonOutlined';
import TopicLabels, { IncludedButton } from 'components/TopicLabels';
import Fade from '@material-ui/core/Fade';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ThumbUp from '@material-ui/icons/ThumbUp';
import CommentIcon from '@material-ui/icons/Comment';
import ShareIcon from '@material-ui/icons/Share';
import Badge from '@material-ui/core/Badge';
import classNames from 'classnames';
import RewardSummary from './rewardSummary';
import RewardModal from './rewardModal';

import CommentApi from 'apis/comment';
import Comment from './comment';
import { IPost } from 'apis/post';
import postApi from 'apis/post';
import subscriptionApi from 'apis/subscription';
import { useStore } from 'store';
import { ago, isPc, isMobile, sleep, initMathJax, getQuery } from 'utils';
import FeedApi from './api';
import Api from 'api';
import Popover from '@material-ui/core/Popover';
import QRCode from 'qrcode.react';
import Img from 'components/Img';

import 'react-viewer/dist/index.css';
import './github.css';

marked.setOptions({
  highlight: (code: string) => {
    return require('highlight.js').highlightAuto(code).value;
  },
});

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
  const [isFetchedPost, setIsFetchedPost] = React.useState(false);
  const [showExtra, setShowExtra] = React.useState(false);
  const [voting, setVoting] = React.useState(false);
  const [showImage, setShowImage] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState('');
  const [openRewardModal, setOpenRewardModal] = React.useState(false);
  const [isFetchedReward, setIsFetchedReward] = React.useState(false);
  const [rewardSummary, setRewardSummary] = React.useState({ amountMap: {}, users: [] });
  const [isFetchedComments, setIsFetchedComments] = React.useState(false);
  const [isBan, setIsBan] = React.useState(false);
  const noReward = rewardSummary.users.length === 0;
  const { rId } = props.match.params;
  const [anchorEl, setAnchorEl] = React.useState(null as any);
  const isMyself = React.useMemo(
    () => post && post.author && user.address === post.author.address,
    [user.address, post],
  );

  React.useEffect(() => {
    if (isFetchedPost) {
      (async () => {
        await sleep(200);
        setShowExtra(true);
      })();
    }
  }, [isFetchedPost]);

  React.useEffect(() => {
    const commentId = getQuery('commentId');
    if (commentId) {
      modalStore.openPageLoading();
    }
  }, [modalStore]);

  React.useEffect(() => {
    setRewardSummary({ amountMap: {}, users: [] });
  }, [rId, commentStore]);

  React.useEffect(() => {
    (async () => {
      try {
        const post: IPost = await postApi.fetchPost(rId);
        if (post.latestRId) {
          window.location.replace(`/posts/${post.latestRId}${window.location.search}`);
          return;
        }
        document.title = post.title;
        setPost(post);
        initMathJax(document.getElementById('post-content'));
      } catch (err) {
        modalStore.closePageLoading();
        setIsBan(err.message === 'Post has been deleted');
      }
      setIsFetchedPost(true);
    })();
  }, [rId, setPost, modalStore]);

  const syncTopics = async () => {
    try {
      const resPost: IPost = await postApi.fetchPost(rId);
      post.topics = resPost.topics || [];
    } catch (err) {}
  };

  React.useEffect(() => {
    (async () => {
      try {
        const rewardSummary = await FeedApi.getRewardSummary(rId);
        setRewardSummary(rewardSummary);
      } catch (err) {}
      setIsFetchedReward(true);
    })();
  }, [rId]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const bindClickEvent = (e: any) => {
      if (e.target.tagName === 'A') {
        const href = e.target.getAttribute('href');
        window.open(href);
        e.preventDefault();
      } else if (e.target.tagName === 'IMG') {
        if (isMobile) {
          return;
        }
        setImgSrc(e.target.src);
        setShowImage(true);
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
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const pagination = {
          offset: 0,
          limit: '1000',
        };
        const res = await CommentApi.list(rId, pagination);
        commentStore.setTotal(res['total']);
        commentStore.setComments(res['comments']);
        setIsFetchedComments(true);
      } catch (err) {
        console.log(err);
      }
    })();
  }, [commentStore, rId]);

  if (userStore.shouldLogin) {
    return null;
  }

  if (!ready || !isFetchedPost) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

  if (isBan || !post) {
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
    setOpenRewardModal(false);
    if (isSuccess) {
      await sleep(200);
      const rewardSummary = await FeedApi.getRewardSummary(rId);
      setRewardSummary(rewardSummary);
    }
  };

  const backToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      window.scroll(0, 0);
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
    setOpenRewardModal(true);
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
        {!noReward && <RewardSummary summary={rewardSummary} />}
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
      <div className="pb-10">
        <Comment
          fileRId={post.rId}
          alwaysShowCommentEntry
          tryVote={() => {
            post.voted ? resetVote(post.rId) : createVote(post.rId);
          }}
        />
      </div>
    );
  };

  const createVote = async (rId: string) => {
    if (voting) {
      return;
    }
    setVoting(true);
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
    setVoting(false);
  };

  const resetVote = async (rId: string) => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    if (voting) {
      return;
    }
    setVoting(true);
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
    setVoting(false);
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
            <ThumbUp />
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
          invisible={!isFetchedComments || !Number(commentStore.total)}
        >
          <div className={classNames('text-gray-600 flex items-center text-xl')}>
            <CommentIcon />
          </div>
        </Badge>
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
          setAnchorEl(anchorEl ? null : event.currentTarget);
        }}
      >
        <div className={classNames('text-gray-600 flex items-center text-xl')}>
          <ShareIcon />
        </div>
        <Popover
          id="share-qrcode"
          open={!!anchorEl}
          anchorEl={anchorEl}
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

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="px-4 md:px-0 md:w-7/12 m-auto relative post-page">
        <div className="hidden md:block fixed">
          <BackButton history={props.history} />
        </div>
        {isPc && showExtra && (
          <Fade in={true} timeout={500}>
            <div className="absolute top-0 left-0 -ml-24 mt-24">
              <div className="fixed -ml-8">
                {VoteView(post)}
                {CommentButtonView()}
                {ShareButtonView()}
              </div>
            </div>
          </Fade>
        )}
        <h2 className={`text-xl md:text-2xl text-gray-900 md:font-bold pt-0 pb-0`}>{post.title}</h2>
        <div className={`flex items-center gray mt-2 info ${isMobile ? ' text-sm' : ''}`}>
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
          {isMyself && !isMobile && <Link to={`/editor?rId=${post.rId}`}>编辑</Link>}
        </div>
        <div
          id="post-content"
          className={`mt-3 md:mt-4 text-base md:text-lg markdown-body pb-6 px-2 md:px-0 overflow-hidden`}
          dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }}
        />
        <div className="mt-1 pb-2 px-2 md:px-0">
          <div className="border-l-4 border-blue-400 pl-3 text-gray-9b mt-2 md:mt-0">
            {post.topics && post.topics.length > 0 && '被以下专题收录'}
            <div>
              {(!post.topics || post.topics.length === 0) && (
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
              showContributionButton
              maxListCount={isMobile ? 1 : 10}
              onClose={() => syncTopics()}
            />
          </div>
        </div>
        {post.content.length > 100 && (
          <div className="hidden md:block">
            {
              <div
                className="fixed bottom-0 right-0 mr-20 mb-12 cursor-pointer"
                onClick={backToTop}
              >
                <ButtonOutlined>
                  <div className="text-xl">
                    <ArrowUpward />
                  </div>
                </ButtonOutlined>
              </div>
            }
          </div>
        )}
        {isFetchedReward && isFetchedComments && (
          <div>
            <div
              className={classNames({
                invisible: !showExtra,
              })}
            >
              {post.paymentUrl && RewardView()}
              {!post.paymentUrl && <div className="pt-6" />}
              {post && post.author && !isMyself && AuthorInfoView(post.author)}
              {CommentView()}
            </div>
            <RewardModal
              open={openRewardModal}
              onClose={onCloseRewardModal}
              toAddress={post.author.address}
              toAuthor={post.author.nickname}
              fileRId={post.rId}
            />
          </div>
        )}
        {(!isFetchedReward || !isFetchedComments) && renderLoading()}
        <Viewer
          onMaskClick={() => setShowImage(false)}
          noNavbar={true}
          noToolbar={true}
          visible={showImage}
          onClose={() => setShowImage(false)}
          images={[{ src: imgSrc }]}
        />
        <style jsx>{`
          .name-max-width {
            max-width: 115px;
          }
          .gray {
            color: #aea9ae;
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
            color: #333;
            font-size: 16px;
            line-height: 1.65;
            font-family: -apple-system-font, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC',
              'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', Arial, sans-serif;
          }
        `}</style>
      </div>
    </Fade>
  );
});
