import React from 'react';
import { Link } from 'react-router-dom';
import ArrowBackIos from '@material-ui/icons/ArrowBackIos';
import ButtonOutlined from 'components/ButtonOutlined';

export default () => {
  return (
    <div className="absolute top-0 left-0 -ml-32">
      <Link to={`/`}>
        <ButtonOutlined>
          <div className="p-1 flex justify-center items-center">
            <ArrowBackIos /> 返回
          </div>
        </ButtonOutlined>
      </Link>
    </div>
  );
};
