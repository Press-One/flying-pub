import React from 'react';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import { AiOutlineCheckCircle } from 'react-icons/ai';
import { MdHelp } from 'react-icons/md';
import Tooltip from '@material-ui/core/Tooltip';
import Loading from 'components/Loading';
import Button from 'components/Button';
import Modal from 'components/Modal';
import PinOTPInput from 'components/PinOTPInput';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import { sleep, isPc, stopBodyScroll, isIPhone, isMobile } from 'utils';
import { checkAmount } from './utils';
import Api from './api';

export default (props: any) => {
  const { open, onClose, mixinAccount, currency } = props;
  const [step, setStep] = React.useState(1);
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const [isPaid, setIsPaid] = React.useState(false);
  const { snackbarStore, walletStore, settingsStore } = useStore();
  const { settings } = settingsStore;
  const { balance } = walletStore;

  if (!mixinAccount) {
    return null;
  }

  const onCloseModal = (isSuccess: boolean, message?: string) => {
    setStep(1);
    setAmount('');
    setMemo('');
    setPin('');
    setPaying(false);
    setIsPaid(false);
    onClose(isSuccess, message);
  };

  const tryGoStep2 = (amount: string, currency: string, balance: any) => {
    const result = checkAmount(amount, currency, balance);
    if (result.ok) {
      stopBodyScroll(false, {
        disabled: true,
      });
      setStep(2);
    } else {
      snackbarStore.show(result);
    }
  };

  const step1 = () => {
    return (
      <div className="mx-2">
        <div className="flex items-center justify-center text-base">
          <div className="text-sm">
            转给 <span className="font-bold mr-1">{mixinAccount.full_name}</span>
          </div>{' '}
          <Tooltip placement="right" title={`你当前登录的${settings['mixinApp.name']} 账号`}>
            <MdHelp className="text-gray-600" />
          </Tooltip>
        </div>
        <div className="text-gray-500 text-xs">{mixinAccount.identity_number}</div>
        <div className="mt-2 text-gray-800">
          <TextField
            value={amount}
            placeholder="数量"
            onChange={(event: any) => {
              const re = /^[0-9]+[.]?[0-9]*$/;
              const { value } = event.target;
              if (isMobile && String(value).length > 8) {
                return;
              }
              if (value === '' || re.test(value)) {
                setAmount(value);
              }
            }}
            margin="normal"
            variant="outlined"
            fullWidth
            autoFocus
            onKeyPress={(e: any) => e.key === 'Enter' && tryGoStep2(amount, currency, balance)}
            InputProps={{
              endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
              inputProps: { maxLength: 8, type: isPc ? 'text' : 'number' },
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
            onKeyPress={(e: any) => e.key === 'Enter' && tryGoStep2(amount, currency, balance)}
            inputProps={{ maxLength: 20 }}
          />
        </div>
        <div className="mt-5" onClick={() => tryGoStep2(amount, currency, balance)}>
          <Button fullWidth={isMobile}>
            <div className="flex items-center">下一步</div>
          </Button>
        </div>
      </div>
    );
  };

  const onOtpChange = (value: string) => {
    setPin(value);
    if (value.length === 6) {
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
            await sleep(1000);
            onCloseModal(
              true,
              isPc
                ? `转出成功，你可以打开${settings['mixinApp.name']} App 查看已经到账的 ${amount} 个 ${currency}`
                : '转出成功',
            );
          } else {
            snackbarStore.show({
              message: '支付密码错误，请重试',
              type: 'error',
            });
          }
        } catch (err) {
          console.log(err);
        }
        setPaying(false);
      }, 500);
    }
  };

  const step2 = () => {
    return (
      <div>
        <div className="text-lg font-bold text-gray-700">请输入支付密码</div>
        <div className="hidden md:block mt-5">
          转给 <span className="font-bold">{mixinAccount.full_name}</span>
          <div className="text-gray-500 text-xs">{mixinAccount.identity_number}</div>
        </div>
        <div className="mt-6 md:mt-3 text-xs pb-1">
          <span className="font-bold text-xl">{amount}</span> {currency}
        </div>
        <div className="mt-5 text-gray-800">
          {!isPaid && !paying && (
            <div>
              <PinOTPInput value={pin} onChange={onOtpChange} />
              <div
                className="mt-4 text-sm md:text-xs text-blue-400 cursor-pointer"
                onClick={() => {
                  setPin('');
                  setStep(1);
                }}
              >
                返回
              </div>
            </div>
          )}
        </div>
        {!isPaid && paying && (
          <div className="fixed-width text-center md:px-6 pt-2 pb-2">
            <Loading size={38} />
          </div>
        )}
        {isPaid && (
          <div className="fixed-width flex justify-center md:px-6 -mt-3 text-5xl text-blue-400">
            <Fade in={true} timeout={500}>
              <AiOutlineCheckCircle />
            </Fade>
          </div>
        )}
        <style jsx>{`
          .fixed-width {
            width: 168px;
            box-sizing: content-box;
          }
        `}</style>
      </div>
    );
  };

  return (
    <Modal open={open} onClose={() => onCloseModal(false)}>
      <div
        className={classNames(
          {
            'fixed-scroll': isIPhone && !paying && !isPaid,
          },
          'p-8 bg-white rounded-12 text-center mx-5',
        )}
      >
        {step === 1 && step1()}
        {step === 2 && step2()}
        <style jsx>{`
          .fixed-scroll {
            margin-top: -42vh;
          }
        `}</style>
      </div>
    </Modal>
  );
};
