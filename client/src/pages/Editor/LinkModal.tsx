import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog, TextField } from '@material-ui/core';
import Button from 'components/Button';
import { useStore } from 'store';

export default observer((props: any) => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    text: '',
    link: '',
  }));

  React.useEffect(() => {
    state.text = props.text || '';
  }, [state, props.text]);

  const { open, close } = props;

  const insertLink = async () => {
    if (!state.text) {
      snackbarStore.show({
        message: '请输入文本',
        type: 'error',
      });
      return;
    }
    if (!state.link) {
      snackbarStore.show({
        message: '请输入链接',
        type: 'error',
      });
      return;
    }
    props.insertLink(`[${state.text}](${state.link})`);
    state.text = '';
    state.link = '';
  };

  return (
    <Dialog open={open} onClose={close} className="flex justify-center items-center">
      <div className="modal-content bg-white rounded-12 text-center p-8">
        <div className="w-64 rounded-12">
          <div className="text-18 text-center font-bold pb-3">插入链接</div>
          <div className="px-4">
            <TextField
              className="w-full"
              placeholder="文本"
              size="small"
              value={state.text}
              onChange={(e) => (state.text = e.target.value)}
              margin="dense"
              variant="outlined"
            />
            <TextField
              className="w-full"
              placeholder="链接"
              size="small"
              value={state.link}
              onChange={(e) => (state.link = e.target.value)}
              margin="dense"
              variant="outlined"
            />
          </div>
          <div className="flex justify-center mt-5" onClick={insertLink}>
            <Button>确定</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
