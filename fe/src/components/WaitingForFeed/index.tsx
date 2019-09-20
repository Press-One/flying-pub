import React from 'react';
import { Link } from 'react-router-dom';
import Home from '@material-ui/icons/Home';
import Refresh from '@material-ui/icons/Refresh';

import './index.scss';

export default () => {
  return (
    <div className="waiting-for-feed">
      <div className="text-center">
        <img src="https://xue-images.pek3b.qingstor.com/920-loading.gif" alt="loading" />
      </div>
      <div className="po-text-22 text-center gray-color push-top-lg">
        聚合站正在拼命抓取这篇文章，大概还需要几分钟时间，请稍等一下...
      </div>
      <div className="flex h-center push-top-xl">
        <Link to={`/`}>
          <div className="po-text-20 btn flex v-center h-center gray-color po-cp push-right-md">
            <Home className="push-right-xs" /> <span className="po-text-16">返回首页</span>
          </div>
        </Link>
        <div
          onClick={() => {
            window.location.reload();
          }}
          className="po-text-20 btn flex v-center h-center gray-color po-cp"
        >
          <Refresh className="push-right-xs" /> <span className="po-text-16">刷新</span>
        </div>
      </div>
    </div>
  );
};
