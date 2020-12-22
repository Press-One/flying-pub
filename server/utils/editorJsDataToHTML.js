module.exports = (data) => {
  const htmlParts = data.blocks.map((block) => {
    return parser[block.type](block.data)
  });
  console.log({ htmlParts });
  return htmlParts.join('');
}

const parser = {};

parser.header = (data) => {
  return `<h${data.level}>${data.text}</h${data.level}>`
}

parser.list = (data) => {
  const liHTML = data.items.map((item) => {
    return `<li>${item}</li>`
  }).join('');
  if (data.style === 'ordered') {
    return `<ol>${liHTML}</ol>`
  }
  return `<ul>${liHTML}</ul>`
}

parser.quote = (data) => {
  return `<blockquote>${data.text}</blockquote>`
}

parser.image = (data) => {
  return `<p><img src="${data.url}" alt="Image" /></p>`
}

parser.paragraph = (data) => {
  return `<p style="text-align${data.alignment}">${data.text}</p>`
}

parser.delimiter = () => {
  return `<hr />`
}

parser.raw = (data) => {
  return `<p>${data.html}</p>`
}

parser.table = (data) => {
  const trs = data.content.map(items => {
    return `<tr>${items.map(item => `<td>${item}</td>`).join('')}</tr>`
  }).join('');
  return `<table><tbody>${trs}</tbody></table>`
}
