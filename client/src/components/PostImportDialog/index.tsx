import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@material-ui/core';
import Button from 'components/Button';
import './index.scss';
import { pressOneLinkRegexp, wechatLinkRegexp } from '../../utils/import';

interface IProps {
  open: boolean;
  loading: boolean;
  cancel: () => void;
  ok: (url: string) => void;
}

const PostImportDialog = (props: IProps) => {
  const { open, loading, cancel, ok } = props;
  const [inputValue, setInputValue] = useState('');
  const [inputDirty, setInputDirty] = useState(false);

  const handleOk = () => {
    if (loading) {
      return;
    }
    ok(inputValue);
  };

  const validUrl = [pressOneLinkRegexp.test(inputValue), wechatLinkRegexp.test(inputValue)].some(
    Boolean,
  );

  return (
    <Dialog
      className="import-dialog"
      open={open}
      onClose={cancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        <span className="block pt-3 px-12 text-lg text-center">导入微信公众号文章</span>
      </DialogTitle>
      <DialogContent>
        <span className="block px-3 pt-2 pb-1">
          <TextField
            error={!validUrl && inputDirty}
            helperText={(!validUrl && inputDirty && '请输入正确的文章地址') || ' '}
            style={{ width: '100%' }}
            autoFocus
            placeholder="粘贴文章链接"
            variant="outlined"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              setInputDirty(true);
            }}
          />
        </span>
      </DialogContent>
      <DialogActions style={{ marginBottom: '12px' }}>
        <span className="flex justify-center items-center -mt-2 pb-2 w-full">
          <Button onClick={handleOk} isDoing={loading}>
            导入
          </Button>
        </span>
      </DialogActions>
    </Dialog>
  );
};

export default PostImportDialog;
