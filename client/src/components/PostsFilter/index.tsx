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
  showLatest?: boolean;
  dayRangeOptions?: number[];
  dayRange?: number;
  subscriptionType?: string;
  latestType?: string;
  onChange: (type: string, value?: any) => void;
  enableScroll?: boolean;
}

interface ITabItem {
  text: string;
  value: any;
}

export default observer((props: IProps) => {
  const { userStore, contextStore } = useStore();
  const selectorId = 'feed-filter';
  const { enableScroll = true } = props;
  const showSubTabs =
    (props.showPopularity && props.type === 'POPULARITY') ||
    (props.showLatest && props.type === 'LATEST') ||
    props.type === 'SUBSCRIPTION';
  const { isMixinImmersive } = contextStore;

  const types = React.useMemo(() => props.tabs.map((tab) => tab.type), [props.tabs]);

  const fixed = useFilterScroll(enableScroll, selectorId);

  const handleOrderChange = (e: any, value: any) => {
    if (types[value] === props.type) {
      return;
    }
    if (isMixinImmersive) {
      window.scrollTo({
        top: 0,
      });
    } else if (fixed) {
      tryScroll(selectorId);
    }
    props.onChange(types[value] as string);
  };

  const tabItems = (options: { type: string; selectValue: any; items: ITabItem[] }) => {
    const { type, items, selectValue } = options;
    if (!items || items.length === 0) {
      return null;
    }
    return (
      <Fade in={true} timeout={isMobile ? 100 : 500}>
        <div className="flex justify-center md:py-3 -mt-2-px md:mt-0">
          {items.map((option, index: number) => {
            return (
              <div
                key={index}
                className={classNames({
                  'rounded-l-12 overflow-hidden': isMobile && index === 0,
                  'rounded-r-12 overflow-hidden': isMobile && index === items.length - 1,
                })}
              >
                <div
                  onClick={() => {
                    if (isMixinImmersive) {
                      window.scrollTo({
                        top: 0,
                      });
                    } else if (fixed) {
                      tryScroll(selectorId);
                    }
                    props.onChange(type, option.value);
                  }}
                  className={classNames(
                    {
                      'bg-blue-400 text-white': selectValue === option.value,
                      'bg-gray-f2 text-gray-88': selectValue !== option.value,
                      'pl-3 pr-2': isMobile && index === 0,
                      'pl-2 pr-3': isMobile && index === items.length - 1,
                    },
                    'py-3-px md:px-3 md:mx-3 text-12 md:rounded-12 md:cursor-pointer',
                  )}
                >
                  {option.text}
                </div>
              </div>
            );
          })}
        </div>
      </Fade>
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
                  'justify-between': !fixed || !isMixinImmersive,
                  'flex items-center pl-2 pr-3 pt-1': isMobile,
                },
                'bg-white filter',
              )}
            >
              <Tabs
                value={typeValue >= 0 ? typeValue : 0}
                onChange={handleOrderChange}
                className={classNames(
                  {
                    'two-columns': isPc && types.length === 2,
                    'three-columns': isPc && types.length === 3,
                    sm: isMobile,
                  },
                  'relative post-filter-tabs text-gray-88',
                )}
              >
                {props.tabs.map((tab) => (
                  <Tab label={tab.name} className="tab" key={tab.type} />
                ))}
              </Tabs>

              {fixed && isMixinImmersive && <div className="mr-6" />}

              {userStore.isLogin &&
                props.type === 'SUBSCRIPTION' &&
                tabItems({
                  type: 'SUBSCRIPTION',
                  selectValue: props.subscriptionType,
                  items: [
                    {
                      text: '作者文章',
                      value: 'author',
                    },
                    {
                      text: '专题文章',
                      value: 'topic',
                    },
                  ],
                })}

              {props.showLatest &&
                props.type === 'LATEST' &&
                tabItems({
                  type: 'LATEST',
                  selectValue: props.latestType,
                  items: [
                    {
                      text: '发布',
                      value: 'PUB_DATE',
                    },
                    {
                      text: '评论',
                      value: 'LATEST_COMMENT',
                    },
                  ],
                })}

              {props.showPopularity &&
                props.type === 'POPULARITY' &&
                tabItems({
                  type: 'POPULARITY',
                  selectValue: props.dayRange,
                  items: (props.dayRangeOptions || []).map((dayRange: any) => ({
                    text: `${dayRange}天内`,
                    value: dayRange,
                  })),
                })}
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
            transform: scaleX(0.35);
            bottom: 0;
            height: 3px;
            border-radius: 2px;
          }
          :global(.post-filter-tabs .tab) {
            max-width: 100%;
            font-size: 14px;
            min-height: 0;
          }
          :global(.post-filter-tabs.sm .tab) {
            font-size: 15px;
          }
          :global(.post-filter-tabs .tab) {
            height: 40px;
            padding: 0 12px;
          }
          :global(.post-filter-tabs.sm .tab) {
            height: 38px;
            padding: 4px 12px 0;
          }
          :global(.post-filter-tabs.sm .tab) {
            min-width: auto;
            padding: 0 14px;
          }
          :global(.post-filter-tabs .MuiTab-textColorInherit.Mui-selected) {
            font-size: 15px;
            font-weight: bold;
          }
          :global(.post-filter-tabs.sm .MuiTab-textColorInherit.Mui-selected) {
            font-size: 18px;
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
      height = 42;
    } else {
      height = showSubTabs ? 88 : 41;
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
