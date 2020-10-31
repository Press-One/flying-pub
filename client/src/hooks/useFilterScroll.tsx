import React from 'react';
import debounce from 'lodash.debounce';

export default (enableScroll: boolean, selectorId: string) => {
  const [fixed, setFixed] = React.useState(false);

  React.useEffect(() => {
    let filterTopPosition = 0;
    const debounceScroll = debounce(() => {
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
      if (filterTopPosition > 0 && scrollTop >= filterTopPosition + 200) {
        setFixed(true);
      } else {
        setFixed(false);
      }
    }, 1);
    window.addEventListener('scroll', debounceScroll);

    return () => {
      window.removeEventListener('scroll', debounceScroll);
    };
  }, [selectorId]);

  if (!enableScroll) {
    return false;
  }

  return fixed;
};

export const tryScroll = (selectorId: string) => {
  let filterTopPosition = 0;
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
