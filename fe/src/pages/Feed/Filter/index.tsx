import React from 'react';
import { observer } from 'mobx-react-lite';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Fade from '@material-ui/core/Fade';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import { useStore } from 'store';
import { sleep, isPc } from 'utils';
import Api from 'api';

const orderName = ['SUBSCRIPTION', 'HOT', 'PUB_DATE'];

let filterTopPosition = 0;

export default observer((props: any) => {
  const { feedStore } = useStore();
  const [fixed, setFixed] = React.useState(false);
  const selectorId = 'feed-filter';
  const { filterOrder: order, filterHotDiffDays: hotDiffDays } = feedStore;
  const { enableScroll } = props;

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
    feedStore.setIsChangingOrder(true);
    feedStore.setFilter(filter);
    try {
      await Api.saveSettings({
        'filter.order': filter.order,
        'filter.hot.diffDays': filter.hotDiffDays,
      });
    } catch (err) {}
    await sleep(500);
    feedStore.setIsChangingOrder(false);
  };

  const handleOrderChange = (e: any, value: any) => {
    tryScroll();
    if (orderName[value] === 'HOT') {
      setFilter({
        order: 'HOT',
        hotDiffDays: hotDiffDays > 0 ? hotDiffDays : 3,
      });
    } else {
      setFilter({
        order: orderName[value],
        hotDiffDays: 0,
      });
    }
  };

  const hotItems = () => {
    return (
      <Fade in={true} timeout={500}>
        <div className="flex justify-center py-2 md:py-3 flex border-t border-gray-300 md:border-gray-200">
          {hotItem('3天内', 3)}
          {hotItem('7天内', 7)}
          {hotItem('15天内', 15)}
          {hotItem('全部', 0)}
        </div>
      </Fade>
    );
  };

  const hotItem = (text: string, value: number) => {
    return (
      <span
        onClick={() => {
          tryScroll();
          setFilter({
            order: 'HOT',
            hotDiffDays: value,
          });
        }}
        className={classNames(
          {
            'bg-blue-400 text-white': hotDiffDays === value,
            'bg-gray-200 text-gray-600': hotDiffDays !== value,
          },
          'py-1 px-3 mx-2 md:mx-3 text-xs rounded color md:cursor-pointer',
        )}
      >
        {text}
      </span>
    );
  };

  const main = () => {
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
                'border-b': fixed || order !== 'HOT',
              },
              'filter border-t border-gray-300 md:border-gray-200',
            )}
          >
            <Tabs
              value={orderName.indexOf(order)}
              onChange={handleOrderChange}
              className="relative"
            >
              <Tab label="关注" className="tab" />
              <Tab label="热榜" className="tab" />
              <Tab label="最新" className="tab" />
            </Tabs>
            {order === 'HOT' && hotItems()}
            <style jsx>{`
              .filter :global(.tab) {
                width: 33.333333%;
                max-width: 33.333333%;
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
    const height = order === 'HOT' ? 92 : 49;
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
