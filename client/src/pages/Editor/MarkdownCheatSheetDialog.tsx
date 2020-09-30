import React from 'react';
import Modal from '@material-ui/core/Modal';
import Marked from 'marked';
import { markdownCheatSheet } from './MarkdownCheatSheet';

interface IProps {
  open: boolean;
  cancel: () => void;
}

export default (props: IProps) => {
  const { open, cancel } = props;
  const content = markdownCheatSheet;
  const renderedContent = React.useMemo(() => (content ? Marked(content) : ''), [content]);
  return (
    <Modal open={open} onClose={() => cancel()} className="flex justify-center items-center">
      <div className="modal-content bg-white rounded-sm">
        <div className="text-gray-700 pt-6 pb-3 ex-width-500">
          {content && (
            <div
              className="mx-auto px-5 markdown-body"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            ></div>
          )}
        </div>
      </div>
    </Modal>
  );
};
