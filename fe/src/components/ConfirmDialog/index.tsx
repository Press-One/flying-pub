import React from 'react';
import Modal from 'components/Modal';

interface IProps {
  open: boolean;
  content?: string;
  ContentComponent?: any;
  cancelText?: string;
  okText?: string;
  cancel: () => void;
  ok: () => void;
}

export default class ConfirmDialog extends React.Component<IProps, any> {
  render() {
    const { open, content, ContentComponent, cancel, ok, cancelText, okText = '确定' } = this.props;
    return (
      <Modal open={open} onClose={() => cancel()}>
        <div className="bg-white rounded">
          <div className="text-gray-700">
            {content && <div className="m-auto px-12 pt-12 pb-2">{content}</div>}
            {ContentComponent && (
              <div className="m-auto px-12 pt-12 pb-2">{ContentComponent()}</div>
            )}
            <div className="mt-8 flex justify-end border-solid border-t border-gray-400 py-3">
              {cancelText && cancel && (
                <a href="#/" className="text-gray-600 mr-8" onClick={() => cancel()}>
                  {cancelText}
                </a>
              )}
              <a href="#/" className="text-blue-400 mr-5" onClick={() => ok()}>
                {okText}
              </a>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
