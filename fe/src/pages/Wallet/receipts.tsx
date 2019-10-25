import React from 'react';
import classNames from 'classnames';
import { assetIconMap } from './utils';

const receipts = [
  {
    asset: 'btc',
    amount: -0.005,
    post: '定投改变命运（第三版连载）',
  },
  {
    asset: 'prs',
    amount: -6,
    post: '越牛的人越谦虚',
  },
  {
    asset: 'eth',
    amount: -1,
    post: '定投BOX记录',
  },
  {
    asset: 'box',
    amount: -0.5,
    post: '活着，就是巨大的价值',
  },
  {
    asset: 'eos',
    amount: -1,
    post: '做自己喜欢做的产品或服务，卖出去！',
  },
  {
    asset: 'xin',
    amount: -1,
    post: '由傻逼想到的',
  },
];

const Receipt = (receipt: any) => {
  return (
    <div className="flex justify-between items-center py-3 px-2 border-b border-gray-300 leading-none">
      <div className="flex items-center text-gray-700 text-sm">
        <img
          className="mr-4"
          src={assetIconMap[receipt.asset]}
          alt={receipt.asset}
          width="40"
          height="40"
        />
        打赏文章
        <a href="mixin" className="text-blue-400 ml-2">
          {receipt.post}
        </a>
      </div>
      <div className="flex items-center">
        <span
          className={classNames(
            {
              'text-green-400': receipt.amount > 0,
              'text-red-400': receipt.amount < 0,
            },
            'font-bold text-lg mr-1',
          )}
        >
          {receipt.amount}
        </span>
        <span className="text-xs">{receipt.asset.toUpperCase()}</span>
      </div>
    </div>
  );
};

export default () => {
  return <div>{receipts.map(Receipt)}</div>;
};
