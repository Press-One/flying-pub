export const assets = ['CNB', 'BTC', 'ETH', 'EOS', 'BOX', 'PRS'];

export const assetIconMap: any = {
  CNB: 'https://xue-images.pek3b.qingstor.com/1025-cnb.png',
  BTC: 'https://xue-images.pek3b.qingstor.com/1024-btc.png',
  ETH: 'https://xue-images.pek3b.qingstor.com/1024-eth.png',
  EOS: 'https://xue-images.pek3b.qingstor.com/1024-eos.png',
  BOX: 'https://xue-images.pek3b.qingstor.com/1024-box.png',
  PRS: 'https://xue-images.pek3b.qingstor.com/1024-prs.png',
  XIN: 'https://xue-images.pek3b.qingstor.com/1024-xin.png',
};

export const getPostsSiteDomain = () => {
  return '';
};

const maxAmount: any = {
  CNB: 1000000,
  BTC: 0.1,
  ETH: 1,
  EOS: 1,
  BOX: 100,
  PRS: 100,
  XIN: 10,
};

export const checkAmount = (amount: string, currency: string, balance?: any) => {
  if (!amount) {
    return {
      message: `请输入金额`,
      type: 'error'
    };
  }
  if (balance) {
    const isGtBalance = Number(amount) > balance[currency];
    if (isGtBalance) {
      return {
        message: `你的 ${currency} 余额只有 ${balance[currency]} 个`,
        type: 'error'
      };
    }
  }
  const isGtMax = Number(amount) > maxAmount[currency];
  if (isGtMax) {
    return {
      message: `${currency} 单次最大交易金额不能超过 ${maxAmount[currency]} 个`,
      type: 'error'
    };
  }
  return {
    ok: true
  };
};