// 为什么不使用 useInfiniteScroll，要单独写一个 ？
// 因为 useInfiniteScroll 的 scrollContainer 在全局只支持 window，但我们要的是 document.scrollingElement || document.documentElement

import React from 'react';
import debounce from 'lodash.debounce';
import { sleep } from 'utils';

interface IProps {
  loading: boolean;
  hasNextPage: boolean;
  threshold: 350;
  onLoadMore: () => void;
}

export default (props: IProps) => {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const debounceScroll = debounce(async () => {
      if (props.loading) {
        await sleep(200);
        return;
      }
      if (!props.hasNextPage) {
        return;
      }
      const scrollElement: any = document.scrollingElement || document.documentElement;
      const scrollTop = scrollElement.scrollTop;
      const isBottom =
        scrollTop + window.innerHeight + (props.threshold || 350) > scrollElement.offsetHeight;
      if (isBottom) {
        props.onLoadMore();
      }
    }, 1);
    window.addEventListener('scroll', debounceScroll);

    return () => {
      window.removeEventListener('scroll', debounceScroll);
    };
  }, [props]);

  return ref;
};
