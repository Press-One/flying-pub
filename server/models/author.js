const Author = require('./sequelize/author');
const Log = require('./log');
const {
  Joi,
  assert,
  Errors,
  attempt
} = require('../utils/validator');

const packAuthor = author => {
  return {
    status: author.status,
    address: author.address,
    name: author.name,
    avatar: author.avatar,
    bio: author.bio
  };
}
exports.packAuthor = packAuthor;

const getByAddress = async (address) => {
  assert(address, Errors.ERR_IS_REQUIRED('address'))
  const author = await Author.findOne({
    where: {
      address
    }
  });
  return author ? packAuthor(author.toJSON()) : null;
}
exports.getByAddress = getByAddress;

exports.upsert = async (address, data) => {
  assert(address, Errors.ERR_IS_REQUIRED('address'))
  assert(data, Errors.ERR_IS_REQUIRED('data'))
  const verifiedData = attempt(data, {
    status: Joi.string().trim().optional(),
    name: Joi.string().trim().optional(),
    avatar: Joi.string().trim().optional(),
    bio: Joi.string().empty('').optional()
  });
  const author = await getByAddress(address);
  if (author) {
    await Author.update(verifiedData, {
      where: {
        address
      }
    });
    if (data.status) {
      Log.createAnonymity('更新作者状态', `${address} ${data.status}`);
    } else {
      Log.createAnonymity('更新作者资料', `${address}`);
    }
  } else {
    verifiedData.status = verifiedData.status || 'allow';
    await Author.create({
      address,
      ...verifiedData
    });
    Log.createAnonymity('创建作者', `${address}`);
  }
  return true;
}