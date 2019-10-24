import React from 'react';
import TextField from '@material-ui/core/TextField';
import Button from 'components/Button';

export default () => {
  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');

  return (
    <div className="text-sm">
      <div className="font-bold">绑定 Mixin</div>
      <div className="mt-1 text-gray-800">
        {/* <div>
          绑定 Mixin 之后可以把资产转入该 Mixin 账号。
          <a href="mixin" className="text-blue-400">
            去绑定
          </a>
        </div> */}
        <div>
          <div>Mixin 昵称：陈俊鸿</div>
          <div>Mixin ID：c39c2ecc-2109-499f-b6c4-d6f278ea29fb</div>
          <a href="mixin" className="block text-blue-400 mt-1">
            重新绑定
          </a>
        </div>
      </div>
      <div className="border-t border-gray-400 my-4" />
      <div className="font-bold">设置支付密码</div>
      <div className="text-gray-800">
        <div className="-mt-1" />
        <TextField
          value={password}
          placeholder="请输入 6 位支付密码"
          onChange={(event: any) => setPassword(event.target.value)}
          margin="normal"
          variant="outlined"
          type="password"
          inputProps={{ maxLength: 6 }}
        />
        <div className="-mt-2" />
        <TextField
          value={password2}
          placeholder="再输入一次密码"
          onChange={(event: any) => setPassword2(event.target.value)}
          margin="normal"
          variant="outlined"
          type="password"
          inputProps={{ maxLength: 6 }}
        />
        <div className="mt-2">
          <Button>保存</Button>
        </div>
      </div>
    </div>
  );
};
