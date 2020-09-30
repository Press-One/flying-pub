const request = require('request-promise');
const {
  throws,
  Errors,
} = require('../../utils/validator')

const fetchPressOnePost = async id => {
  let file
  try {
    file = await request({
      timeout: 10000,
      url: `https://press.one/api/v2/files/${id}`,
      json: true,
    })
  } catch (e) {
    if (e.statusCode === 404) {
      throws(Errors.ERR_IS_INVALID('url'))
    }
    throw e
  }

  const title = file.cache.title
  const cacheUrl = file.cache.cacheUrl

  let fileContent = await request({
    timeout: 10000,
    url: cacheUrl,
  })

  const images = fileContent.match(/\(prs:\/\/file\?rId=(.+?)\)/g)

  if (images) {
    const imageIds = Array.from(images).map((image) => {
      const imageId = image.match(/\(prs:\/\/file\?rId=(.+?)\)/)[1]
      return imageId
    })

    const imageList = await request({
      timeout: 10000,
      url: `https://press.one/api/v2/blocks/${imageIds.join(',')}?withDetail=true`,
      json: true,
    });

    const imageUrlMap = {};
    for (const image of imageList) {
      imageUrlMap[image.id] = image.url;
    }

    Array.from(images).forEach((image, i) => {
      const imageId = imageIds[i];
      const url = imageUrlMap[imageId];
      if (url) {
        fileContent = fileContent.replace(image, `(${url})`);
      }
    })
  }

  return {
    title,
    content: fileContent,
    mimeType: 'text/markdown',
  };
}

module.exports = fetchPressOnePost;