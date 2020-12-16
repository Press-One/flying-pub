export default (data: any) => {
  const htmlParts = data.blocks.map((block: any) => {
    return parser[block.type](block.data)
  });
  console.log({ htmlParts });
  return htmlParts.join('');
}

const parser: any = {};

parser.header = (data: any) => {
  return `<h${data.level}>${data.text}</h${data.level}>`
}

parser.list = (data: any) => {
  const liHTML: string = data.items.map((item: any) => {
    return `<li>${item}</li>`
  }).join('');
  if (data.style === 'ordered') {
    return `<ol>${liHTML}</ol>`
  }
  return `<ul>${liHTML}</ul>`
}

parser.quote = (data: any) => {
  console.log(data.text);
  return `<blockquote>${data.text}</blockquote>`
}

parser.image = (data: any) => {
  return `<p><img src="${data.url}" alt="Image" /></p>`
}

parser.paragraph = (data: any) => {
  return `<p style="text-align: ${data.alignment}">${data.text}</p>`
}

parser.delimiter = () => {
  return `<hr />`
}

parser.raw = (data: any) => {
  return `<p>${data.html}</p>`
}

parser.table = (data: any) => {
  const trs = data.content.map((items: any) => {
    return `<tr>${items.map((item: any) => `<td>${item}</td>`).join('')}</tr>`
  }).join('');
  return `<table><tbody>${trs}</tbody></table>`
}