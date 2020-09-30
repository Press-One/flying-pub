import React from 'react';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import Button from 'components/Button';
import Posts from 'components/Posts';
import Loading from 'components/Loading';
import BackButton from 'components/BackButton';
import debounce from 'lodash.debounce';
import Api from 'api';
import { sleep, isMobile, generateAvatar } from 'utils';

const authorView = (props: any = {}) => {
  const { author, subscribed, subscribe, unsubscribe, showSubscription } = props;
  return (
    <div className="flex flex-col items-center">
      <img
        className="w-16 h-16 rounded-full"
        src={author.avatar}
        alt={author.name}
        onError={(e: any) => {
          e.target.src = generateAvatar(author.name);
        }}
      />
      <div className="font-bold mt-3 text-base text-center px-8">{author.name}</div>
      {author.bio && (
        <div className="mt-2 text-gray-600 text-sm px-8 text-center pb-1">{author.bio}</div>
      )}
      {showSubscription && (
        <div className="mt-3 h-8">
          {subscribed ? (
            <Button onClick={unsubscribe} small color="gray">
              已关注
            </Button>
          ) : (
            <Button onClick={subscribe} small>
              关注
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default observer((props: any) => {
  const { authorStore, subscriptionStore, settingsStore, modalStore, userStore } = useStore();
  const { settings } = settingsStore;
  const [pending, setPending] = React.useState(false);
  const { author, subscribed, posts, hasMore } = authorStore;
  const { isLogin } = userStore;
  const { address } = props.match.params;

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    if (author.address === address) {
      return;
    }
    const fetchAuthorPosts = async () => {
      const { length, limit } = authorStore;
      const { posts } = await Api.fetchPosts('PUB_DATE', {
        address,
        offset: length,
        limit,
      });
      authorStore.addPosts(posts);
    };

    const fetchAuthor = async () => {
      try {
        const author = await Api.fetchAuthor(address);
        authorStore.setAuthor(author);
        document.title = author.name;
      } catch (err) {
        console.log(err);
      }
    };

    const fetchSubscription = async () => {
      try {
        await Api.fetchSubscription(address);
        authorStore.setSubscribed(true);
      } catch (err) {
        authorStore.setSubscribed(false);
      }
    };

    (async () => {
      setPending(true);
      authorStore.reset();
      await Promise.all([fetchAuthor(), fetchSubscription(), fetchAuthorPosts()]);
      await sleep(200);
      setPending(false);
    })();
  }, [author, address, authorStore]);

  React.useEffect(() => {
    // TODO: DRY
    const fetchAuthorPosts = async () => {
      const { length, limit } = authorStore;
      const { posts } = await Api.fetchPosts('PUB_DATE', {
        address,
        offset: length,
        limit,
      });
      authorStore.addPosts(posts);
    };

    const debounceScroll = debounce(() => {
      const scrollElement = document.scrollingElement || document.documentElement;
      const scrollTop = scrollElement.scrollTop;
      const triggerBottomPosition = scrollElement.scrollHeight - window.innerHeight;
      if (hasMore && triggerBottomPosition - scrollTop < 500) {
        fetchAuthorPosts();
      }
    }, 300);
    window.addEventListener('scroll', debounceScroll);

    return () => {
      window.removeEventListener('scroll', debounceScroll);
    };
  }, [address, authorStore, hasMore]);

  if (pending) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

  const subscribe = async () => {
    if (!isLogin) {
      modalStore.openLogin();
      return;
    }
    try {
      await Api.subscribe(address);
      authorStore.setSubscribed(true);
      subscriptionStore.addAuthor(authorStore.author);
    } catch (err) {
      console.log(err);
    }
  };

  const unsubscribe = async () => {
    try {
      await Api.unsubscribe(address);
      authorStore.setSubscribed(false);
      subscriptionStore.removeAuthor(authorStore.author.address);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Fade in={true} timeout={isMobile ? 0 : 500}>
      <div className="md:w-7/12 m-auto pb-10 relative">
        <div className="hidden md:block">
          <BackButton history={props.history} />
        </div>
        <div className="pt-6">
          {authorView({
            author,
            subscribe,
            unsubscribe,
            subscribed,
            showSubscription: settings['subscriptions.enabled'],
          })}
        </div>
        <div className="py-10">
          <Posts
            posts={posts}
            borderTop
            hideAuthor
            authorPageEnabled={settings['author.page.enabled']}
          />
          {!pending && posts.length === 0 && (
            <div className="pt-20 text-center text-gray-500">Ta 还没有发布过文章</div>
          )}
        </div>
        {!pending && hasMore && (
          <div className="mt-10">
            <Loading size={24} />
          </div>
        )}
      </div>
    </Fade>
  );
});
