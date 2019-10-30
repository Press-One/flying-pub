import React from 'react';
import { assetIconMap } from '../Wallet/utils';

export default (props: any) => {
  let { amountMap = {}, users = [] } = props.summary;
  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex border-r border-gray-500 justify-end">
        {Object.keys(amountMap).map((asset: any) => {
          return (
            <div className="flex items-center justify-center py-2 w-1/2">
              <img className="w-10 h-10" src={assetIconMap[asset.toLowerCase()]} alt={asset} />
              <span className="text-gray-600 ml-2 flex items-center leading-none">
                <span className="text-lg text-green-500">{amountMap[asset]}</span>
                <span className="ml-1 text-xs">{asset.toUpperCase()}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="w-1/2 py-2">
        <div className="pl-5 flex">
          {users.map((user: any) => {
            return (
              <div className="border border-gray-400 ml-1">
                <img className="w-10 h-10" src={user.avatar} alt={user.name} key={user.id} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
