import React from 'react';
import { observer } from 'mobx-react-lite';
import Viewer from 'react-viewer';
import marked from 'marked';
import WaitingForFeed from 'components/WaitingForFeed';
import BackButton from 'components/BackButton';
import Button from 'components/Button';
import Loading from 'components/Loading';
import ButtonOutlined from 'components/ButtonOutlined';
import Fade from '@material-ui/core/Fade';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ThumbUp from '@material-ui/icons/ThumbUp';
import Badge from '@material-ui/core/Badge';
import classNames from 'classnames';
import { getPostId } from 'store/feed';
import RewardSummary from './rewardSummary';
import RewardModal from './rewardModal';
import Comment from './comment';
import { useStore } from 'store';
import { ago, isPc, isMobile, sleep } from 'utils';
import FeedApi from './api';
import Api from 'api';

import 'react-viewer/dist/index.css';
import './github.css';

marked.setOptions({
  highlight: (code: string) => {
    return require('highlight.js').highlightAuto(code).value;
  },
});

export default observer((props: any) => {
  const { feedStore, userStore, modalStore } = useStore();
  const { isLogin } = userStore;
  const { currentPost: post, isFetched: isFetchedFeed } = feedStore;
  const [pending, setPending] = React.useState(true);
  const [showImage, setShowImage] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState('');
  const [openRewardModal, setOpenRewardModal] = React.useState(false);
  const [isFetchedReward, setIsFetchedReward] = React.useState(false);
  const [toAddress, setToAddress] = React.useState('');
  const [authorMixinClientId, setAuthorMixinClientId] = React.useState('');
  const [rewardSummary, setRewardSummary] = React.useState({ amountMap: {}, users: [] });
  const noReward = rewardSummary.users.length === 0;

  React.useEffect(() => {
    (async () => {
      if (post) {
        const blocks = await FeedApi.getBlocks(post.id);
        const block = blocks[0];
        const toAddress = block.user_address;
        const { payment_url } = JSON.parse(block.meta);
        const mixinClientId = payment_url ? payment_url.split('/').pop() : '';
        setToAddress(toAddress);
        setAuthorMixinClientId(mixinClientId);
      }
    })();
  }, [post]);

  React.useEffect(() => {
    (async () => {
      if (isFetchedFeed) {
        await sleep(800);
        setPending(false);
      }
    })();
  }, [isFetchedFeed]);

  React.useEffect(() => {
    const { postId } = props.match.params;
    feedStore.setPostId(decodeURIComponent(postId));
  }, [props, feedStore]);

  React.useEffect(() => {
    if (post) {
      const { title } = post;
      document.title = `${title} - 飞帖`;
    }
  });

  React.useEffect(() => {
    (async () => {
      if (post && post.id === props.match.params.postId) {
        try {
          const rewardSummary = await FeedApi.getRewardSummary(post.id);
          setRewardSummary(rewardSummary);
        } catch (err) {}
        setIsFetchedReward(true);
      }
    })();
  }, [post, props]);

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

  const onCloseRewardModal = async (isSuccess: boolean) => {
    setOpenRewardModal(false);
    if (isSuccess) {
      await sleep(800);
      const rewardSummary = await FeedApi.getRewardSummary(post.id);
      setRewardSummary(rewardSummary);
    }
  };

  if (!feedStore.isFetched) {
    return null;
  }

  if (pending) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

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
    setOpenRewardModal(true);
  };

  if (!post) {
    return <WaitingForFeed />;
  }

  const RewardView = () => {
    if (!isFetchedReward) {
      return (
        <div className="py-24">
          <Loading />
        </div>
      );
    }
    return (
      <div>
        <div className="text-center pb-6 md:mt-5">
          <div className="hidden md:block">
            <Button onClick={reward}>赞赏</Button>
          </div>
          {noReward && (
            <div className="mt-5 text-gray-600 pb-5">还没有人赞赏，来支持一下作者吧！</div>
          )}
        </div>
        {!noReward && <RewardSummary summary={rewardSummary} />}
        {!noReward && <div className="mt-8 pb-4 md:border-none border-t border-gray-300" />}
      </div>
    );
  };

  const CommentView = () => {
    if (!isFetchedReward) {
      return null;
    }
    return (
      <div className="pb-10">
        <Comment fileRId={post.id} />
      </div>
    );
  };

  const createVote = async (postId: string) => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    const post = await Api.createVote({
      objectType: 'posts',
      objectId: postId,
      type: 'UP',
    });
    feedStore.updatePostExtraMap(post.fileRId, post);
  };

  const resetVote = async (postId: string) => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    const post = await Api.deleteVote({
      objectType: 'posts',
      objectId: postId,
    });
    feedStore.updatePostExtraMap(post.fileRId, post);
  };

  const VoteView = (postId: string, extra: any = {}) => {
    return (
      <div
        className={classNames(
          {
            'border-blue-400 active': extra.voted,
            'border-gray-400': !extra.voted,
          },
          'w-12 h-12 rounded-full border flex justify-center items-center like-badge cursor-pointer',
        )}
        onClick={() => {
          extra.voted ? resetVote(postId) : createVote(postId);
        }}
      >
        <Badge badgeContent={extra.upVotesCount || 0} invisible={!extra.upVotesCount}>
          <div
            className={classNames(
              {
                'text-blue-400': extra.voted,
                'text-gray-600': !extra.voted,
              },
              'flex items-center text-xl',
            )}
          >
            <ThumbUp />
          </div>
        </Badge>
      </div>
    );
  };

  const { postExtraMap } = feedStore;
  const extra: any = postExtraMap[getPostId(post)] || {};

  return (
    <Fade in={true} timeout={500}>
      <div className="px-3 md:px-0 md:w-7/12 m-auto relative">
        <div className="hidden md:block">
          <BackButton />
        </div>
        {isPc && (
          <div className="absolute top-0 left-0 -ml-24 mt-24">{VoteView(post.id, extra)}</div>
        )}
        <h2 className={`text-xl md:text-2xl text-gray-900 md:font-bold pt-0 pb-0`}>{post.title}</h2>
        <div className={`flex items-center gray mt-2 info ${isMobile ? ' text-sm' : ''}`}>
          <div className="flex items-center w-6 h-6 mr-2">
            <img className="w-6 h-6 rounded-full" src={post.attributes.avatar} alt={post.author} />
          </div>
          <span className="mr-5">{post.author}</span>
          <span className="mr-5">{ago(post.pubDate)}</span>
        </div>
        <style jsx>{`
          .gray {
            color: #aea9ae;
          }
          :global(.like-badge .MuiBadge-badge) {
            top: -8px;
            right: -8px;
            color: #fff;
            background: #66758b;
          }
          :global(.like-badge.active .MuiBadge-badge) {
            color: #fff;
            background: #63b3ed;
          }
        `}</style>
        <div
          className={`mt-6 text-base md:text-lg text-black markdown-body pb-6`}
          dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }}
        />
        <div className="hidden md:block">
          {
            <div className="fixed bottom-0 right-0 mr-10 mb-10 cursor-pointer" onClick={backToTop}>
              <ButtonOutlined>
                <div className="text-xl">
                  <ArrowUpward />
                </div>
              </ButtonOutlined>
            </div>
          }
        </div>
        {isMobile && (
          <div className="flex items-center justify-center pt-5">
            <div className="flex justify-center mr-8">{VoteView(post.id, extra)}</div>
            <div
              className="text-white w-12 h-12 rounded-full border flex justify-center items-center like-badge cursor-pointer border-blue-400 text-base font-bold bg-blue-400"
              onClick={reward}
            >
              赏
            </div>
          </div>
        )}
        {authorMixinClientId && RewardView()}
        {CommentView()}
        <RewardModal
          open={openRewardModal}
          onClose={onCloseRewardModal}
          toAddress={toAddress}
          toAuthor={post.author}
          fileRId={post.id}
          toMixinClientId={authorMixinClientId}
        />
        <Viewer
          onMaskClick={() => setShowImage(false)}
          noNavbar={true}
          noToolbar={true}
          visible={showImage}
          onClose={() => setShowImage(false)}
          images={[{ src: imgSrc }]}
        />
      </div>
    </Fade>
  );
});
