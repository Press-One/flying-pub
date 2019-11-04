import React from 'react';
import { observer } from 'mobx-react-lite';
import BlockIcon from '@material-ui/icons/Block';

export default observer(() => {
  return (
    <div className="flex items-center justify-center h-screen text-center">
      <div className="-mt-64">
        <div className="text-6xl text-red-500">
          <BlockIcon />
        </div>
        <div className="mt-2 text-lg text-gray-700 font-bold">
          您需要加入【BOX 定投践行群】才能阅读内容
        </div>
        <div className="mt-4">
          <a
            className="font-bold text-blue-400"
            href="https://support.exinone.com/hc/zh-cn/articles/360032511651-关于加入-BOX-定投践行群-的说明"
          >
            如何加入？
          </a>
        </div>
      </div>
    </div>
  );
});
