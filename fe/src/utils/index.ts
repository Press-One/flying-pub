import { parse } from 'query-string';
import moment from 'moment';

export const getQueryObject = () => {
  return parse(window.location.search);
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
  if (_week >= 1) {
    result = moment(timestamp).format('YYYY-MM-DD');
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

export const getPostSelector = (postId: string) => {
  return 'post-' + postId.replace(/[^\w]/g, '');
};
