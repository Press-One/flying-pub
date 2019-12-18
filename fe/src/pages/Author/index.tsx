import React from 'react';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import { Post } from 'store/feed';
import Button from 'components/Button';
import Posts from 'components/Posts';
import Loading from 'components/Loading';
import BackButton from 'components/BackButton';
import Api from 'api';
import _Api from './api';
import { sleep } from 'utils';

const authorView = (props: any = {}) => {
  const { author, subscribed, subscribe, unsubscribe } = props;
  return (
    <div className="flex flex-col items-center">
      <img className="w-16 h-16 rounded-full" src={author.avatar} alt={author.name} />
      <div className="font-bold mt-3 text-base text-center px-8">{author.name}</div>
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
    </div>
  );
};

export default observer((props: any) => {
  const { feedStore, subscriptionStore } = useStore();
  const [subscribed, setSubscribed] = React.useState(false);
  const [pending, setPending] = React.useState(true);
  const { isFetched, posts, postExtraMap, blockMap, authorMap } = feedStore;
  const { address } = props.match.params;
  const author = authorMap[address] || {};
  const authorPosts = posts.filter((post: Post) => blockMap[post.id] === address);
  let cachedAddress = '';

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    if (cachedAddress === address) {
      return;
    }
    (async () => {
      try {
        await _Api.fetchSubscription(address);
        setSubscribed(true);
      } catch (err) {
        console.log(err);
      }
      await sleep(200);
      setPending(false);
    })();
  }, [cachedAddress, address]);

  if (pending || !isFetched) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="-mt-40 md:-mt-30">
          <Loading />
        </div>
      </div>
    );
  }

  const tryFetchSubscriptions = async () => {
    try {
      const subscriptions = await Api.fetchSubscriptions();
      const authors = subscriptions.map((subscription: any) => subscription.author);
      subscriptionStore.setAuthors(authors);
      feedStore.setAuthors(authors);
    } catch (err) {}
  };

  const subscribe = async () => {
    try {
      await _Api.subscribe({
        address,
      });
      setSubscribed(true);
      tryFetchSubscriptions();
    } catch (err) {
      console.log(err);
    }
  };

  const unsubscribe = async () => {
    try {
      await _Api.unsubscribe(address);
      setSubscribed(false);
      tryFetchSubscriptions();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Fade in={true} timeout={500}>
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
          })}
        </div>
        <div className="py-10">
          <Posts
            posts={authorPosts}
            postExtraMap={postExtraMap}
            blockMap={blockMap}
            borderTop
            hideAuthor
          />
        </div>
      </div>
    </Fade>
  );
});
