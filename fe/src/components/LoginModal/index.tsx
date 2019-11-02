import React from 'react';
import Modal from '@material-ui/core/Modal';
import Button from 'components/Button';
import { getApiEndpoint } from 'utils';

export default (props: any) => {
  const { open, onClose } = props;

  return (
    <Modal open={open} onClose={() => onClose(false)} className="flex justify-center items-center">
      <div className="p-8 bg-white rounded text-center">
        <div className="text-lg font-bold">登陆</div>
        <div className="mt-5 text-gray-700">
          我们使用 Mixin 作为登陆方式
          <br className="mt-2" />
          下一步你将跳转到 Mixin 登陆页
        </div>
        <div className="mt-5 text-gray-500 text-xs">
          Mixin 是一个全币种数字货币钱包
          <br className="mt-2" />
          只需手机号加 6 位数字密码即可享受免费实时转账体验。
        </div>
        <div className="mt-5 text-gray-500 text-xs">
          手机还没有安装 Mixin？
          <a
            className="text-blue-400"
            href="https://mixin.one/messenger"
            target="_blank"
            rel="noopener noreferrer"
          >
            前往下载
          </a>
        </div>
        <div className="mt-5">
          <a href={`${getApiEndpoint()}/api/auth/mixin/login?redirect=http://localhost:4008/`}>
            <Button>我已安装 Mixin，前往 Mixin 登陆页扫码登陆</Button>
          </a>
        </div>
      </div>
    </Modal>
  );
};
