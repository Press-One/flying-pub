import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Search } from '@material-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { stopBodyScroll } from 'utils';
import Fade from '@material-ui/core/Fade';
import qs from 'query-string';
import { useStore } from 'store';
import SearchInput from 'components/SearchInput';
import { isMobile, isPc, getQuery, sleep, scrollToHere } from 'utils';
import classNames from 'classnames';

export default observer(() => {
  const history = useHistory();
  const location = useLocation();
  const { authorStore, userStore, pathStore, modalStore } = useStore();
  const isSearchPage = location.pathname === '/search';
  const state = useLocalStore(() => ({
    value: isSearchPage ? getQuery('query') : '',
    show: false,
    active: false,
    showMask: false,
    mounted: false,
  }));
  const address = getQuery('address') || '';
  const nickname = getQuery('nickname') || '';
  const who = React.useMemo(() => {
    if (!authorStore.author.address && !address) {
      return '';
    }
    const isMyself = userStore.isLogin && userStore.user.address === authorStore.author.address;
    if (isMyself) {
      return '我的';
    }
    if (authorStore.author.address || address) {
      return ` ${authorStore.author.nickname || nickname} 的`;
    }
    return '';
  }, [userStore.isLogin, userStore.user, authorStore.author, address, nickname]);

  const toggle = React.useCallback(
    (status: boolean) => {
      (async () => {
        if (status) {
          state.active = true;
          if (!isSearchPage) {
            await sleep(1);
          }
          state.show = true;
          if (!isSearchPage) {
            state.showMask = true;
          }
        } else {
          state.show = false;
          state.showMask = false;
          state.active = false;
        }
      })();
    },
    [state, isSearchPage],
  );

  React.useEffect(() => {
    if (isMobile && isSearchPage) {
      if (!state.active) {
        toggle(true);
      }
    }
  }, [state, isSearchPage, toggle]);

  React.useEffect(() => {
    if (isMobile && !isSearchPage) {
      toggle(false);
    }
  }, [isSearchPage, toggle]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    return () => {
      if (isMobile && authorStore.author.address) {
        authorStore.clearAuthor();
      }
    };
  }, [authorStore]);

  const handleSearch = (value: string) => {
    scrollToHere(0);
    if (value.trim()) {
      if (isMobile) {
        state.showMask = false;
      }
      const options: any = {
        query: value.trim(),
      };
      if (authorStore.author.address || address) {
        options.address = authorStore.author.address || address;
        options.nickname = authorStore.author.nickname || nickname;
      }
      if (isSearchPage) {
        history.replace(`/search?${qs.stringify(options)}`);
      } else {
        history.push(`/search?${qs.stringify(options)}`);
      }
    }
  };

  const onFocus = () => {
    if (!userStore.isLogin) {
      modalStore.openLogin();
      return;
    }
    if (isPc) {
      stopBodyScroll(true);
    }
    toggle(true);
    state.value = '';
  };

  return (
    <div className="mr-8">
      {!state.show && (
        <div className="text-28 cursor-pointer flex ml-2 text-gray-99">
          <Search onClick={onFocus} />
        </div>
      )}
      {state.active && (
        <div
          className={classNames(
            {
              show: state.show,
              md: isPc,
            },
            'absolute left-0 w-full md:flex md:justify-center bg-white z-30 h-12 md:h-auto search-input-entry duration-300 ease-in-out transition-all md:py-2',
          )}
        >
          <Fade in={true} timeout={0}>
            <div>
              {isPc && (
                <SearchInput
                  required
                  autoFocus
                  placeholder={`搜索${who}文章`}
                  search={handleSearch}
                  onBlur={() => {
                    stopBodyScroll(false);
                    toggle(false);
                  }}
                />
              )}
              {isMobile && (
                <div className="mt-8-px flex items-center px-4">
                  <div className="flex-1 pl-0 pr-3">
                    <SearchInput
                      defaultValue={state.value}
                      className="pl-4 w-full"
                      size="small"
                      required
                      autoFocus={!state.value}
                      placeholder={`搜索${who}文章`}
                      search={handleSearch}
                    />
                  </div>
                  <span
                    className="text-gray-88 pl-1 pr-2-px text-15"
                    onClick={async () => {
                      const { prevPath, lastPath } = pathStore;
                      if (lastPath === '/search') {
                        if (prevPath) {
                          if (prevPath.includes('authors')) {
                            history.goBack();
                            await sleep(400);
                          } else {
                            history.goBack();
                          }
                        } else {
                          history.push('/');
                        }
                      }
                      toggle(false);
                    }}
                  >
                    返回
                  </span>
                </div>
              )}
            </div>
          </Fade>
        </div>
      )}
      {state.showMask && (
        <div
          className="fixed bg-white md:bg-black md:bg-opacity-50 bottom-0 left-0 w-screen z-30"
          style={{
            height: `calc(100vh - 53px)`,
          }}
        />
      )}
      <style jsx>{`
        .search-input-entry {
          top: -48px;
        }
        .search-input-entry.show {
          top: 0;
        }
        .search-input-entry.show.md {
          top: -8px;
        }
      `}</style>
    </div>
  );
});
