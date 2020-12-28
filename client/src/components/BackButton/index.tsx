import React from 'react';
import { observer } from 'mobx-react-lite';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import ButtonOutlined from 'components/ButtonOutlined';
import { useStore } from 'store';
import { useHistory } from 'react-router-dom';

export default observer((props: any) => {
  const history = useHistory();
  const { pathStore } = useStore();
  const { prevPath } = pathStore;

  return (
    <div
      className={`absolute top-0 left-0 cursor-pointer transform scale-90 ${props.className || ''}`}
    >
      <div onClick={() => (prevPath ? history.goBack() : history.push('/'))}>
        <ButtonOutlined>
          <div className="p-1 flex justify-center items-center">
            <ArrowBackIos /> 返回
          </div>
        </ButtonOutlined>
      </div>
    </div>
  );
});
