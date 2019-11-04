import React from 'react';
import Modal from '@material-ui/core/Modal';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Check from '@material-ui/icons/Check';
import Help from '@material-ui/icons/Help';
import Button from 'components/Button';
import Tooltip from '@material-ui/core/Tooltip';
import OTPInput from 'otp-input-react';
import Loading from 'components/Loading';
import { useStore } from 'store';
import { sleep } from 'utils';
import Api from './api';

export default (props: any) => {
  const { open, onClose, mixinAccount, currency } = props;
  const [step, setStep] = React.useState(1);
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const [isPaid, setIsPaid] = React.useState(false);
  const { snackbarStore } = useStore();

  const onCloseModal = (isSuccess: boolean) => {
    setStep(1);
    setAmount('');
    setMemo('');
    setPin('');
    setPaying(false);
    setIsPaid(false);
    onClose(isSuccess);
  };

  const step1 = () => {
    return (
      <div>
        <div className="flex items-center justify-center text-base">
          <div className="text-sm">
            转给 <span className="font-bold mr-1">{mixinAccount.full_name}</span>
          </div>{' '}
          <Tooltip placement="right" title="你当前登陆的 Mixin 账号">
            <Help className="text-gray-600" />
          </Tooltip>
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
            autoFocus
            onKeyPress={(e: any) => e.key === 'Enter' && setStep(2)}
            InputProps={{
              endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
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
            onKeyPress={(e: any) => e.key === 'Enter' && setStep(2)}
          />
        </div>
        <div className="mt-5" onClick={() => setStep(2)}>
          <Button>
            <div className="flex items-center">继续</div>
          </Button>
        </div>
      </div>
    );
  };

  const onOtpChange = (value: string) => {
    setPin(value);
    if (value.length === 6) {
      console.log('确认支付');
      setPaying(true);
      setPin('');
      setTimeout(async () => {
        try {
          const isValid = await Api.validatePin({
            pinCode: value,
          });
          if (isValid) {
            await Api.withdraw({
              currency,
              amount,
              memo,
            });
            setPaying(false);
            setIsPaid(true);
            await sleep(800);
            onCloseModal(true);
            await sleep(300);
            snackbarStore.show({
              message: '转出成功',
            });
          } else {
            snackbarStore.show({
              message: '支付密码错误，请重试',
              type: 'error',
            });
          }
        } catch (err) {
          console.log(` ------------- err ---------------`, err);
        }
        setPaying(false);
      }, 500);
    }
  };

  const step2 = () => {
    return (
      <div>
        <div className="text-lg font-bold text-gray-700">请输入支付密码</div>
        <div className="mt-5">
          转给 <span className="font-bold">{mixinAccount.full_name}</span>
          <div className="text-gray-500 text-xs">{mixinAccount.identity_number}</div>
        </div>
        <div className="mt-3 text-xs pb-1">
          <span className="font-bold text-xl">{amount}</span> {currency}
        </div>
        <div className="mt-5 pb-2 text-gray-800">
          {!isPaid && !paying && (
            <div>
              <OTPInput
                inputClassName="border border-gray-400 rounded opt-input"
                value={pin}
                onChange={onOtpChange}
                autoFocus
                OTPLength={6}
                otpType="number"
                secure
              />
              <style jsx global>{`
                .opt-input {
                  margin: 0 2px !important;
                }
              `}</style>
            </div>
          )}
        </div>
        {!isPaid && paying && (
          <div className="px-20 mx-2 pb-2">
            <Loading size={40} />
          </div>
        )}
        {isPaid && (
          <div className="-mt-4 px-20 ml-1 mr-1 text-5xl text-blue-400">
            <Check />
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => onCloseModal(false)}
      className="flex justify-center items-center"
    >
      <div className="py-8 px-10 bg-white rounded text-center">
        {step === 1 && step1()}
        {step === 2 && step2()}
      </div>
    </Modal>
  );
};
