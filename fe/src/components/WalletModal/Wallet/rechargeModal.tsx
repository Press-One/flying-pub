import React from 'react';
import Modal from '@material-ui/core/Modal';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Info from '@material-ui/icons/Info';
import classNames from 'classnames';
import Loading from 'components/Loading';
import Button from 'components/Button';
import { useStore } from 'store';
import { checkAmount } from './utils';
import Api from './api';

export default (props: any) => {
  const { userStore, socketStore, snackbarStore } = useStore();
  const { isLogin } = userStore;
  const { open, onClose, currency } = props;
  const [step, setStep] = React.useState(1);
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [paymentUrl, setPaymentUrl] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [iframeLoading, setIframeLoading] = React.useState(false);

  React.useEffect(() => {
    const rechargeCallback = () => {
      console.log(` ------------- rechargeCallback ---------------`);
      setStep(1);
      setAmount('');
      setMemo('');
      onClose(true);
    };
    if (isLogin) {
      socketStore.on('recharge', rechargeCallback);
    }
    return () => {
      socketStore.off('recharge');
    };
  }, [isLogin, socketStore, onClose]);

  const onCloseModal = () => {
    setStep(1);
    setAmount('');
    setMemo('');
    onClose();
  };

  const recharge = async (currency: string, amount: string, memo: string = '') => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const { paymentUrl } = await Api.recharge({
        currency,
        amount,
        memo,
      });
      setPaymentUrl(paymentUrl);
      setIframeLoading(true);
      setStep(2);
    } catch (err) {
      console.log(` ------------- err ---------------`, err);
    }
    setSubmitting(false);
  };

  const tryRecharge = (currency: string, amount: string, memo: string = '') => {
    const result = checkAmount(amount, currency);
    if (result.ok) {
      recharge(currency, amount, memo);
    } else {
      snackbarStore.show(result);
    }
  };

  const step1 = () => {
    return (
      <div>
        <div className="text-lg font-bold text-gray-700">Mixin 扫码充值</div>
        <div className="mt-2 text-gray-800">
          <TextField
            value={amount}
            placeholder="数量"
            onChange={(event: any) => setAmount(event.target.value)}
            margin="normal"
            variant="outlined"
            fullWidth
            autoFocus
            onKeyPress={(e: any) => e.key === 'Enter' && tryRecharge(currency, amount, memo)}
            InputProps={{
              endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
              inputProps: { maxLength: 8 },
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
            onKeyPress={(e: any) => e.key === 'Enter' && tryRecharge(currency, amount, memo)}
            inputProps={{ maxLength: 20 }}
          />
        </div>
        <div className="mt-5" onClick={() => tryRecharge(currency, amount, memo)}>
          <Button>继续</Button>
        </div>
      </div>
    );
  };

  const step2 = () => {
    return (
      <div className="px-10">
        <div className="text-lg font-bold text-gray-700">Mixin 扫码充值</div>
        <div className="w-64 h-64 relative overflow-hidden">
          {paymentUrl && (
            <div
              className={classNames(
                {
                  hidden: iframeLoading,
                },
                'w-64 h-64',
              )}
            >
              <iframe
                onLoad={() => {
                  console.log(` ------------- onLoad ---------------`);
                  setTimeout(() => {
                    setIframeLoading(false);
                  }, 2000);
                }}
                title="Mixin 扫码充值"
                src={paymentUrl}
              ></iframe>
              <style jsx>{`
                iframe {
                  height: 506px;
                  width: 800px;
                  position: absolute;
                  top: -238px;
                  left: 0;
                  margin-left: -272px;
                  transform: scale(0.9);
                }
              `}</style>
            </div>
          )}
          {iframeLoading && (
            <div className="mt-24 pt-4">
              <Loading size={40} />
            </div>
          )}
        </div>
        <div className="mt-3 text-gray-600">
          请使用 Mixin 扫描二维码
          <br />
          支付成功后页面会自动刷新
        </div>
        <div className="flex justify-center items-center mt-4 text-gray-500 text-xs">
          <span className="flex items-center text-lg mr-1">
            <Info />
          </span>
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
      </div>
    );
  };

  return (
    <Modal open={open} onClose={onCloseModal} className="flex justify-center items-center">
      <div className="py-8 px-10 bg-white rounded text-center">
        {step === 1 && step1()}
        {step === 2 && step2()}
      </div>
    </Modal>
  );
};
