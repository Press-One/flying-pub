import React from 'react';
import { Link } from 'react-router-dom';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Refresh } from '@material-ui/icons';
import authorApi, { IAuthor } from 'apis/author';
import subscriptionApi from 'apis/subscription';
import Loading from 'components/Loading';
import classNames from 'classnames';
import Button from 'components/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Img from 'components/Img';
import { useStore } from 'store';

const isLargeWindow = window.innerHeight > 700;
const LIMIT = isLargeWindow ? 8 : 6;

export default observer(() => {
  const { userStore } = useStore();
  const state = useLocalStore(() => ({
    isFetched: false,
    isFetching: false,
    submitting: false,
    authors: [] as IAuthor[],
  }));

  React.useEffect(() => {
    if (state.isFetching || state.isFetched) {
      return;
    }
    (async () => {
      state.isFetching = true;
      const { authors } = await authorApi.fetchRecommendedAuthors({
        limit: LIMIT,
      });
      state.authors = authors;
      state.isFetched = true;
      state.isFetching = false;
    })();
  }, [state.isFetching, state.isFetched, state]);

  const subscribe = async (author: IAuthor) => {
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    try {
      await subscriptionApi.subscribe(author.address);
      author.following = true;
    } catch (err) {
      console.log(err);
    }
    state.submitting = false;
  };

  const unsubscribe = async (author: IAuthor) => {
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    try {
      await subscriptionApi.unsubscribe(author.address);
      author.following = false;
    } catch (err) {
      console.log(err);
    }
    state.submitting = false;
  };

  return (
    <div className="bg-white rounded-12 pb-2 mb-3 root box-border">
      <div className="px-5 py-4 leading-none text-16 border-b border-gray-d8 border-opacity-75 text-gray-4a flex justify-between items-center">
        发现作者
        <span
          className="text-blue-400 text-13 flex items-center cursor-pointer"
          onClick={() => (state.isFetched = false)}
        >
          <div className="flex items-center text-18 mr-1">
            <Refresh />
          </div>
          换一换
        </span>
      </div>
      {state.isFetching && (
        <div className="py-40">
          <Loading />
        </div>
      )}
      {!state.isFetching &&
        state.authors.map((author, index) => {
          const isMyself = userStore.isLogin && author.address === userStore.user.address;
          return (
            <Tooltip
              placement="left"
              arrow
              disableHoverListener={!author.bio}
              title={author.bio || ''}
            >
              <div
                className={classNames(
                  {
                    'border-b border-gray-200': index + 1 !== LIMIT,
                  },
                  'px-5 py-4 flex items-center justify-between',
                )}
              >
                <Link to={`/authors/${author.address}`} key={index}>
                  <div className="flex items-center cursor-pointer">
                    <Img className="w-10 h-10 rounded" src={author.avatar} alt="." />
                    <div className="ml-3">
                      <div className="text-14 text-gray-70 truncate w-38 box-border pr-2">
                        {author.nickname}
                      </div>
                      <div className="text-12 text-gray-af truncate w-38 box-border pr-2">
                        {author.bio}
                      </div>
                    </div>
                  </div>
                </Link>
                {!isMyself && (
                  <div>
                    {author.following ? (
                      <Button size="mini" onClick={() => unsubscribe(author)} outline color="gray">
                        已关注
                      </Button>
                    ) : (
                      <Button size="mini" onClick={() => subscribe(author)} outline>
                        关注
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Tooltip>
          );
        })}
      <style jsx>{`
        .root {
          height: ${isLargeWindow ? '635px' : '490px'};
        }
      `}</style>
    </div>
  );
});
