import React from 'react';
import { MdComputer } from 'react-icons/md';

export default () => {
  return (
    <div className="page-layout-wrapper">
      <div
        className="page-layout user-center flex flex-col justify-center items-center"
        style={{ height: '100vh' }}
      >
        <div className="text-5xl primary-color">
          <MdComputer />
        </div>
        <span className="mt-2 text-lg primary-color font-bold">请在电脑端打开链接</span>
        <span className="mt-2 text-blue-400 text-base">{window.location.origin}</span>
      </div>
    </div>
  );
};
