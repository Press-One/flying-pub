import React from 'react';
import { observer } from 'mobx-react-lite';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Fade from '@material-ui/core/Fade';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import { useStore } from 'store';
import { sleep, isPc, isMobile } from 'utils';
import Api from 'api';

let filterTopPosition = 0;

export default observer((props: any) => {
  const { userStore, feedStore, settingsStore } = useStore();
  const selectorId = 'feed-filter';
  const { filterType: type, filterDayRange: dayRange } = feedStore;
  const { settings } = settingsStore;
  const { enableScroll } = props;
  const [fixed, setFixed] = React.useState(false);
  const showPopularity =
    settings['filter.popularity.enabled'] && settings['filter.dayRangeOptions'].length > 1;
  const typeName = ['SUBSCRIPTION', 'PUB_DATE'];
  if (settings['filter.popularity.enabled']) {
    typeName.splice(1, 0, 'POPULARITY');
  }

  React.useEffect(() => {
    let filterTopPosition = 0;
    const debounceScroll = debounce(() => {
      if (!enableScroll) {
        return false;
      }
      const scrollElement = document.scrollingElement || document.documentElement;
      const scrollTop = scrollElement.scrollTop;
      if (filterTopPosition === 0) {
        const feedFilter: any = document.querySelector(`#${selectorId}`);
        if (feedFilter && feedFilter.offsetTop > 0) {
          filterTopPosition = feedFilter.offsetTop;
        }
        const feedFilterPlaceholder: any = document.querySelector(`#${selectorId}-placeholder`);
        if (feedFilterPlaceholder && feedFilterPlaceholder.offsetTop > 0) {
          filterTopPosition = feedFilterPlaceholder.offsetTop;
        }
      }
      if (filterTopPosition > 0 && scrollTop >= filterTopPosition) {
        setFixed(true);
      } else {
        setFixed(false);
      }
    }, 1);
    window.addEventListener('scroll', debounceScroll);

    return () => {
      window.removeEventListener('scroll', debounceScroll);
    };
  }, [enableScroll]);

  const tryScroll = () => {
    if (filterTopPosition === 0) {
      const feedFilter: any = document.querySelector(`#${selectorId}`);
      if (feedFilter && feedFilter.offsetTop > 0) {
        filterTopPosition = feedFilter.offsetTop;
      }
      const feedFilterPlaceholder: any = document.querySelector(`#${selectorId}-placeholder`);
      if (feedFilterPlaceholder && feedFilterPlaceholder.offsetTop > 0) {
        filterTopPosition = feedFilterPlaceholder.offsetTop;
      }
    }
    const scrollElement = document.scrollingElement || document.documentElement;
    const scrollTop = scrollElement.scrollTop;
    const scrollOptions: any = {
      top: filterTopPosition,
    };
    if (scrollTop < filterTopPosition) {
      scrollOptions.behavior = 'smooth';
    }
    window.scrollTo(scrollOptions);
  };

  const setFilter = async (filter: any) => {
    feedStore.setPending(true);
    feedStore.setFilter(filter);
    try {
      const settings: any = {
        'filter.type': filter.type,
      };
      if (filter.type === 'POPULARITY') {
        settings['filter.dayRange'] = filter.dayRange;
      }
      if (userStore.isLogin) {
        await Api.saveSettings(settings);
      }
    } catch (err) {}
    try {
      const { filterType, optionsForFetching, limit, length } = feedStore;
      const { posts } = await Api.fetchPosts(filterType, {
        ...optionsForFetching,
        offset: length,
        limit,
      });
      feedStore.addPosts(posts);
    } catch (err) {}
    await sleep(200);
    feedStore.setPending(false);
  };

  const handleOrderChange = (e: any, value: any) => {
    tryScroll();
    if (typeName[value] === 'POPULARITY') {
      const dayRangeOptions = settings['filter.dayRangeOptions'];
      setFilter({
        type: 'POPULARITY',
        dayRange: dayRange > 0 ? dayRange : dayRangeOptions[0],
      });
    } else {
      setFilter({
        type: typeName[value],
      });
    }
  };

  const popularityItems = () => {
    const dayRangeOptions = settings['filter.dayRangeOptions'];
    if (dayRangeOptions.length === 0) {
      return null;
    }
    return (
      <Fade in={true} timeout={isMobile ? 0 : 500}>
        <div className="flex justify-center py-2 md:py-3 flex border-t border-gray-300 md:border-gray-200">
          {dayRangeOptions.map((dayRange: number) => {
            const text = dayRange > 0 ? `${dayRange}天内` : '全部';
            return <div key={dayRange}>{popularityItem(text, dayRange)}</div>;
          })}
        </div>
      </Fade>
    );
  };

  const popularityItem = (text: string, value: number) => {
    return (
      <div
        onClick={() => {
          tryScroll();
          setFilter({
            type: 'POPULARITY',
            dayRange: value,
          });
        }}
        className={classNames(
          {
            'bg-blue-400 text-white': dayRange === value,
            'bg-gray-200 text-gray-600': dayRange !== value,
          },
          'py-1 px-3 mx-2 md:mx-3 text-xs rounded color md:cursor-pointer',
        )}
      >
        {text}
      </div>
    );
  };

  const main = () => {
    const typeValue = typeName.indexOf(type);
    return (
      <div
        id={selectorId}
        className={classNames(
          {
            'fixed top-0 left-0 w-full mt-0': fixed,
          },
          'bg-white',
        )}
      >
        <div
          className={classNames(
            {
              container: isPc && fixed,
            },
            'md:m-auto',
          )}
        >
          <div
            className={classNames(
              {
                'md:w-7/12 md:m-auto': fixed,
                'border-b': fixed || !showPopularity || type !== 'POPULARITY',
              },
              'filter border-t border-gray-300 md:border-gray-200',
            )}
          >
            <Tabs
              value={typeValue >= 0 ? typeValue : 0}
              onChange={handleOrderChange}
              className="relative"
            >
              <Tab label="关注" className="tab" />
              {settings['filter.popularity.enabled'] && <Tab label="热榜" className="tab" />}
              <Tab label="最新" className="tab" />
            </Tabs>
            {showPopularity && type === 'POPULARITY' && popularityItems()}
            <style jsx>{`
              .filter :global(.tab) {
                width: ${typeName.length === 2 ? '50%' : '33.333333%'};
                max-width: 100%;
                font-weight: bold;
                font-size: 15px;
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  };

  const placeholder = () => {
    const height = showPopularity && type === 'POPULARITY' ? 92 : 49;
    return (
      <div>
        <div id={`${selectorId}-placeholder`}></div>
        <style jsx>{`
          #feed-filter-placeholder {
            height: ${height}px;
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="mt-8 md:mt-10">
      {main()}
      {fixed && placeholder()}
    </div>
  );
});
