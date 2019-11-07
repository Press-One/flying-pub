import React from 'react';
import classNames from 'classnames';
import { assetIconMap } from 'components/WalletModal/Wallet/utils';

export default (props: any) => {
  let { amountMap = {}, users = [] } = props.summary;
  const currencies = Object.keys(amountMap);
  return (
    <div>
      <div className="w-5/12 mx-auto py-2 -mt-2">
        <div className="flex items-center justify-center text-gray-500">
          <span className="border-b border-gray-500 w-5" />
          <span className="mx-2">
            <span className="font-bold">{users.length || '-'}</span> 人打赏
          </span>
          <span className="border-b border-gray-500 w-5" />
        </div>
        <div className="mt-4 px-5 flex flex-wrap justify-center">
          {users.map((user: any) => {
            return (
              <div className="px-1 mb-2" key={user.id}>
                <img
                  className="rounded-sm w-10 h-10"
                  src={user.avatar}
                  alt={user.name}
                  key={user.id}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-5/12 mt-3 mx-auto pb-5">
        <div className="border border-gray-300 bg-gray-100 rounded">
          {currencies.map((asset: any, index: number) => {
            return (
              <div
                className={classNames(
                  {
                    'border-b border-gray-300': index !== currencies.length - 1,
                  },
                  'flex items-center justify-between py-3 px-5 leading-none',
                )}
                key={asset}
              >
                <div className="flex items-center">
                  <img className="w-10 h-10" src={assetIconMap[asset]} alt={asset} />
                  <span className="ml-3 font-bold text-gray-700">{asset}</span>
                </div>
                <span className="text-gray-600 ml-2 flex items-center leading-none">
                  <span className="text-lg text-green-500">{amountMap[asset]}</span>
                  <span className="ml-1 text-xs font-bold">{asset}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
