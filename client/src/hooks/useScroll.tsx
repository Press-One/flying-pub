import React from 'react';

interface IProps {
  threshold?: number;
  callback?: (yes: boolean) => void;
}

export default (props: IProps) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  React.useEffect(() => {
    const callback = () => {
      const scrollElement = document.scrollingElement || document.documentElement;
      const scrollTop = scrollElement.scrollTop;
      if (props.callback && props.threshold) {
        props.callback(scrollTop >= props.threshold);
      }
      setScrollTop(scrollElement.scrollTop);
      console.log({ scrollTop });
    };
    window.addEventListener('scroll', callback);

    return () => {
      window.removeEventListener('scroll', callback);
    };
  }, [props]);

  return scrollTop;
};
