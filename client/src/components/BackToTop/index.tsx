import React from 'react';
import ButtonOutlined from 'components/ButtonOutlined';
import ArrowUpward from '@material-ui/icons/ArrowUpward';

export default () => {
  const backToTop = () => {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      window.scroll(0, 0);
    }
  };

  return (
    <div className="fixed bottom-0 mb-8 cursor-pointer root" onClick={backToTop}>
      <ButtonOutlined className="py-8-px px-10-px">
        <div className="text-xl">
          <ArrowUpward />
        </div>
      </ButtonOutlined>
      <style jsx>{`
        .root {
          left: 50%;
          margin-left: 450px;
        }
      `}</style>
    </div>
  );
};
