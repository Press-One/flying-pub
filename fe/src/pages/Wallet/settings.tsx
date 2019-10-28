import React from 'react';
import TextField from '@material-ui/core/TextField';
import Button from 'components/Button';

export default () => {
  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');

  return (
    <div className="text-sm mt-5">
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
