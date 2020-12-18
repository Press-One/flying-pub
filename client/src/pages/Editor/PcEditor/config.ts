import * as EasyMDE from 'easymde';
import marked from 'marked';
import { isPc } from 'utils';

marked.setOptions({
  highlight: (code: string) => {
    return require('highlight.js').highlightAuto(code).value;
  },
});

const options: EasyMDE.Options = {
  autoDownloadFontAwesome: false,
  lineWrapping: true,
  spellChecker: false,
  status: false,
  placeholder: '开始创作你的文章...',
  shortcuts: {
    drawTable: 'Cmd-Alt-T',
  },
  previewRender: (markdownPlaintext: string, previewElement: HTMLElement) => {
    return marked.parse(markdownPlaintext);
  },
  toolbar: isPc ? [
    {
      name: 'bold',
      action: EasyMDE.toggleBold,
      className: 'fa fa-bold',
      title: '黑体',
    },
    {
      name: 'italic',
      action: EasyMDE.toggleItalic,
      className: 'fa fa-italic',
      title: '斜体',
    },
    '|',
    {
      name: 'quote',
      action: EasyMDE.toggleBlockquote,
      className: 'fa fa-quote-left',
      title: "引用",
    },
    {
      name: 'unordered-list',
      action: EasyMDE.toggleUnorderedList,
      className: 'fa fa-list-ul',
      title: '无序列表',
    },
    {
      name: 'ordered-list',
      action: EasyMDE.toggleOrderedList,
      className: 'fa fa-list-ol',
      title: '有序列表',
    },
    {
      name: 'table',
      action: EasyMDE.drawTable,
      className: 'fa fa-table',
      title: '表格',
    },
    '|',
    {
      name: 'link',
      action: () => {
        console.log('will be replaced');
      },
      className: 'fa fa-link',
      title: '链接',
    },
    {
      name: 'image',
      action: () => {
        console.log('will be replaced');
      },
      className: 'fa fa-image',
      title: '插入图片',
    },
    '|',
    'preview',
  ] : false,
};

export default options;
