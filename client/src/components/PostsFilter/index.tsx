import React from 'react';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import classNames from 'classnames';
import { isMobile, isPc } from 'utils';
import useFilterScroll, { tryScroll } from 'hooks/useFilterScroll';

interface tab {
  type: string;
  name: string;
}

interface IProps {
  tabs: tab[];
  type: string;
  showPopularity?: boolean;
  dayRangeOptions?: number[];
  dayRange?: number;
  onChange: (type: string, dayRange?: number) => void;
  enableScroll?: boolean;
}

export default observer((props: IProps) => {
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

  const popularityItems = () => {
    const dayRangeOptions = props.dayRangeOptions || [];
    if (dayRangeOptions.length === 0) {
      return null;
    }
    return (
      <Fade in={true} timeout={isMobile ? 0 : 500}>
        <div className="flex justify-center py-2 md:py-3 border-t border-gray-ec md:border-gray-d8 md:border-opacity-75">
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
            'bg-gray-200 text-gray-600': props.dayRange !== value,
          },
          'py-1 px-3 mx-2 md:mx-3 text-xs rounded color md:cursor-pointer',
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
        className={classNames({
          'fixed left-0 w-full mt-0 z-50 duration-500 ease-in-out transition-all': fixed,
        })}
      >
        <div
          className={classNames({
            'w-916 m-auto': isPc && fixed,
          })}
        >
          <div
            className={classNames(
              {
                'md:w-8/12 md:pr-3 box-border': fixed,
              },
              'border-t',
            )}
          >
            <div
              className={classNames(
                {
                  'px-0': fixed,
                },
                'border-b border-gray-ec bg-white filter',
              )}
            >
              <Tabs
                value={typeValue >= 0 ? typeValue : 0}
                onChange={handleOrderChange}
                className="relative"
              >
                {props.tabs.map((tab) => (
                  <Tab label={tab.name} className="tab" key={tab.type} />
                ))}
              </Tabs>
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
          .filter :global(.tab) {
            width: ${types.length === 2 ? '50%' : '33.333333%'};
            max-width: 100%;
            font-weight: bold;
            font-size: 15px;
          }
        `}</style>
      </div>
    );
  };

  const placeholder = () => {
    const height = props.showPopularity && props.type === 'POPULARITY' ? 92 : 49;
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
