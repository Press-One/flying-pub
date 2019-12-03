const Receipt = require('./sequelize/receipt');
const uuidV1 = require("uuid/v1");
const mathjs = require("mathjs");
const {
  Joi,
  assert,
  attempt,
  Errors
} = require("./validator");

const transferTypes = new Set(["REWARD", "WITHDRAW", "RECHARGE"]);

const transferObjectTypes = new Set(["FILE"]);

const parseAmount = amount => {
  return (
    /^-?\d+(\.\d+)?$/.test((amount = String(amount))) &&
    mathjs.larger("1000000000000000000000000000000", amount) && // max length = 30 // + 1 for checking
    mathjs.larger(amount, 0) &&
    amount
  );
};

exports.parseAmount = parseAmount;

const currencyMapAsset = {
  CNB: "965e5c6e-434c-3fa9-b780-c50f43cd955c",
  BTC: "c6d0c728-2624-429b-8e0d-d9d19b6592fa",
  ETH: "43d61dcd-e413-450d-80b8-101d5e903357",
  EOS: "6cfe566e-4aad-470b-8c9a-2fd35b49c68d",
  BOX: "f5ef6b5d-cc5a-3d90-b2c0-a2fd386e7a3c",
  PRS: "3edb734c-6d6f-32ff-ab03-4eb43640c758",
  XIN: "c94ac88f-4671-3976-b60a-09064f1811e8"
};

exports.currencyMapAsset = currencyMapAsset;

const maxAmount = {
  CNB: 1000000,
  BTC: 0.01,
  ETH: 0.1,
  EOS: 10,
  BOX: 20,
  PRS: 1000,
  XIN: 0.1,
};

const checkMaxAmount = (amount, currency) => {
  return Number(amount) <= maxAmount[currency];
}

const packReceipt = receipt => {
  return receipt.toJSON();
}

exports.getByUuid = async uuid => {
  assert(uuid, Errors.ERR_IS_REQUIRED('uuid'));
  const receipt = await Receipt.findOne({
    where: {
      uuid
    }
  });
  const derivedReceipt = packReceipt(receipt);
  return derivedReceipt;
};

exports.create = async (receipt) => {
  assert(receipt, Errors.ERR_IS_REQUIRED("receipt"));
  receipt = attempt(receipt, {
    fromAddress: Joi.string()
      .trim()
      .required(),
    toAddress: Joi.string()
      .trim()
      .required(),
    type: Joi.string()
      .trim()
      .required(),
    currency: Joi.string()
      .trim()
      .required(),
    amount: Joi.number().required(),
    status: Joi.string()
      .trim()
      .required(),
    provider: Joi.string()
      .trim()
      .required(),
    memo: Joi.string()
      .trim()
      .optional(),
    toProviderUserId: Joi.string()
      .trim()
      .optional(),
    fromProviderUserId: Joi.string()
      .trim()
      .optional(),
    objectType: Joi.string()
      .trim()
      .optional(),
    objectRId: Joi.string()
      .trim()
      .optional()
  });

  receipt.amount = parseAmount(receipt.amount);
  assert(receipt.amount, Errors.ERR_IS_INVALID("amount"));
  assert(checkMaxAmount(receipt.amount, receipt.currency), Errors.ERR_WALLET_GT_MAX_AMOUNT);
  assert(transferTypes.has(receipt.type), Errors.ERR_IS_INVALID("type"));
  assert(
    !receipt.objectType || transferObjectTypes.has(receipt.objectType),
    Errors.ERR_IS_INVALID("objectType")
  );
  assert(currencyMapAsset[receipt.currency], Errors.ERR_IS_INVALID("currency"));

  receipt.uuid = receipt.uuid || uuidV1();
  receipt.objectType = receipt.objectType || "";

  const newReceipt = await Receipt.create(receipt);
  return packReceipt(newReceipt);
};

exports.updateByUuid = async (uuid, data) => {
  assert(uuid, Errors.ERR_IS_REQUIRED('uuid'));
  assert(data, Errors.ERR_IS_REQUIRED('data'));
  await Receipt.update(data, {
    where: {
      uuid
    }
  })
  return true;
};


exports.list = async (options = {}) => {
  const {
    where,
    offset,
    limit,
    order = [],
  } = options;
  const receipts = await Receipt.findAll({
    where,
    offset,
    limit,
    order
  });
  const result = receipts.map((receipt) => {
    return packReceipt(receipt);
  })
  return result;
};