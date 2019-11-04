import React from 'react';
import { observer } from 'mobx-react-lite';
import Modal from '@material-ui/core/Modal';
import { assets, assetIconMap } from '../../components/WalletModal/Wallet/utils';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Check from '@material-ui/icons/Check';
import Info from '@material-ui/icons/Info';
import Button from 'components/Button';
import OTPInput from 'otp-input-react';
import Loading from 'components/Loading';
import { useStore } from 'store';
import Api from './api';
import WalletApi from 'components/WalletModal/Wallet/api';
import { sleep } from 'utils';

export default observer((props: any) => {
  const { userStore, socketStore, walletStore, modalStore } = useStore();
  const { isLogin } = userStore;
  const { open, onClose } = props;
  const [step, setStep] = React.useState(1);
  const [selectedAsset, setSelectedAsset] = React.useState('CNB');
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const [isPaid, setIsPaid] = React.useState(false);
  const [paymentUrl, setPaymentUrl] = React.useState('');
  const [iframeLoading, setIframeLoading] = React.useState(false);
  const { snackbarStore } = useStore();

  const toAddress = '501a3fd577eddf7d1913ff26f5eb3178809e8f97';
  const fileRId = 'c3f36d65714d0ae6136c0eec9d7dde32a3d85753d3dc4c3a8615de58a60bd768';
  const blockPaymentUrl = 'mixin://transfer/44931a6d-2029-4c8d-888f-cbb3afe509bb';
  const toMixinClientId = blockPaymentUrl.split('/').pop();

  React.useEffect(() => {
    const afterRecharge = async (data: any) => {
      const { receipt } = data;
      await Api.reward(fileRId, {
        toAddress,
        currency: receipt.currency,
        amount: receipt.amount,
        memo: receipt.memo,
        toMixinClientId,
      });
      setStep(1);
      setAmount('');
      setMemo('');
      setPin('');
      setPaying(false);
      setIsPaid(false);
      onClose(true);
    };
    if (isLogin) {
      socketStore.on('recharge', afterRecharge);
    }
    return () => {
      socketStore.off('recharge', afterRecharge);
    };
  }, [
    isLogin,
    socketStore,
    fileRId,
    toAddress,
    selectedAsset,
    amount,
    memo,
    toMixinClientId,
    onClose,
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
          const isValid = await Api.validatePin({
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
            await sleep(800);
            onCloseModal(true);
            await sleep(300);
            snackbarStore.show({
              message: '打赏成功',
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
      <div>
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
                  <img src={assetIconMap[asset]} alt={asset} width="30" />
                  <div className="mt-2 leading-none text-xs">{asset}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-6">
          <Button onClick={() => setStep(2)}>下一步</Button>
        </div>
      </div>
    );
  };

  const step2 = () => {
    return (
      <div>
        <div className="text-base text-gray-700">
          打赏给 <span className="font-bold">刘娟娟</span>
        </div>
        <div className="mt-3 text-gray-800">
          <TextField
            value={amount}
            placeholder="数量"
            onChange={(event: any) => setAmount(event.target.value)}
            margin="normal"
            variant="outlined"
            autoFocus
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">{selectedAsset}</InputAdornment>,
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
        <div className="text-center mt-6">
          <Button onClick={() => setStep(3)}>下一步</Button>
        </div>
      </div>
    );
  };

  const step3 = () => {
    const { balance, isCustomPinExist } = walletStore;
    const assetBalance = balance[selectedAsset];
    const payments: any = [
      {
        enabled: true,
        method: 'mixin',
        name: 'Mixin 扫码支付',
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
        <div className="mt-6 mx-10">
          {payments.map((payment: any) => (
            <div key={payment.method}>
              <div
                className={classNames(
                  {
                    'border-blue-400 text-blue-400 font-bold cursor-pointer':
                      payment.enabled && payment.method === (paymentMethod || payments[0].method),
                    'border-gray-300 text-gray-600 cursor-pointer':
                      payment.enabled && payment.method !== (paymentMethod || payments[0].method),
                    'opacity-75 border-gray-400 text-gray-500 cursor-not-allowed': !payment.enabled,
                  },
                  'text-center border rounded p-2 px-4 mt-3',
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
                        onClick={modalStore.openWallet}
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
          打赏给 <span className="font-bold">刘娟娟</span>
        </div>
        <div className="mt-2 text-xs pb-1">
          <span className="font-bold text-lg">{amount}</span> {selectedAsset}
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

  const step5 = () => {
    return (
      <div>
        <div className="text-lg font-bold text-gray-700">Mixin 扫码支付</div>
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
                title="Mixin 扫码支付"
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
    <Modal
      open={open}
      onClose={() => onCloseModal(false)}
      className="flex justify-center items-center"
    >
      <div className="p-8 bg-white rounded text-center">
        {step === 1 && step1()}
        {step === 2 && step2()}
        {step === 3 && step3()}
        {step === 4 && step4()}
        {step === 5 && step5()}
      </div>
    </Modal>
  );
});
