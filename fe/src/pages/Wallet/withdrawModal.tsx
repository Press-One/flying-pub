import React from 'react';
import Modal from '@material-ui/core/Modal';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from 'components/Button';
import Api from './api';

export default (props: any) => {
  const { open, onClose, mixinAccount, currency } = props;
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');

  const withdraw = async (currency: string, amount: string, memo: string = '') => {
    try {
      await Api.withdraw({
        currency,
        amount,
        memo,
      });
      onClose(true);
    } catch (err) {
      console.log(` ------------- err ---------------`, err);
    }
  };

  return (
    <Modal open={open} onClose={() => onClose(false)} className="flex justify-center items-center">
      <div className="p-8 bg-white rounded text-center">
        <div>
          转给 <span className="font-bold">{mixinAccount.full_name}</span>
        </div>
        <div className="text-gray-500 text-xs">{mixinAccount.identity_number}</div>
        <div className="mt-2 text-gray-800">
          <TextField
            value={amount}
            placeholder="数量"
            onChange={(event: any) => setAmount(event.target.value)}
            margin="normal"
            variant="outlined"
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">CNB</InputAdornment>,
            }}
          />
          <div className="-mt-2" />
          <TextField
            value={memo}
            placeholder="备注（可选）"
            onChange={(event: any) => setMemo(event.target.value)}
            margin="normal"
            variant="outlined"
            fullWidth
          />
        </div>
        <div className="mt-5" onClick={() => withdraw(currency, amount, memo)}>
          <Button>继续</Button>
        </div>
      </div>
    </Modal>
  );
};
