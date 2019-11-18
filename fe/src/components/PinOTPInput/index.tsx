import React from 'react';
import OTPInput from 'otp-input-react';
import { isMobile, isPc } from 'utils';

export default (props: any) => {
  const { value = '', onChange } = props;
  return (
    <div>
      <OTPInput
        inputClassName="border border-gray-400 rounded opt-input"
        value={value}
        onChange={onChange}
        autoFocus
        OTPLength={6}
        otpType="number"
        secure={isPc}
      />
      <div className="md:hidden flex justify-center">
        {'......'.split('').map((_value, index) => (
          <div className="fake-input flex justify-center" key={index}>
            {value.length > index && <i className="dot w-2 h-2 rounded-full bg-gray-700"></i>}
          </div>
        ))}
      </div>
      <style jsx>{`
        .fake-input {
          width: 32px;
          height: 0;
          margin: 0 2px;
        }
        .fake-input .dot {
          margin-top: -20px;
        }
      `}</style>
      <style jsx global>{`
        .opt-input {
          margin: 0 2px !important;
          color: ${isMobile ? '#fff' : 'inherit'};
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
};
