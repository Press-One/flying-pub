import React from 'react';
import { observer } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import Info from '@material-ui/icons/Info';
import CheckCircle from '@material-ui/icons/CheckCircle';
import Button from 'components/Button';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import NumberFormat from 'react-number-format';
import { sleep } from 'utils';
import { useStore } from 'store';
import Api from './api';

function NumberFormatCustom(props: any) {
  const { inputRef, onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={inputRef}
      onValueChange={values => {
        onChange({
          target: {
            value: values.value,
          },
        });
      }}
      isNumericString
    />
  );
}

export default observer(() => {
  const [oldPin, setOldPin] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [pin2, setPin2] = React.useState('');
  const { snackbarStore, walletStore } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        const isCustomPinExist = await Api.isCustomPinExist();
        walletStore.setIsCustomPinExist(isCustomPinExist);
      } catch (err) {}
      await sleep(800);
      walletStore.setIsFetchedIsCustomPinExist(true);
    })();
  }, [walletStore]);

  const submit = async (pin: string, pin2: string, options: any = {}) => {
    const { isCustomPinExist, oldPin } = options;
    if (isCustomPinExist) {
      if (!oldPin || oldPin.length !== 6) {
        snackbarStore.show({
          message: '请输入旧的支付密码',
          type: 'error',
        });
        return;
      }
    }
    if (!pin || pin.length !== 6) {
      snackbarStore.show({
        message: '请输入6位支付密码',
        type: 'error',
      });
      return;
    }
    if (!pin2 || pin2.length !== 6) {
      snackbarStore.show({
        message: '请再输入一次6位密码',
        type: 'error',
      });
      return;
    }
    if (pin !== pin2) {
      snackbarStore.show({
        message: '两次密码不匹配',
        type: 'error',
      });
      return;
    }
    try {
      const payload: any = {
        pinCode: pin,
      };
      if (isCustomPinExist) {
        payload.oldPinCode = oldPin;
      }
      await Api.updatePin(payload);
      const latestIsCustomPinExist = await Api.isCustomPinExist();
      walletStore.setIsCustomPinExist(latestIsCustomPinExist);
      setPin('');
      setPin2('');
    } catch (err) {
      snackbarStore.show({
        message: '旧密码输入错误',
        type: 'error',
      });
      setOldPin('');
    }
  };

  const { isFetchedIsCustomPinExist, isCustomPinExist } = walletStore;

  if (!isFetchedIsCustomPinExist) {
    return (
      <div className="mt-32">
        <Loading />
      </div>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <div className="text-sm mt-5">
        {isCustomPinExist && (
          <div className="mb-4 text-green-500 flex items-center text-lg">
            <CheckCircle />
            <span className="text-sm ml-1">支付密码已设置</span>
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
        <div className="font-bold">{isCustomPinExist ? '修改' : '设置'}支付密码</div>
        <div className="text-gray-800">
          <div className="-mt-1" />
          {isCustomPinExist && (
            <div>
              <TextField
                value={oldPin}
                placeholder="旧的支付密码"
                onChange={(event: any) => {
                  if (event.target.value.length <= 6) {
                    setOldPin(event.target.value);
                  }
                }}
                margin="normal"
                variant="outlined"
                type="password"
                InputProps={{
                  inputComponent: NumberFormatCustom,
                }}
              />
              <div className="-mt-2" />
            </div>
          )}
          <TextField
            value={pin}
            placeholder={`6位支付密码（纯数字）`}
            onChange={(event: any) => {
              if (event.target.value.length <= 6) {
                setPin(event.target.value);
              }
            }}
            margin="normal"
            variant="outlined"
            type="password"
            InputProps={{
              inputComponent: NumberFormatCustom,
            }}
          />
          <div className="-mt-2" />
          <TextField
            value={pin2}
            placeholder="再输入一次6位密码"
            onChange={(event: any) => {
              if (event.target.value.length <= 6) {
                setPin2(event.target.value);
              }
            }}
            margin="normal"
            variant="outlined"
            type="password"
            InputProps={{
              inputComponent: NumberFormatCustom,
            }}
          />
          <div className="flex items-center text-gray-500 mt-1">
            <Info />
            <span className="text-xs ml-1">支付密码将用于支付和提现，请牢牢记住哦</span>
          </div>
          <div className="mt-4">
            <Button onClick={() => submit(pin, pin2, { oldPin, isCustomPinExist })}>保存</Button>
          </div>
        </div>
      </div>
    </Fade>
  );
});
