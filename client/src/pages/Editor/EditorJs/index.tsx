import React from 'react';
import { observer } from 'mobx-react-lite';
import EditorJS from '@editorjs/editorjs';
import i18n from './i18n';

import './index.scss';

export default observer((props: any) => {
  const editorRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = new EditorJS({
        holder: 'editorjs',
        data: props.data,
        tools: {
          paragraph: {
            class: require('editorjs-paragraph-with-alignment'),
            inlineToolbar: true,
          },
          header: require('@editorjs/header'),
          list: require('@editorjs/list'),
          image: {
            class: require('./Plugins/Image'),
            config: {
              openImgUploadModal: props.openImgUploadModal,
            },
          },
          quote: {
            class: require('./Plugins/Quote'),
            inlineToolbar: true,
            config: {
              quotePlaceholder: '输入你要引用的内容',
            },
          },
          delimiter: require('@editorjs/delimiter'),
          table: require('@editorjs/table'),
          raw: {
            class: require('@editorjs/raw'),
            config: {
              placeholder: '输入 HTML 代码',
            },
          },
          marker: require('@editorjs/marker'),
        },
        placeholder: '开始创作你的文章...',
        onChange: () => {
          (async () => {
            const outputData = await editorRef.current.save();
            props.onChange(JSON.stringify(outputData));
          })();
        },
        i18n,
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
    // eslint-disable-next-line
  }, []);

  return <div id="editorjs" className="markdown-body text-16 pt-2" />;
});
