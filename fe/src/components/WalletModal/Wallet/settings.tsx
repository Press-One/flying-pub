import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import Info from '@material-ui/icons/Info';
import CheckCircle from '@material-ui/icons/CheckCircle';
import Button from 'components/Button';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import Modal from 'components/Modal';
import PinOTPInput from 'components/PinOTPInput';
import { sleep, isMobile, isIPhone, stopBodyScroll } from 'utils';
import { useStore } from 'store';
import Api from './api';

export default observer(() => {
  const [step, setStep] = React.useState(1);
  const [oldPin, setOldPin] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [pin2, setPin2] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [errMessage, setErrMessage] = React.useState('');
  const [openModal, setOpenModal] = React.useState(false);
  const { snackbarStore, walletStore } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        const isCustomPinExist = await Api.isCustomPinExist();
        walletStore.setIsCustomPinExist(isCustomPinExist);
        if (!isCustomPinExist) {
          setStep(2);
        }
      } catch (err) {}
      await sleep(800);
      walletStore.setIsFetchedIsCustomPinExist(true);
    })();
  }, [walletStore, setStep]);

  const { isFetchedIsCustomPinExist, isCustomPinExist } = walletStore;

  if (!isFetchedIsCustomPinExist) {
    return (
      <div className="root">
        <div className="my-32">
          <Loading />
        </div>
        <style jsx>{`
          .root {
            height: 50vh;
          }
        `}</style>
      </div>
    );
  }

  const onCloseModal = () => {
    setStep(isCustomPinExist ? 1 : 2);
    setOldPin('');
    setPin('');
    setPin2('');
    setErrMessage('');
    setPending(false);
    setIsVerified(false);
    setOpenModal(false);
  };

  const step1 = () => {
    const onOtpChange = (value: string) => {
      setOldPin(value);
      if (value.length === 6) {
        setStep(2);
      }
    };
    return (
      <div>
        <div className="text-sm text-gray-600">请输入旧的密码</div>
        <div className="mt-5 py-2 text-gray-800">
          {!isVerified && !pending && <PinOTPInput value={oldPin} onChange={onOtpChange} />}
        </div>
      </div>
    );
  };

  const step2 = () => {
    const onOtpChange = (value: string) => {
      setPin(value);
      if (value.length === 6) {
        setStep(3);
      }
    };
    return (
      <Fade in={true} timeout={500}>
        <div>
          <div className="text-sm text-gray-600">请输入新的密码</div>
          <div className="mt-5 py-2 text-gray-800">
            {!pending && <PinOTPInput value={pin} onChange={onOtpChange} />}
          </div>
        </div>
      </Fade>
    );
  };

  const step3 = () => {
    const onOtpChange = (value: string) => {
      setPin2(value);
      if (value.length === 6) {
        console.log(` ------------- step ---------------`, step);
        console.log(` ------------- pin ---------------`, pin);
        console.log(` ------------- value ---------------`, value);
        if (pin !== value) {
          if (isMobile) {
            setErrMessage('两次密码不匹配');
          } else {
            snackbarStore.show({
              message: '两次密码不匹配',
              type: 'error',
            });
          }
          setPin('');
          setPin2('');
          setStep(2);
          return;
        }
        setErrMessage('');
        setPending(true);
        setTimeout(async () => {
          const payload: any = {
            pinCode: pin,
          };
          if (isCustomPinExist) {
            payload.oldPinCode = oldPin;
            try {
              const isValid = await Api.validatePin({
                pinCode: oldPin,
              });
              if (!isValid) {
                snackbarStore.show({
                  message: '旧密码错误，请重试',
                  type: 'error',
                });
                onCloseModal();
                return;
              }
            } catch (err) {
              console.log(` ------------- err ---------------`, err);
            }
          }
          try {
            await Api.updatePin(payload);
            const latestIsCustomPinExist = await Api.isCustomPinExist();
            setPending(false);
            setIsVerified(true);
            await sleep(1000);
            onCloseModal();
            await sleep(400);
            walletStore.setIsCustomPinExist(latestIsCustomPinExist);
            snackbarStore.show({
              message: '密码设置成功',
            });
          } catch (err) {
            onCloseModal();
            snackbarStore.show({
              message: '密码设置失败',
            });
          }
          setPending(false);
        }, 500);
      }
    };
    return (
      <Fade in={true} timeout={500}>
        <div>
          <div className="text-sm text-gray-600">再次输入新的密码</div>
          <div className="mt-5 py-2 text-gray-800">
            {!isVerified && !pending && <PinOTPInput value={pin2} onChange={onOtpChange} />}
          </div>
          {!isVerified && pending && (
            <div className="fixed-width flex items-center justify-center md:px-6">
              <Loading size={38} />
            </div>
          )}
          {isVerified && (
            <div className="fixed-width flex items-center justify-center md:px-6 text-5xl text-blue-400">
              <Fade in={true} timeout={500}>
                <CheckCircleOutline className="-mt-2" />
              </Fade>
            </div>
          )}
          <style jsx>{`
            .fixed-width {
              width: 168px;
              height: 44px;
              padding-bottom: 5px;
              box-sizing: content-box;
            }
          `}</style>
        </div>
      </Fade>
    );
  };

  return (
    <Fade in={true} timeout={500}>
      <div className="text-sm mt-5 root text-center">
        <div>
          {isCustomPinExist && (
            <div className="mb-6 md:mb-4 text-green-500 flex flex-col md:flex-row items-center justify-center md:justify-start text-5xl md:text-lg mt-6 md:mt-0">
              <CheckCircle />
              <span className="text-sm mt-2 md:mt-0 md:ml-1">支付密码已设置</span>
            </div>
          )}
          {!isCustomPinExist && (
            <div className="p-3 border border-blue-400 text-blue-400 bg-blue-100 flex items-center rounded mb-5">
              <span className="flex items-center mr-1 text-lg">
                <Info />
              </span>
              尚未设置支付密码
            </div>
          )}
        </div>
        <div className="md:hidden flex items-center justify-center text-gray-500 mb-2">
          <Info />
          <span className="text-xs ml-1">支付密码将用于支付和提现，请牢牢记住哦</span>
        </div>
        <div className="text-center md:text-left">
          <Button
            onClick={() => {
              stopBodyScroll(false, {
                disabled: true,
              });
              setOpenModal(true);
            }}
            fullWidth={isMobile}
          >
            {isCustomPinExist ? '重置' : '设置'}支付密码
          </Button>
        </div>
        <div className="hidden md:flex items-center text-gray-500 mt-2">
          <Info />
          <span className="text-xs ml-1">支付密码将用于支付和提现，请牢牢记住哦</span>
        </div>
        <Modal open={openModal} onClose={() => onCloseModal()}>
          <div
            className={classNames(
              {
                'fixed-scroll': isIPhone && !pending && !isVerified,
              },
              'p-8 bg-white rounded text-center mx-5',
            )}
          >
            <div className="text-lg font-bold text-gray-700 pb-5">
              {isCustomPinExist ? '重置' : '设置'}支付密码
            </div>
            {step === 1 && step1()}
            {step === 2 && step2()}
            {step === 3 && step3()}
            {isMobile && errMessage && (
              <div className="text-xs text-center text-red-400 mt-2">{errMessage}</div>
            )}
          </div>
        </Modal>
        <style jsx>{`
          .fixed-scroll {
            margin-top: -42vh;
          }
          .root {
            height: 160px;
          }
        `}</style>
      </div>
    </Fade>
  );
});
