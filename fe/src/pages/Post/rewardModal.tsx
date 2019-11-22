import React from 'react';
import { observer } from 'mobx-react-lite';
import { currencies, currencyIconMap } from '../../components/WalletModal/Wallet/utils';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import Info from '@material-ui/icons/Info';
import Button from 'components/Button';
import PinOTPInput from 'components/PinOTPInput';
import Loading from 'components/Loading';
import Modal from 'components/Modal';
import ButtonProgress from 'components/ButtonProgress';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import Api from './api';
import WalletApi from 'components/WalletModal/Wallet/api';
import { sleep, isPc, isMixin, stopBodyScroll, isMobile, isIPhone } from 'utils';
import { checkAmount } from 'components/WalletModal/Wallet/utils';
import Tooltip from '@material-ui/core/Tooltip';

export default observer((props: any) => {
  const cachedCurrency = localStorage.getItem('REWARD_CURRENCY');
  const cachedMethod = localStorage.getItem('REWARD_METHOD');
  const { userStore, socketStore, walletStore, modalStore, snackbarStore } = useStore();
  const { isLogin } = userStore;
  const { open, onClose, fileRId, toAuthor } = props;
  const [step, setStep] = React.useState(cachedCurrency ? 2 : 1);
  const [selectedCurrency, setSelectedCurrency] = React.useState(cachedCurrency || '');
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const [isPaid, setIsPaid] = React.useState(false);
  const [paymentUrl, setPaymentUrl] = React.useState('');
  const [iframeLoading, setIframeLoading] = React.useState(false);
  const [openingMixinSchema, setOpeningMixinSchema] = React.useState(false);

  React.useEffect(() => {
    if (step !== 5 && step !== 6) {
      return;
    }
    const afterRecharge = async (data: any) => {
      console.log(` ------------- afterRecharge ---------------`);
      setIframeLoading(true);
      const { receipt } = data;
      await Api.reward(fileRId, {
        currency: receipt.currency,
        amount: receipt.amount,
        memo: receipt.memo,
      });
      setIframeLoading(false);
      setStep(step > 1 ? 2 : 1);
      setAmount('');
      setMemo('');
      setPin('');
      setPaymentUrl('');
      setPaying(false);
      setIsPaid(false);
      setOpeningMixinSchema(false);
      onClose(true);
      await sleep(1000);
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
  }, [step, isLogin, socketStore, fileRId, selectedCurrency, amount, memo, onClose, snackbarStore]);

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
    setStep(step > 1 ? 2 : 1);
    setAmount('');
    setMemo('');
    setPin('');
    setPaymentUrl('');
    setOpeningMixinSchema(false);
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
              currency: selectedCurrency,
              amount,
              memo,
            });
            setPaying(false);
            setIsPaid(true);
            await sleep(1000);
            onCloseModal(true);
            await sleep(1000);
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
    try {
      const { paymentUrl } = await WalletApi.recharge({
        amount,
        currency: selectedCurrency,
        memo: memo || `飞帖打赏文章（${process.env.REACT_APP_NAME}）`,
      });
      console.log(` ------------- paymentUrl ---------------`, paymentUrl);
      return paymentUrl;
    } catch (err) {
      console.log(` ------------- err ---------------`, err);
    }
  };

  const loadRechargePaymentUrl = async () => {
    setIframeLoading(true);
    const paymentUrl = await getRechargePaymentUrl();
    setPaymentUrl(paymentUrl);
  };

  const openRechargePaymentUrl = async () => {
    setOpeningMixinSchema(true);
    const paymentUrl = await getRechargePaymentUrl();
    const paymentActionSchema = `mixin://${paymentUrl.split('/').pop()}`;
    window.location.href = paymentActionSchema;
    await sleep(3000);
    setStep(6);
  };

  const step1 = () => {
    return (
      <div>
        <div className="text-lg font-bold text-gray-700 -mt-1">选择币种</div>
        <div className="flex flex-wrap justify-between mt-4 w-64 pb-2">
          {currencies.map((currency: any) => {
            return (
              <div key={currency} className="p-1" title={currency}>
                <div
                  className="text-center border rounded p-3 px-5 cursor-pointer border-gray-300 text-gray-600 md:hover:border-blue-400 md:hover:text-blue-400"
                  onClick={() => {
                    localStorage.setItem('REWARD_CURRENCY', currency);
                    setSelectedCurrency(currency);
                    setStep(2);
                  }}
                >
                  <div className="w-8 h-8">
                    <img className="w-8 h-8" src={currencyIconMap[currency]} alt={currency} />
                  </div>
                  <div className="mt-2 leading-none text-xs currency tracking-wide">{currency}</div>
                </div>
              </div>
            );
          })}
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

  const step2 = () => {
    const next = (amount: string, currency: string) => {
      const { isFetchedBalance, balance, isCustomPinExist } = walletStore;
      const assetBalance = balance[currency];
      const result = checkAmount(amount, currency);
      if (result.ok) {
        const balanceMethodAutoSelected =
          isFetchedBalance &&
          isCustomPinExist &&
          Number(assetBalance) >= Number(amount) &&
          cachedMethod === 'balance';
        if (balanceMethodAutoSelected) {
          stopBodyScroll(false, {
            disabled: true,
          });
          setStep(4);
        } else {
          setStep(3);
        }
      } else {
        snackbarStore.show(result);
      }
    };

    return (
      <div className="root w-auto mx-2">
        <div className="text-base text-gray-700">
          打赏给 <span className="font-bold">{toAuthor}</span>
        </div>
        {isIPhone && (
          <Tooltip placement="right" title="触发 input 的 focus">
            <div className="hidden" />
          </Tooltip>
        )}
        <div className="mt-3 text-gray-800">
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
            autoFocus
            fullWidth
            onKeyPress={(e: any) => e.key === 'Enter' && next(amount, selectedCurrency)}
            InputProps={{
              endAdornment: <InputAdornment position="end">{selectedCurrency}</InputAdornment>,
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
            onKeyPress={(e: any) => e.key === 'Enter' && next(amount, selectedCurrency)}
            inputProps={{ maxLength: 20 }}
          />
        </div>
        <div className="text-center mt-6" onClick={() => next(amount, selectedCurrency)}>
          <Button fullWidth={isMobile}>下一步</Button>
        </div>
        <div
          className="mt-4 text-sm md:text-xs text-blue-400 cursor-pointer"
          onClick={() => {
            setSelectedCurrency('');
            setAmount('');
            setStep(1);
          }}
        >
          选择其他币种
        </div>
        <style jsx>{`
          .root {
            width: ${isMobile ? '60vw' : 'auto'};
          }
        `}</style>
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
    const assetBalance = balance[selectedCurrency];
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

    return (
      <div>
        <div className="text-base font-bold text-gray-700">选择支付方式</div>
        {isIPhone && (
          <Tooltip placement="right" title="触发 input 的 focus">
            <div className="hidden" />
          </Tooltip>
        )}
        <div className="mt-6 mx-2 md:mx-4">
          {payments.map((payment: any) => (
            <div key={payment.method}>
              <div
                className={classNames(
                  {
                    'bg-blue-400 border-blue-400 text-white': payment.enabled,
                    'opacity-75 border-gray-400 text-gray-500 cursor-not-allowed': !payment.enabled,
                    'px-20': !openingMixinSchema,
                    'px-16': openingMixinSchema,
                  },
                  'flex justify-center items-center text-center border rounded md:px-12 p-3 mt-3 leading-none cursor-pointer',
                )}
                onClick={() => {
                  if (payment.enabled) {
                    localStorage.setItem('REWARD_METHOD', payment.method);
                    if (payment.method === 'mixin') {
                      if (isMixin) {
                        openRechargePaymentUrl();
                      } else {
                        loadRechargePaymentUrl();
                        setStep(5);
                      }
                    } else {
                      stopBodyScroll(false, {
                        disabled: true,
                      });
                      setStep(4);
                    }
                  }
                }}
              >
                <span
                  className={classNames({
                    'px-2': openingMixinSchema,
                  })}
                >
                  {payment.name}
                </span>
                {payment.method === 'mixin' && openingMixinSchema && (
                  <ButtonProgress isDoing={true} />
                )}
              </div>
              {!payment.enabled && (
                <div>
                  {payment.disabledReason === 'NO_ENOUGH_BALANCE' && (
                    <div className="mt-1 text-xs text-gray-500">
                      {selectedCurrency} 余额不足，去
                      <span
                        className="text-blue-400 cursor-pointer"
                        onClick={() =>
                          modalStore.openWallet({
                            tab: 'assets',
                            returnInfo: {
                              requiredCurrency: selectedCurrency,
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
                              requiredCurrency: selectedCurrency,
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
        <div className="flex justify-center mt-5 text-sm md:text-xs text-blue-400">
          <div className="cursor-pointer" onClick={() => setStep(2)}>
            返回
          </div>
        </div>
      </div>
    );
  };

  const step4 = () => {
    return (
      <div>
        <div className="text-lg font-bold text-gray-700">请输入支付密码</div>
        <div className="hidden md:block mt-5 text-xs">
          打赏给 <span className="font-bold">{toAuthor}</span>
        </div>
        <div className="mt-5 md:mt-3 text-xs pb-1">
          <span className="font-bold text-xl">{amount}</span> {selectedCurrency}
        </div>
        <div className="mt-5 text-gray-800">
          {!isPaid && !paying && (
            <div>
              <PinOTPInput value={pin} onChange={onOtpChange} />
              <div className="flex justify-center mt-6 text-sm md:text-xs text-blue-400">
                <div className="cursor-pointer" onClick={() => setStep(3)}>
                  选择其他支付方式
                </div>
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
          <div className="fixed-width text-center md:px-6 -mt-3 text-5xl text-blue-400">
            <Fade in={true} timeout={500}>
              <CheckCircleOutline />
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

  const step6 = () => {
    return (
      <div>
        <div className="text-lg font-bold text-gray-700">Mixin 支付</div>
        {isMobile && (
          <div className="pt-10 text-center">
            <Loading />
            <div className="mt-5 text-sm text-gray-600">已支付？请稍候，正在确认中...</div>
            <div className="mt-8 text-xs text-gray-500">
              您取消了支付？请
              <span
                className="font-bold text-blue-400"
                onClick={() => {
                  setOpeningMixinSchema(false);
                  setStep(3);
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

  return (
    <Modal open={open} onClose={() => onCloseModal(false)}>
      <div
        className={classNames(
          {
            'fixed-scroll': isIPhone && (step === 2 || step === 4) && !paying && !isPaid,
          },
          'p-8 md:px-10 bg-white rounded text-center',
        )}
      >
        {step === 1 && step1()}
        {step === 2 && step2()}
        {step === 3 && step3()}
        {step === 4 && step4()}
        {step === 5 && step5()}
        {step === 6 && step6()}
        <style jsx>{`
          .fixed-scroll {
            margin-top: -42vh;
          }
        `}</style>
      </div>
    </Modal>
  );
});
