import React from 'react';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Info from '@material-ui/icons/Info';
import classNames from 'classnames';
import Loading from 'components/Loading';
import Button from 'components/Button';
import Modal from 'components/Modal';
import ButtonProgress from 'components/ButtonProgress';
import { useStore } from 'store';
import { checkAmount } from './utils';
import Api from './api';
import { isMobile, isPc, sleep, isIPhone } from 'utils';

export default (props: any) => {
  const { userStore, socketStore, snackbarStore } = useStore();
  const { isLogin } = userStore;
  const { open, onClose, currency } = props;
  const [step, setStep] = React.useState(1);
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [paymentUrl, setPaymentUrl] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [waitingPayment, setWaitingPayment] = React.useState(false);
  const [openingMixinSchema, setOpeningMixinSchema] = React.useState(false);
  const [iframeLoading, setIframeLoading] = React.useState(false);

  React.useEffect(() => {
    const rechargeCallback = () => {
      setStep(1);
      setAmount('');
      setMemo('');
      setPaymentUrl('');
      setOpeningMixinSchema(false);
      setWaitingPayment(false);
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
    setPaymentUrl('');
    setOpeningMixinSchema(false);
    setWaitingPayment(false);
    onClose();
  };

  const getRechargePaymentUrl = async (currency: string, amount: string, memo: string = '') => {
    try {
      const { paymentUrl } = await Api.recharge({
        currency,
        amount,
        memo,
      });
      return paymentUrl;
    } catch (err) {
      console.log(err);
    }
  };

  const tryRecharge = async (currency: string, amount: string, memo: string = '') => {
    const result = checkAmount(amount, currency);
    if (result.ok) {
      if (submitting) {
        return;
      }
      setSubmitting(true);
      if (isMobile) {
        setOpeningMixinSchema(true);
      }
      const paymentUrl = await getRechargePaymentUrl(currency, amount, memo);
      if (isMobile) {
        const paymentActionSchema = `mixin://${paymentUrl.split('/').pop()}`;
        window.location.href = paymentActionSchema;
        await sleep(3000);
        setWaitingPayment(true);
      } else {
        setPaymentUrl(paymentUrl);
        setIframeLoading(true);
        setStep(2);
      }
      setSubmitting(false);
    } else {
      snackbarStore.show(result);
    }
  };

  const step1 = () => {
    return (
      <div className="px-2">
        <div className="text-lg font-bold text-gray-700">
          Mixin <span className="hidden md:inline-block">扫码</span>充值
        </div>
        {(isPc || (isMobile && !waitingPayment)) && (
          <div>
            <div className="mt-2 text-gray-800">
              <TextField
                value={amount}
                placeholder="数量"
                onChange={(event: any) => {
                  const re = /^[0-9]+[.]?[0-9]*$/;
                  const { value } = event.target;
                  if (value === '' || re.test(value)) {
                    setAmount(value);
                  }
                }}
                margin="normal"
                variant="outlined"
                fullWidth
                autoFocus
                onKeyPress={(e: any) => e.key === 'Enter' && tryRecharge(currency, amount, memo)}
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
                onKeyPress={(e: any) => e.key === 'Enter' && tryRecharge(currency, amount, memo)}
                inputProps={{ maxLength: 20 }}
              />
            </div>
            <div className="mt-5" onClick={() => tryRecharge(currency, amount, memo)}>
              <Button fullWidth={isMobile}>
                确定 <ButtonProgress isDoing={openingMixinSchema} />
              </Button>
            </div>
          </div>
        )}
        {isMobile && waitingPayment && (
          <div className="pt-10 text-center">
            <Loading />
            <div className="mt-5 text-sm text-gray-600">已充值？请稍候，正在确认中...</div>
            <div className="mt-8 text-xs text-gray-500">
              您取消了充值？请
              <span
                className="font-bold text-blue-400"
                onClick={() => {
                  setOpeningMixinSchema(false);
                  setWaitingPayment(false);
                }}
              >
                返回
              </span>
              上一步
            </div>
          </div>
        )}
      </div>
    );
  };

  const step2 = () => {
    return (
      <div className="px-10">
        <div className="text-lg font-bold text-gray-700">
          Mixin <span className="hidden md:inline-block">扫码</span>充值
        </div>
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
                  setTimeout(() => {
                    setIframeLoading(false);
                  }, 2000);
                }}
                title={`Mixin ${isPc ? '扫码' : ''}充值`}
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
          <br />
          <span className="text-xs text-gray-500">（如果有延时，请耐心等待一会）</span>
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
    <Modal open={open} onClose={onCloseModal}>
      <div
        className={classNames(
          {
            'fixed-scroll': isIPhone && step === 1 && !waitingPayment,
          },
          'p-8 bg-white rounded text-center mx-5',
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
