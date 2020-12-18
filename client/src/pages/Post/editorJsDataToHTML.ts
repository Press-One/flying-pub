interface EditorJsData {
  blocks: Block[];
  time: string;
  version: string;
}

interface Block {
  type: string;
  data: Data;
}

interface Data {
  header?: Header;
  list?: List;
  quote?: Quote;
  image?: Image;
  paragraph?: Paragraph;
  delimiter?: {};
  raw?: Raw;
  table?: Table;
}

interface Header {
  level: number;
  text: string;
}

interface List {
  style: string;
  items: string[];
}

interface Quote {
  text: string;
}

interface Image {
  url: string;
}

interface Paragraph {
  alignment: string;
  text: string;
}

interface Raw {
  html: string;
}

interface Table {
  content: string[][];
}

export default (data: EditorJsData) => {
  const htmlParts = data.blocks.map((block) => {
    return parser[block.type](block.data)
  });
  console.log({ htmlParts });
  return htmlParts.join('');
}

const parser: any = {};

parser.header = (data: Header) => {
  return `<h${data.level}>${data.text}</h${data.level}>`
}

parser.list = (data: List) => {
  const liHTML: string = data.items.map((item: any) => {
    return `<li>${item}</li>`
  }).join('');
  if (data.style === 'ordered') {
    return `<ol>${liHTML}</ol>`
  }
  return `<ul>${liHTML}</ul>`
}

parser.quote = (data: Quote) => {
  return `<blockquote>${data.text}</blockquote>`
}

parser.image = (data: Image) => {
  return `<p><img src="${data.url}" alt="Image" /></p>`
}

parser.paragraph = (data: Paragraph) => {
  return `<p style="text-align: ${data.alignment}">${data.text}</p>`
}

parser.delimiter = () => {
  return `<hr />`
}

parser.raw = (data: Raw) => {
  return `<p>${data.html}</p>`
}

parser.table = (data: Table) => {
  const trs = data.content.map(items => {
    return `<tr>${items.map(item => `<td>${item}</td>`).join('')}</tr>`
  }).join('');
  return `<table><tbody>${trs}</tbody></table>`
}