import qs from 'query-string';
import moment from 'moment';
export { initMathJax } from './mathJax';

export const getQueryObject = () => {
  return qs.parse(window.location.search);
};

export const getQuery = (name: string) => {
  return qs.parse(window.location.search)[name];
};

export const setQuery = (param: any = {}) => {
  let parsed = qs.parse(window.location.search);
  parsed = {
    ...parsed,
    ...param,
  };
  if (window.history.pushState) {
    const newUrl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      `?${decodeURIComponent(qs.stringify(parsed))}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }
};

export const removeQuery = (name: string) => {
  let parsed = qs.parse(window.location.search);
  delete parsed[name];
  const isEmpty = Object.keys(parsed).length === 0;
  if (window.history.pushState) {
    const newUrl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      `${isEmpty ? '' : '?' + decodeURIComponent(qs.stringify(parsed))}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }
};

export const isDevelopment = process.env.REACT_APP_ENV === 'development';

export const isStaging = process.env.REACT_APP_ENV === 'staging';

export const isProduction = process.env.REACT_APP_ENV === 'production';

export const getApiEndpoint = () => {
  return isDevelopment ? `http://${window.location.hostname}:9000` : window.location.origin;
};

export const ago = (timestamp: string) => {
  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();
  const diffValue = now - past;
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const _week = diffValue / (7 * day);
  const _day = diffValue / day;
  const _hour = diffValue / hour;
  const _min = diffValue / minute;
  let result = '';
  if (_week >= 5) {
    result = moment(timestamp).format('YYYY-MM-DD');
  } else if (_week >= 1) {
    result = Math.floor(_week) + '周前';
  } else if (_day >= 1) {
    result = Math.floor(_day) + '天前';
  } else if (_hour >= 1) {
    result = Math.floor(_hour) + '个小时前';
  } else if (_min >= 1) {
    result = Math.floor(_min) + '分钟前';
  } else {
    result = '刚刚';
  }
  return result;
};

export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent,
);

export const isAndroid = /Android/i.test(navigator.userAgent);

export const isIPhone = isMobile && !isAndroid;

export const isPc = !isMobile;

export const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

export const sleep = (duration: number) =>
  new Promise((resolve: any) => {
    setTimeout(resolve, duration);
  });

export const getLoginUrl = () =>
  `${getApiEndpoint()}/api/auth/mixin/login?redirect=${window.location.href}`;

let stoppedBodyScroll = false;
let scrollTop = 0;
export const stopBodyScroll = (isFixed: boolean, options: any = {}) => {
  if (isPc || isWeChat) {
    return;
  }
  const { disabled } = options;
  const bodyEl = document.body;
  if (disabled) {
    bodyEl.style.position = 'static';
    return;
  }
  if (isFixed === stoppedBodyScroll) {
    return;
  }
  if (isFixed) {
    if (stoppedBodyScroll) {
      return;
    }
    scrollTop = window.scrollY;
    bodyEl.style.position = 'fixed';
    if (scrollTop > 0) {
      bodyEl.style.top = -scrollTop + 'px';
    }
  } else {
    bodyEl.style.position = 'static';
    bodyEl.style.top = '';
    window.scrollTo(0, scrollTop);
  }
  stoppedBodyScroll = isFixed;
};

export const onlyForLogin = () => false;

export const generateAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${name.slice(0, 1)}`;

export const scrollToHere = (top: number) => {
  const scrollElement = document.scrollingElement || document.documentElement;
  try {
    scrollElement.scrollTo({
      top,
    });
  } catch (err) {
    scrollElement.scrollTop = top;
  }
};
