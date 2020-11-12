import * as EasyMDE from 'easymde';
import marked from 'marked';
import { initMathJax } from '../../utils';

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
    setTimeout(() => {
      initMathJax(previewElement);
    }, 0);
    return marked.parse(markdownPlaintext);
  },
  toolbar: [
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
      action: EasyMDE.drawLink,
      className: 'fa fa-link',
      title: '链接',
    },
    '|',
    'preview',
  ],
};

export default options;
