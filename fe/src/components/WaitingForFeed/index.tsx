import React from 'react';
import { Link } from 'react-router-dom';
import Home from '@material-ui/icons/Home';
import Refresh from '@material-ui/icons/Refresh';
import ButtonOutlined from 'components/ButtonOutlined';

export default () => {
  return (
    <div className="text-gray-600">
      <div className="flex justify-center mt-10 md:mt-24">
        <img
          className="w-48 h-48"
          src="https://xue-images.pek3b.qingstor.com/920-loading.gif"
          alt="loading"
        />
      </div>
      <div className="px-10 text-base md:text-xl text-center pt-16">
        聚合站正在拼命抓取这篇文章，大概还需要几分钟时间，请稍等一下...
      </div>
      <div className="flex items-center justify-center pt-20">
        <Link to={`/`}>
          <div className="mr-8">
            <ButtonOutlined>
              <div className="p-1 flex items-center justify-center">
                <span className="flex items-center text-xl mr-1">
                  <Home />
                </span>
                返回首页
              </div>
            </ButtonOutlined>
          </div>
        </Link>
        <ButtonOutlined
          onClick={() => {
            window.location.reload();
          }}
        >
          <div className="p-1 flex items-center justify-center">
            <span className="flex items-center text-xl mr-1">
              <Refresh />
            </span>
            刷新
          </div>
        </ButtonOutlined>
      </div>
    </div>
  );
};
