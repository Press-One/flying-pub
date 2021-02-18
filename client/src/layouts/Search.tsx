import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { MdSearch } from 'react-icons/md';
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
  const { authorStore, userStore, pathStore, modalStore, contextStore } = useStore();
  const isSearchPage = location.pathname === '/search';
  const state = useLocalStore(() => ({
    value: isSearchPage ? getQuery('query') : '',
    active: false,
    showMask: false,
  }));
  const address = getQuery('address') || '';
  const nickname = getQuery('nickname') || '';
  const who = React.useMemo(() => {
    if (!authorStore.author.address && !address) {
      return '';
    }
    const isMyself =
      userStore.isLogin &&
      userStore.user.avatar === authorStore.author.avatar &&
      userStore.user.nickname === authorStore.author.nickname;
    if (isMyself) {
      return '我的';
    }
    if (authorStore.author.address || address) {
      return ` ${authorStore.author.nickname || nickname} 的`;
    }
    return '';
  }, [userStore.isLogin, userStore.user, authorStore.author, address, nickname]);
  const { isMixinImmersive } = contextStore;

  const toggle = React.useCallback(
    (status: boolean) => {
      (async () => {
        if (status) {
          state.active = true;
          if (!isSearchPage) {
            state.showMask = true;
          }
        } else {
          state.showMask = false;
          state.active = false;
          state.value = '';
        }
      })();
    },
    [state, isSearchPage],
  );

  React.useEffect(() => {
    if (isSearchPage) {
      if (!state.active) {
        toggle(true);
      }
    }
  }, [state, isSearchPage, toggle]);

  React.useEffect(() => {
    if (!isSearchPage) {
      toggle(false);
    }
  }, [isSearchPage, toggle]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    return () => {
      if (authorStore.author.address) {
        authorStore.clearAuthor();
      }
    };
  }, [authorStore]);

  const handleSearch = (value: string) => {
    scrollToHere(0);
    if (value.trim()) {
      state.value = value;
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
  };

  return (
    <div className="w-full md:mr-8">
      {!state.active && (
        <div>
          {isMobile && (
            <div
              className="rounded-full w-full flex items-center bg-gray-f2 text-gray-af h-8 pb-1-px"
              onClick={onFocus}
            >
              <div className="flex items-center ml-3 text-22 pt-1-px">
                <MdSearch />
              </div>
              <div className="ml-1 text-13 pt-1-px">搜索你感兴趣的内容</div>
            </div>
          )}
          {isPc && (
            <div className="text-28 cursor-pointer flex ml-2 text-gray-99">
              <MdSearch onClick={onFocus} />
            </div>
          )}
        </div>
      )}
      {state.active && (
        <div className="absolute top-0 left-0 w-full md:flex md:justify-center bg-white z-30 h-12 md:h-auto">
          <Fade in={true} timeout={500}>
            <div>
              {isPc && (
                <SearchInput
                  defaultValue={state.value}
                  required
                  autoFocus={!state.value}
                  placeholder={`搜索${who}文章`}
                  search={handleSearch}
                  onBlur={() => {
                    if (!isSearchPage) {
                      stopBodyScroll(false);
                      toggle(false);
                    }
                  }}
                />
              )}
              {isMobile && (
                <div
                  className={classNames(
                    {
                      'pt-4-px': isMixinImmersive,
                      'pt-8-px': !isMixinImmersive,
                    },
                    'flex items-center px-4',
                  )}
                >
                  <span
                    className="text-gray-88 text-15 pt-1"
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
                  <div className="flex-1 pl-4">
                    <SearchInput
                      defaultValue={state.value}
                      className="pl-4 w-full"
                      size="small"
                      required
                      autoFocus={!state.value}
                      placeholder={who ? `搜索${who}文章` : ''}
                      search={handleSearch}
                    />
                  </div>
                  {isMixinImmersive && <div className="pr-24" />}
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
    </div>
  );
});
