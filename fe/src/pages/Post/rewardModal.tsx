import React from 'react';
import Modal from '@material-ui/core/Modal';
import { assets, assetIconMap } from '../Wallet/utils';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from 'components/Button';
import OTPInput from 'otp-input-react';
import Loading from 'components/Loading';
import { useStore } from 'store';
import Api from './api';

export default (props: any) => {
  const { open, onClose } = props;
  const [step, setStep] = React.useState(1);
  const [selectedAsset, setSelectedAsset] = React.useState('cnb');
  const [amount, setAmount] = React.useState('0.01');
  const [memo, setMemo] = React.useState('打赏给刘娟娟');
  const [paymentMethod, setPaymentMethod] = React.useState('mixin');
  const [pin, setPin] = React.useState('');
  const [paying, setPaying] = React.useState(false);
  const [paymentUrl, setPaymentUrl] = React.useState('');
  const [iframeLoading, setIframeLoading] = React.useState(false);
  const { snackbarStore } = useStore();

  const onCloseModal = () => {
    setStep(1);
    setAmount('');
    setMemo('');
    setPin('');
    onClose();
  };

  const toAddress = '501a3fd577eddf7d1913ff26f5eb3178809e8f97';
  const blockPaymentUrl = 'mixin://transfer/44931a6d-2029-4c8d-888f-cbb3afe509bb';
  const toMixinClientId = blockPaymentUrl.split('/').pop();
  const fileRId = 'c3f36d65714d0ae6136c0eec9d7dde32a3d85753d3dc4c3a8615de58a60bd768';

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
            await Api.reward(
              fileRId,
              {
                toAddress,
                currency: selectedAsset.toUpperCase(),
                amount,
                memo,
                toMixinClientId,
              },
              {
                method: 'balance',
              },
            );
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

  const getRewardPaymentUrl = async () => {
    setIframeLoading(true);
    try {
      const { paymentUrl } = await Api.reward(
        fileRId,
        {
          toAddress,
          currency: selectedAsset.toUpperCase(),
          amount,
          memo,
          toMixinClientId,
        },
        {
          method: 'mixin',
        },
      );
      console.log(` ------------- paymentUrl ---------------`, paymentUrl);
      setPaymentUrl(paymentUrl);
    } catch (err) {
      console.log(` ------------- err ---------------`, err);
    }
  };

  const step1 = () => {
    return (
      <div>
        <div>选择币种</div>
        <div className="flex flex-wrap justify-between mt-3 w-64">
          {assets.map((asset: any) => {
            return (
              <div key={asset} className="p-2" title={asset.toUpperCase()}>
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
                  <div className="mt-2 leading-none text-xs">{asset.toUpperCase()}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-5">
          <Button onClick={() => setStep(2)}>下一步</Button>
        </div>
      </div>
    );
  };

  const step2 = () => {
    return (
      <div>
        <div>
          打赏给 <span className="font-bold">刘娟娟</span>
        </div>
        <div className="mt-2 text-gray-800">
          <TextField
            value={amount}
            placeholder="数量"
            onChange={(event: any) => setAmount(event.target.value)}
            margin="normal"
            variant="outlined"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">{selectedAsset.toUpperCase()}</InputAdornment>
              ),
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
        <div className="text-center mt-5">
          <Button onClick={() => setStep(3)}>下一步</Button>
        </div>
      </div>
    );
  };

  const step3 = () => {
    const types: any = [
      {
        method: 'balance',
        name: '余额支付',
      },
      {
        method: 'mixin',
        name: 'Mixin 扫码支付',
      },
    ];
    return (
      <div>
        <div className="text-lg">选择支付方式</div>
        <div className="mt-5 mx-10">
          {types.map((type: any) => (
            <div
              key={type.method}
              className={classNames(
                {
                  'border-blue-400 text-blue-400': type.method === paymentMethod,
                  'border-gray-300 text-gray-600': type.method !== paymentMethod,
                },
                'font-bold text-center border rounded p-2 px-4 cursor-pointer mt-3',
              )}
              onClick={() => setPaymentMethod(type.method)}
            >
              {type.name}
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button
            onClick={() => {
              if (paymentMethod === 'mixin') {
                getRewardPaymentUrl();
                setStep(5);
              } else {
                setStep(4);
              }
            }}
          >
            确认支付
          </Button>
        </div>
      </div>
    );
  };

  const step4 = () => {
    return (
      <div>
        <div className="text-lg">请输入支付密码</div>
        <div className="mt-4 text-xs">
          打赏给 <span className="font-bold">刘娟娟</span>
        </div>
        <div className="mt-2 text-xs">
          <span className="font-bold text-lg">{amount}</span> {selectedAsset.toUpperCase()}
        </div>
        <div className="mt-5 pb-2 text-gray-800">
          {!paying && (
            <OTPInput
              inputClassName="border border-gray-400 rounded opt-input"
              value={pin}
              onChange={onOtpChange}
              autoFocus
              OTPLength={6}
              otpType="number"
              secure
            />
          )}
        </div>
        {paying && (
          <div className="px-20 mx-2">
            <Loading />
          </div>
        )}
      </div>
    );
  };

  const step5 = () => {
    return (
      <div>
        <div className="text-lg">Mixin 扫码支付</div>
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
                className="mixin-payment-iframe"
                title="Mixin 扫码支付"
                src={paymentUrl}
              ></iframe>
            </div>
          )}
          {iframeLoading && (
            <div className="mt-24 pt-4">
              <Loading />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal open={open} onClose={onCloseModal} className="flex justify-center items-center">
      <div className="p-8 bg-white rounded text-center">
        {step === 1 && step1()}
        {step === 2 && step2()}
        {step === 3 && step3()}
        {step === 4 && step4()}
        {step === 5 && step5()}
      </div>
    </Modal>
  );
};
