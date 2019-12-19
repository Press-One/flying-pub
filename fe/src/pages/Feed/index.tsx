import React from 'react';
import { observer } from 'mobx-react-lite';
import debounce from 'lodash.debounce';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import Loading from 'components/Loading';
import Posts from 'components/Posts';
import Filter from './Filter';
import { isMobile, getPostSelector, sleep } from 'utils';
import Api from 'api';

export default observer(() => {
  const { feedStore, cacheStore, settingsStore } = useStore();
  const [enableFilterScroll, setEnableFilterScroll] = React.useState(false);

  React.useEffect(() => {
    const { title } = feedStore.feed;
    if (title) {
      document.title = `${title} - 飞帖`;
    }
  });

  React.useEffect(() => {
    if (feedStore.isFetched) {
      (async () => {
        try {
          const { posts } = await Api.fetchPosts();
          feedStore.setPostExtraMap(posts);
        } catch (err) {
          console.log(err);
        }
      })();
    }
  }, [feedStore]);

  const restoreScrollPosition = (feedScrollTop: number, postId: string) => {
    if (feedScrollTop === 0 && postId) {
      const postDom: any = document.querySelector(`#${getPostSelector(postId)}`);
      if (!postDom) {
        return;
      }
      const restoreTop = postDom!.offsetTop - window.innerHeight / 2 + 100;
      window.scroll(0, restoreTop);
    } else {
      window.scroll(0, feedScrollTop);
    }
  };

  React.useEffect(() => {
    setEnableFilterScroll(false);
    const { feedScrollTop } = cacheStore;
    const { postId } = feedStore;
    restoreScrollPosition(feedScrollTop, postId);
    const debounceScroll = debounce(() => {
      const scrollElement = document.scrollingElement || document.documentElement;
      const scrollTop = scrollElement.scrollTop;
      const triggerBottomPosition = scrollElement.scrollHeight - window.innerHeight;
      if (triggerBottomPosition - scrollTop < 500) {
        feedStore.loadMore();
      }
      cacheStore.setFeedScrollTop(scrollTop);
    }, 300);
    window.addEventListener('scroll', debounceScroll);

    (async () => {
      await sleep(200);
      setEnableFilterScroll(true);
    })();

    return () => {
      window.removeEventListener('scroll', debounceScroll);
      setEnableFilterScroll(false);
    };
  }, [feedStore, cacheStore]);

  if (!feedStore.isFetched) {
    return null;
  }

  const { hasMore, pagePosts, postExtraMap, isChangingOrder, blockMap, order } = feedStore;
  const { settings } = settingsStore;
  const hasPosts = pagePosts.length > 0;

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="md:w-7/12 m-auto pb-10 pt-3">
        <div>
          <h1
            className={`p-0 font-bold text-center text-gray-700 leading-relaxed text-${
              isMobile ? '2xl' : '3xl'
            }`}
          >
            {settings['site.title']}
          </h1>
          <div className="mt-2 w-16 m-auto border-b border-gray-500" />
          <div className="text-gray-600 text-center mt-3 text-base">{settings['site.slogan']}</div>
        </div>
        <Filter enableScroll={enableFilterScroll} />
        <div className="min-h-screen">
          {!isChangingOrder && hasPosts && (
            <Posts posts={pagePosts} postExtraMap={postExtraMap} blockMap={blockMap} />
          )}
          {isChangingOrder && (
            <div className="pt-40">
              <Loading size={24} />
            </div>
          )}
          {!isChangingOrder && hasMore && (
            <div className="mt-10">
              <Loading size={24} />
            </div>
          )}
          {!isChangingOrder && !hasPosts && order === 'SUBSCRIPTION' && (
            <div className="pt-32 text-center text-gray-500">
              <div className="pt-4">去关注你感兴趣的作者吧！</div>
              <div className="mt-2">
                只需两步：点作者头像或昵称{' '}
                <span role="img" aria-label="then">
                  👉
                </span>{' '}
                点关注
              </div>
            </div>
          )}
          {!isChangingOrder && !hasPosts && order !== 'SUBSCRIPTION' && (
            <div className="pt-32 text-center text-gray-500">
              <div className="pt-4">暂无文章</div>
            </div>
          )}
        </div>
      </div>
    </Fade>
  );
});
