import React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { currencyIconMap } from 'components/WalletModal/Wallet/utils';
import Img from 'components/Img';

export default (props: any) => {
  let { amountMap = {}, users = [] } = props.summary;
  const currencies = Object.keys(amountMap);
  return (
    <div className="md:pb-8">
      <div className="w-10/12 md:w-5/12 mx-auto py-2 -mt-2">
        <div className="flex items-center justify-center text-gray-500">
          <span className="border-b border-gray-500 w-5" />
          <span className="mx-2">
            <span className="font-bold">{users.length || '-'}</span> 人打赏
          </span>
          <span className="border-b border-gray-500 w-5" />
        </div>
        <div
          className={classNames(
            {
              'justify-start fixed-width m-auto': users.length > 5,
              'justify-center': users.length <= 5,
            },
            'mt-4 px-5 flex flex-wrap',
          )}
        >
          {users.map((user: any) => {
            return (
              <Link to={`/authors/${user.address}`} key={user.id}>
                <div className="px-1 mb-2" key={user.id}>
                  <Img className="rounded-sm w-10 h-10" src={user.avatar} alt={user.nickname} />
                </div>
              </Link>
            );
          })}
        </div>
        <style jsx>{`
          .fixed-width {
            width: 280px;
          }
        `}</style>
      </div>
      <div className="w-10/12 md:w-5/12 mt-3 mx-auto pb-5">
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
                  <Img
                    className="w-10 h-10"
                    src={currencyIconMap[asset]}
                    alt={asset}
                    useOriginalDefault
                  />
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
