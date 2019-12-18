import React from 'react';
import { observer } from 'mobx-react-lite';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import ButtonOutlined from 'components/ButtonOutlined';
import { useStore } from 'store';

export default observer((props: any) => {
  const { pathStore } = useStore();
  const { prevPath } = pathStore;

  return (
    <div className="absolute top-0 left-0 -ml-32 cursor-pointer">
      <div onClick={() => (prevPath ? props.history.goBack() : props.history.push('/'))}>
        <ButtonOutlined>
          <div className="p-1 flex justify-center items-center">
            <ArrowBackIos /> 返回
          </div>
        </ButtonOutlined>
      </div>
    </div>
  );
});
