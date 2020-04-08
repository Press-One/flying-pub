const Author = require('./sequelize/author');
const {
  Joi,
  assert,
  Errors,
  attempt
} = require('../models/validator');


const packAuthor = author => {
  return {
    address: author.address,
    name: author.name,
    avatar: author.avatar
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
    avatar: Joi.string().trim().optional()
  });
  const author = await getByAddress(address);
  if (author) {
    await Author.update(verifiedData, {
      where: {
        address
      }
    });
  } else {
    await Author.create({
      address,
      ...verifiedData
    });
  }
  return true;
}