import React from 'react';
import { observer } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import Button from 'components/Button';
import NumberFormat from 'react-number-format';
import { useStore } from 'store';
import FinanceApi from './api';

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
    fetchIsCustomPinExist();
  }, []);

  const fetchIsCustomPinExist = async () => {
    try {
      const isCustomPinExist = await FinanceApi.isCustomPinExist();
      walletStore.setIsCustomPinExist(isCustomPinExist);
    } catch (err) {
      console.log(` ------------- err ---------------`, err);
    }
  };

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
      await FinanceApi.updatePin(payload);
      snackbarStore.show({
        message: '密码设置成功',
      });
    } catch (err) {
      snackbarStore.show({
        message: '旧密码输入错误',
        type: 'error',
      });
    }
  };

  const { isCustomPinExist } = walletStore;

  return (
    <div className="text-sm mt-5">
      <div className="font-bold">设置支付密码</div>
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
        <div className="mt-2">
          <Button onClick={() => submit(pin, pin2, { oldPin, isCustomPinExist })}>保存</Button>
        </div>
      </div>
    </div>
  );
});
