import React from 'react';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import classNames from 'classnames';
import { isMobile, isPc } from 'utils';
import useFilterScroll, { tryScroll } from 'hooks/useFilterScroll';
import { useStore } from 'store';

interface tab {
  type: string;
  name: string;
}

interface IProps {
  provider: string;
  tabs: tab[];
  type: string;
  showPopularity?: boolean;
  dayRangeOptions?: number[];
  dayRange?: number;
  subscriptionType?: string;
  onChange: (type: string, value?: any) => void;
  enableScroll?: boolean;
}

export default observer((props: IProps) => {
  const { userStore } = useStore();
  const selectorId = 'feed-filter';
  const { enableScroll = true } = props;

  const types = React.useMemo(() => props.tabs.map((tab) => tab.type), [props.tabs]);

  const fixed = useFilterScroll(enableScroll, selectorId);

  const handleOrderChange = (e: any, value: any) => {
    if (types[value] === props.type) {
      return;
    }
    if (fixed) {
      tryScroll(selectorId);
    }
    props.onChange(types[value] as string);
  };

  const subscriptionItems = () => {
    return (
      <Fade in={true} timeout={isMobile ? 500 : 500}>
        <div className="flex justify-center pt-3-px pb-2 md:py-3">
          <div>{subscriptionItem('作者文章', 'author')}</div>
          <div>{subscriptionItem('专题文章', 'topic')}</div>
        </div>
      </Fade>
    );
  };

  const subscriptionItem = (text: string, subscriptionType: string) => {
    return (
      <div
        onClick={() => {
          if (fixed) {
            tryScroll(selectorId);
          }
          props.onChange('SUBSCRIPTION', subscriptionType);
        }}
        className={classNames(
          {
            'bg-blue-400 text-white': props.subscriptionType === subscriptionType,
            'bg-gray-f2 text-gray-88': props.subscriptionType !== subscriptionType,
          },
          'py-3-px px-3 mx-10-px md:mx-3 text-12 rounded-12 md:cursor-pointer',
        )}
      >
        {text}
      </div>
    );
  };

  const popularityItems = () => {
    const dayRangeOptions = props.dayRangeOptions || [];
    if (dayRangeOptions.length === 0) {
      return null;
    }
    return (
      <Fade in={true} timeout={isMobile ? 500 : 500}>
        <div className="flex justify-center pt-3-px pb-2 md:py-3">
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
          if (fixed) {
            tryScroll(selectorId);
          }
          props.onChange('POPULARITY', value);
        }}
        className={classNames(
          {
            'bg-blue-400 text-white': props.dayRange === value,
            'bg-gray-f2 text-gray-88': props.dayRange !== value,
          },
          'py-3-px px-3 mx-10-px md:mx-3 text-12 rounded-12 md:cursor-pointer',
        )}
      >
        {text}
      </div>
    );
  };

  const main = () => {
    const typeValue = types.indexOf(props.type);
    return (
      <div
        id={selectorId}
        className={classNames(
          {
            'fixed left-0 w-full mt-0 z-50 duration-500 ease-in-out transition-all': fixed,
          },
          `${props.provider}-filter`,
        )}
      >
        <div
          className={classNames({
            'w-916 m-auto': isPc && fixed,
          })}
        >
          <div
            className={classNames({
              'md:w-8/12 md:pr-3 box-border md:border-b md:border-gray-ec': fixed,
            })}
          >
            <div
              className={classNames(
                {
                  'px-0 md:px-5': fixed,
                },
                'bg-white filter',
              )}
            >
              <Tabs
                value={typeValue >= 0 ? typeValue : 0}
                onChange={handleOrderChange}
                className={classNames(
                  {
                    'two-columns': types.length === 2,
                    'three-columns': types.length === 3,
                    sm: isMobile,
                  },
                  'relative post-filter-tabs text-gray-88',
                )}
              >
                {props.tabs.map((tab) => (
                  <Tab label={tab.name} className="tab" key={tab.type} />
                ))}
              </Tabs>
              {userStore.isLogin && props.type === 'SUBSCRIPTION' && subscriptionItems()}
              {props.showPopularity && props.type === 'POPULARITY' && popularityItems()}
            </div>
          </div>
        </div>
        <style jsx>{`
          #feed-filter {
            top: -50px;
          }
          #feed-filter.fixed {
            top: 0;
          }
          :global(.post-filter-tabs) {
            min-height: auto;
          }
          :global(.post-filter-tabs.sm .MuiTabs-indicator) {
            transform: scaleX(0.2);
            bottom: 5px;
            height: 3px;
            border-radius: 2px;
          }
          :global(.post-filter-tabs .tab) {
            max-width: 100%;
            font-size: 14px;
            min-height: 0;
          }
          :global(.post-filter-tabs .tab) {
            height: 40px;
            padding: 0 12px;
          }
          :global(.post-filter-tabs .MuiTab-textColorInherit.Mui-selected) {
            font-size: 15px;
            font-weight: bold;
          }
          :global(.post-filter-tabs.two-columns .tab) {
            width: 50%;
          }
          :global(.post-filter-tabs.three-columns .tab) {
            width: 33.333333%;
          }
        `}</style>
      </div>
    );
  };

  const placeholder = () => {
    let height = 0;
    if (isMobile) {
      height =
        (props.showPopularity && props.type === 'POPULARITY') || props.type === 'SUBSCRIPTION'
          ? 75
          : 40;
    } else {
      height =
        (props.showPopularity && props.type === 'POPULARITY') || props.type === 'SUBSCRIPTION'
          ? 88
          : 41;
    }
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
    <div>
      {main()}
      {fixed && placeholder()}
    </div>
  );
});
