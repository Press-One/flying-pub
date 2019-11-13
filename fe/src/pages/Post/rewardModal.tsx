import React from 'react';
import { observer } from 'mobx-react-lite';
import { assets, assetIconMap } from '../../components/WalletModal/Wallet/utils';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import Info from '@material-ui/icons/Info';
import Button from 'components/Button';
import OTPInput from 'otp-input-react';
import Loading from 'components/Loading';
import Modal from 'components/Modal';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import Api from './api';
import WalletApi from 'components/WalletModal/Wallet/api';
import { sleep, isPc } from 'utils';
import { checkAmount } from 'components/WalletModal/Wallet/utils';

export default observer((props: any) => {
  const { userStore, socketStore, walletStore, modalStore, snackbarStore } = useStore();
  const { isLogin } = userStore;
  const { open, onClose, fileRId, toAuthor, toAddress, toMixinClientId } = props;
  const [step, setStep] = React.useState(1);
  const [selectedAsset, setSelectedAsset] = React.useState('CNB');
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const [isPaid, setIsPaid] = React.useState(false);
  const [paymentUrl, setPaymentUrl] = React.useState('');
  const [iframeLoading, setIframeLoading] = React.useState(false);

  React.useEffect(() => {
    if (step !== 5) {
      return;
    }
    const afterRecharge = async (data: any) => {
      console.log(` ------------- afterRecharge ---------------`);
      setIframeLoading(true);
      const { receipt } = data;
      await Api.reward(fileRId, {
        toAddress,
        currency: receipt.currency,
        amount: receipt.amount,
        memo: receipt.memo,
        toMixinClientId,
      });
      setIframeLoading(false);
      setStep(1);
      setAmount('');
      setMemo('');
      setPin('');
      setDefaultPaymentMethod('');
      setPaymentMethod('');
      setPaying(false);
      setIsPaid(false);
      onClose(true);
      await sleep(1500);
      snackbarStore.show({
        message: '打赏成功',
      });
    };
    if (isLogin) {
      socketStore.on('recharge', afterRecharge);
    }
    return () => {
      socketStore.off('recharge');
    };
  }, [
    step,
    isLogin,
    socketStore,
    fileRId,
    toAddress,
    selectedAsset,
    amount,
    memo,
    toMixinClientId,
    onClose,
    snackbarStore,
  ]);

  React.useEffect(() => {
    (async () => {
      try {
        const balance = await WalletApi.getBalance();
        walletStore.setBalance(balance);
      } catch (err) {}
      walletStore.setIsFetchedBalance(true);
    })();
  }, [walletStore]);

  React.useEffect(() => {
    (async () => {
      try {
        const isCustomPinExist = await WalletApi.isCustomPinExist();
        walletStore.setIsCustomPinExist(isCustomPinExist);
      } catch (err) {}
    })();
  }, [walletStore]);

  const onCloseModal = (isSuccess: boolean) => {
    setStep(1);
    setAmount('');
    setMemo('');
    setPin('');
    setPaying(false);
    setIsPaid(false);
    onClose(isSuccess);
  };

  const onOtpChange = (value: string) => {
    setPin(value);
    if (value.length === 6) {
      console.log('确认支付');
      setPaying(true);
      setPin('');
      setTimeout(async () => {
        try {
          const isValid = await WalletApi.validatePin({
            pinCode: value,
          });
          if (isValid) {
            await Api.reward(fileRId, {
              toAddress,
              currency: selectedAsset,
              amount,
              memo,
              toMixinClientId,
            });
            setPaying(false);
            setIsPaid(true);
            setDefaultPaymentMethod('');
            setPaymentMethod('');
            await sleep(1000);
            onCloseModal(true);
            await sleep(1500);
            snackbarStore.show({
              message: '打赏成功',
            });
            try {
              const balance = await WalletApi.getBalance();
              walletStore.setBalance(balance);
            } catch (err) {}
          } else {
            snackbarStore.show({
              message: '支付密码错误，请重试一下',
              type: 'error',
            });
          }
        } catch (err) {
          console.log(` ------------- err ---------------`, err);
          snackbarStore.show({
            message: '打赏失败了，请重试一下',
            type: 'error',
          });
        }
        setPaying(false);
      }, 500);
    }
  };

  const getRechargePaymentUrl = async () => {
    setIframeLoading(true);
    try {
      const { paymentUrl } = await WalletApi.recharge({
        amount,
        currency: selectedAsset,
        memo: memo || '打赏文章',
      });
      console.log(` ------------- paymentUrl ---------------`, paymentUrl);
      setPaymentUrl(paymentUrl);
    } catch (err) {
      console.log(` ------------- err ---------------`, err);
    }
  };

  const step1 = () => {
    return (
      <div className="px-2">
        <div className="text-lg font-bold text-gray-700">选择币种</div>
        <div className="flex flex-wrap justify-between mt-4 w-64">
          {assets.map((asset: any) => {
            return (
              <div key={asset} className="p-2" title={asset}>
                <div
                  className={classNames(
                    {
                      'border-blue-400 text-blue-400 font-bold': selectedAsset === asset,
                      'border-gray-300 text-gray-600': selectedAsset !== asset,
                    },
                    'text-center border rounded p-2 px-4 cursor-pointer',
                  )}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="w-8 h-8">
                    <img className="w-8 h-8" src={assetIconMap[asset]} alt={asset} />
                  </div>
                  <div className="mt-2 leading-none text-xs currency tracking-wide">{asset}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-6">
          <Button onClick={() => setStep(2)}>下一步</Button>
        </div>
        <style jsx>{`
          .currency {
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial,
              Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol,
              Noto Color Emoji;
          }
        `}</style>
      </div>
    );
  };

  const tryGoStep3 = (amount: string, currency: string) => {
    const result = checkAmount(amount, currency);
    if (result.ok) {
      setStep(3);
    } else {
      snackbarStore.show(result);
    }
  };

  const step2 = () => {
    return (
      <div>
        <div className="text-base text-gray-700">
          打赏给 <span className="font-bold">{toAuthor}</span>
        </div>
        <div className="mt-3 text-gray-800">
          <TextField
            value={amount}
            placeholder="数量"
            onChange={(event: any) => setAmount(event.target.value)}
            margin="normal"
            variant="outlined"
            autoFocus={isPc}
            fullWidth
            onKeyPress={(e: any) => e.key === 'Enter' && tryGoStep3(amount, selectedAsset)}
            InputProps={{
              endAdornment: <InputAdornment position="end">{selectedAsset}</InputAdornment>,
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
            onKeyPress={(e: any) => e.key === 'Enter' && tryGoStep3(amount, selectedAsset)}
            inputProps={{ maxLength: 20 }}
          />
        </div>
        <div className="text-center mt-6">
          <Button onClick={() => tryGoStep3(amount, selectedAsset)}>下一步</Button>
        </div>
      </div>
    );
  };

  const step3 = () => {
    const { isFetchedBalance, balance, isCustomPinExist } = walletStore;
    if (!isFetchedBalance) {
      return (
        <div className="px-20 mx-2 py-20">
          <Loading />
        </div>
      );
    }
    const assetBalance = balance[selectedAsset];
    const payments: any = [
      {
        enabled: true,
        method: 'mixin',
        name: `Mixin ${isPc ? '扫码' : ''}支付`,
      },
    ];
    if (Number(assetBalance) >= Number(amount)) {
      if (isCustomPinExist) {
        payments.unshift({
          enabled: true,
          method: 'balance',
          name: '余额支付',
        });
      } else {
        payments.push({
          enabled: false,
          disabledReason: 'PIN_NOT_EXIST',
          method: 'balance',
          name: '余额支付',
        });
      }
    } else {
      payments.push({
        enabled: false,
        disabledReason: 'NO_ENOUGH_BALANCE',
        method: 'balance',
        name: '余额支付',
      });
    }
    if (!defaultPaymentMethod || defaultPaymentMethod !== payments[0].method) {
      setDefaultPaymentMethod(payments[0].method);
      setPaymentMethod(payments[0].method);
    }
    return (
      <div>
        <div className="text-base font-bold text-gray-700">选择支付方式</div>
        <div className="mt-6 mx-10">
          {payments.map((payment: any) => (
            <div key={payment.method}>
              <div
                className={classNames(
                  {
                    'border-blue-400 text-blue-400 font-bold cursor-pointer':
                      payment.enabled && payment.method === paymentMethod,
                    'border-gray-300 text-gray-600 cursor-pointer':
                      payment.enabled && payment.method !== paymentMethod,
                    'opacity-75 border-gray-400 text-gray-500 cursor-not-allowed': !payment.enabled,
                  },
                  'text-center border rounded p-3 px-8 mt-3 leading-none',
                )}
                onClick={() => payment.enabled && setPaymentMethod(payment.method)}
              >
                {payment.name}
              </div>
              {!payment.enabled && (
                <div>
                  {payment.disabledReason === 'NO_ENOUGH_BALANCE' && (
                    <div className="mt-1 text-xs text-gray-500">
                      {selectedAsset} 余额不足，去
                      <span
                        className="text-blue-400 cursor-pointer"
                        onClick={() =>
                          modalStore.openWallet({
                            tab: 'assets',
                            returnInfo: {
                              requiredAsset: selectedAsset,
                              requiredAmount: amount,
                              text: '返回继续打赏',
                            },
                          })
                        }
                      >
                        充值
                      </span>
                    </div>
                  )}
                  {payment.disabledReason === 'PIN_NOT_EXIST' && (
                    <div className="mt-1 text-xs text-gray-500">
                      尚未设置支付密码，去
                      <span
                        className="text-blue-400 cursor-pointer"
                        onClick={() =>
                          modalStore.openWallet({
                            tab: 'settings',
                            returnInfo: {
                              requiredAsset: selectedAsset,
                              requiredAmount: amount,
                              text: '返回继续打赏',
                            },
                          })
                        }
                      >
                        设置
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-6 pt-1">
          <Button
            onClick={() => {
              if (paymentMethod === 'mixin') {
                getRechargePaymentUrl();
                setStep(5);
              } else {
                setStep(4);
              }
            }}
          >
            确认
          </Button>
        </div>
      </div>
    );
  };

  const step4 = () => {
    return (
      <div>
        <div className="text-lg font-bold text-gray-700">请输入支付密码</div>
        <div className="mt-5 text-xs">
          打赏给 <span className="font-bold">{toAuthor}</span>
        </div>
        <div className="mt-3 text-xs pb-1">
          <span className="font-bold text-xl">{amount}</span> {selectedAsset}
        </div>
        <div className="mt-5 text-gray-800">
          {!isPaid && !paying && (
            <div>
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
              <div className="mt-4 text-xs text-blue-400 cursor-pointer" onClick={() => setStep(3)}>
                返回
              </div>
            </div>
          )}
        </div>
        {!isPaid && paying && (
          <div className="pt-2 mx-2 px-20 pb-2">
            <Loading size={38} />
          </div>
        )}
        {isPaid && (
          <div className="-mt-3 px-20 ml-1 mr-1 text-5xl text-blue-400">
            <Fade in={true} timeout={500}>
              <CheckCircleOutline />
            </Fade>
          </div>
        )}
      </div>
    );
  };

  const step5 = () => {
    return (
      <div className="px-10">
        <div className="text-lg font-bold text-gray-700">
          Mixin <span className="hidden md:inline-block">扫码</span>支付
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
                title="Mixin"
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
    <Modal open={open} onClose={() => onCloseModal(false)}>
      <div className="py-8 px-10 bg-white rounded text-center">
        {step === 1 && step1()}
        {step === 2 && step2()}
        {step === 3 && step3()}
        {step === 4 && step4()}
        {step === 5 && step5()}
      </div>
    </Modal>
  );
});
