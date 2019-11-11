import React from 'react';
import { observer } from 'mobx-react-lite';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import Viewer from 'react-viewer';
import marked from 'marked';
import WaitingForFeed from 'components/WaitingForFeed';
import BackButton from 'components/BackButton';
import Button from 'components/Button';
import Loading from 'components/Loading';
import ButtonOutlined from 'components/ButtonOutlined';
import Fade from '@material-ui/core/Fade';
import RewardSummary from './rewardSummary';
import RewardModal from './rewardModal';
import Comment from './comment';
import { useStore } from 'store';
import { ago, isMobile, sleep } from 'utils';
import Api from './api';

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
  const [isFetchingReward, setIsFetchingReward] = React.useState(false);
  const [toAddress, setToAddress] = React.useState('');
  const [authorMixinClientId, setAuthorMixinClientId] = React.useState('');
  const [rewardSummary, setRewardSummary] = React.useState({ amountMap: {}, users: [] });
  const noReward = rewardSummary.users.length === 0;

  React.useEffect(() => {
    (async () => {
      if (post) {
        // const blocks = await Api.getBlocks(post.id);
        // const block = blocks[0];
        // const toAddress = block.user_address;
        // const { payment_url } = JSON.parse(block.meta);
        // const mixinClientId = payment_url ? payment_url.split('/').pop() : '';
        const toAddress = 'b663b2310313fe3b0c3d3084f49f10ec088820ef';
        const mixinClientId = '983a4f11-b2f3-3370-a09c-d66b52840688';
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
      document.title = `${title} - 飞贴`;
    }
  });

  React.useEffect(() => {
    (async () => {
      if (post) {
        setIsFetchingReward(true);
        try {
          const rewardSummary = await Api.getRewardSummary(post.id);
          setRewardSummary(rewardSummary);
        } catch (err) {}
        setIsFetchingReward(false);
      }
    })();
  }, [post]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const bindClickEvent = (e: any) => {
      if (e.target.tagName === 'A') {
        const href = e.target.getAttribute('href');
        window.open(href);
        e.preventDefault();
      } else if (e.target.tagName === 'IMG') {
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
      const rewardSummary = await Api.getRewardSummary(post.id);
      setRewardSummary(rewardSummary);
    }
  };

  if (pending) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-64">
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
    if (isFetchingReward) {
      return (
        <div className="py-24">
          <Loading />
        </div>
      );
    }
    return (
      <div>
        <div className="text-center pb-6">
          <Button onClick={reward}>赞赏</Button>
          {noReward && (
            <div className="mt-5 text-gray-600 pb-5">还没有人赞赏，来支持一下作者吧！</div>
          )}
        </div>
        {!noReward && <RewardSummary summary={rewardSummary} />}
        {!noReward && <div className="pb-10" />}
      </div>
    );
  };

  const CommentView = () => {
    if (isFetchingReward) {
      return null;
    }
    return (
      <div className="pb-10">
        <Comment fileRId={post.id} />
      </div>
    );
  };

  return (
    <Fade in={true} timeout={500}>
      <div className="w-7/12 m-auto relative">
        {!isMobile && <BackButton />}
        <h2 className={`text-${isMobile ? 'lg' : '2xl'} text-gray-700 font-bold pt-0 pb-0`}>
          {post.title}
        </h2>
        <div className={`mt-1 text-gray-500 ${isMobile ? ' text-sm' : ''}`}>
          {post.author} | {ago(post.pubDate)}
        </div>
        <div
          className={`mt-6 text-lg text-black markdown-body pb-6`}
          dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }}
        />
        {!isMobile && post.content.length > 1500 && (
          <div className="fixed bottom-0 right-0 mr-10 mb-10 cursor-pointer" onClick={backToTop}>
            <ButtonOutlined>
              <div className="text-lg">
                <ArrowUpward />
              </div>
            </ButtonOutlined>
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
