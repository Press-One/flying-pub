import React from 'react';
import { observer } from 'mobx-react-lite';
import EditorJS from '@editorjs/editorjs';
import i18n from './i18n';

import './index.scss';

export default observer((props: any) => {
  const editorRef = React.useRef<any>(null);

  if (props.data) {
    props.data.blocks = props.data.blocks.filter((block: any) => {
      if (block.type === 'image' && !block.data.url) {
        return false;
      }
      return true;
    });
  }

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
          header: {
            class: require('@editorjs/header'),
            inlineToolbar: true,
          },
          list: {
            class: require('@editorjs/list'),
            inlineToolbar: true,
          },
          image: {
            class: require('./Plugins/Image').Image,
            config: {
              openImgUploadModal: props.openImgUploadModal,
            },
          },
          quote: {
            class: require('./Plugins/Quote').Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: '输入你要引用的内容',
            },
          },
          delimiter: require('@editorjs/delimiter'),
          table: {
            class: require('@editorjs/table'),
            inlineToolbar: true,
          },
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
