import { parse } from 'query-string';

export { default as Endpoint } from './endpoint';

export const getQueryObject = () => {
  return parse(window.location.search)
}

export const ago = (timestamp: string) => {
  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();
  const diffValue = now - past;
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = month * 12;
  const _year = diffValue / year;
  const _month = diffValue / month;
  const _week = diffValue / (7 * day);
  const _day = diffValue / day;
  const _hour = diffValue / hour;
  const _min = diffValue / minute;
  let result = '';
  if (_year >= 1) {
    result = Math.floor(_year) + '年前';
  } else if (_month >= 1) {
    result = Math.floor(_month) + '个月前';
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