import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog, TextField } from '@material-ui/core';
import Button from 'components/Button';
import { useStore } from 'store';
import importApi from 'apis/import';
import { pressOneLinkRegexp, weChatLinkRegexp } from 'utils/import';
import { useHistory } from 'react-router-dom';
import { isMobile } from 'utils';
import DrawerModal from 'components/DrawerModal';

const PostImport = observer(() => {
  const { snackbarStore } = useStore();
  const history = useHistory();
  const state = useLocalStore(() => ({
    url: '',
    loading: false,
  }));

  const submit = () => {
    if (state.loading) {
      return;
    }

    const validUrl = [pressOneLinkRegexp.test(state.url), weChatLinkRegexp.test(state.url)].some(
      Boolean,
    );
    if (!validUrl) {
      snackbarStore.show({
        message: '请输入正确的文章地址',
        type: 'error',
      });
      return;
    }

    state.loading = true;
    (async () => {
      try {
        const file = await importApi.importArticle(state.url);
        history.push(`/editor?id=${file.id}&action=triggerPreview`);
      } catch (err) {
        let message = '导入失败';
        if (err.message === 'url is invalid') {
          message = '请输入有效的文章地址';
        }
        snackbarStore.show({
          message,
          type: 'error',
        });
      }
      state.loading = false;
    })();
  };

  return (
    <div className="modal-content bg-white rounded-12 text-center p-8">
      <div className="w-full md:w-60 rounded-12">
        <div className="text-18 text-center font-bold pb-3">导入微信公众号文章</div>
        <div className="px-2 py-2">
          <TextField
            autoFocus
            className="w-full"
            placeholder="粘贴文章链接"
            size="small"
            value={state.url}
            onChange={(e) => (state.url = e.target.value)}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="flex justify-center mt-5" onClick={submit}>
          <Button fullWidth={isMobile} isDoing={state.loading}>
            导入
          </Button>
        </div>
      </div>
    </div>
  );
});

export default observer((props: any) => {
  const { open, close } = props;

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={close}>
        <PostImport />
      </DrawerModal>
    );
  }

  return (
    <Dialog open={open} onClose={close} className="flex justify-center items-center">
      <PostImport />
    </Dialog>
  );
});
