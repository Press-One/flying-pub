import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { Dialog, TextField, Switch, Tooltip } from '@material-ui/core';
import Button from 'components/Button';
import ImageEditor from 'components/ImageEditor';
import Help from '@material-ui/icons/Help';
import topicApi, { ITopic, IEditableTopic } from 'apis/topic';
import { useStore } from 'store';
import DrawerModal from 'components/DrawerModal';
import { isMobile } from 'utils';

interface IProps {
  open: boolean;
  topic?: ITopic;
  close: () => void;
  onChange: (topic: ITopic) => void;
}

const TopicEditor = observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    isDoing: false,
    isUpdating: false,
    topic: {
      cover: '',
      name: '',
      description: '',
      contributionEnabled: true,
    } as IEditableTopic,
  }));

  React.useEffect(() => {
    if (props.open) {
      if (props.topic) {
        state.topic.cover = props.topic.cover;
        state.topic.name = props.topic.name;
        state.topic.description = props.topic.description;
        state.topic.contributionEnabled = props.topic.contributionEnabled;
        state.isUpdating = true;
      } else {
        state.topic = {
          cover: '',
          name: '',
          description: '',
          contributionEnabled: true,
        } as IEditableTopic;
      }
    }
  }, [props.open, props.topic, state]);

  const submit = async () => {
    if (state.isDoing) {
      return;
    }

    if (!state.topic.cover) {
      snackbarStore.show({
        message: '请添加封面',
        type: 'error',
      });
      return;
    }

    if (!state.topic.name) {
      snackbarStore.show({
        message: '请输入名称',
        type: 'error',
      });
      return;
    }

    if (!state.topic.description) {
      snackbarStore.show({
        message: '请输入描述、介绍',
        type: 'error',
      });
      return;
    }

    state.isDoing = true;
    try {
      let topic;
      if (state.isUpdating) {
        topic = await topicApi.update((props.topic as ITopic).uuid, toJS(state.topic));
      } else {
        topic = await topicApi.create({
          cover: state.topic.cover,
          name: state.topic.name,
          description: state.topic.description,
          contributionEnabled: state.topic.contributionEnabled,
          reviewEnabled: state.topic.reviewEnabled,
        });
      }
      props.onChange(topic);
      props.close();
    } catch (err) {
      if (err.code === 'ERR_IS_DUPLICATED') {
        snackbarStore.show({
          message: '已经存在相同名称的专题，请使用一个新的名称',
          type: 'error',
        });
      }
    }
    state.isDoing = false;
  };

  return (
    <div className="p-8 bg-white rounded-12 text-gray-4a">
      <div className="font-bold items-center text-18 flex justify-center md:justify-start">
        {state.isUpdating && '更新专题'}
        {!state.isUpdating && (
          <div className="flex items-center">
            <span className="mr-1">创建专题</span>
            {!isMobile && (
              <Tooltip
                placement="right"
                arrow
                title={
                  <div className="py-1 px-1 text-12">
                    <div>创建专题之后，你可以：</div>
                    <div className="mt-2">1. 收录整理自己的文章</div>
                    <div className="mt-1">2. 收录别人的好文章</div>
                    <div className="mt-1">3. 呼吁别人来投稿，一起创造精彩的文章合集</div>
                  </div>
                }
              >
                <Help className="text-gray-600" />
              </Tooltip>
            )}
          </div>
        )}
      </div>
      <div className="w-auto md:w-100">
        <div className="mt-5 flex justify-center">
          <ImageEditor
            imageUrl={state.topic.cover}
            width={200}
            placeholderWidth={120}
            editorPlaceholderWidth={200}
            name="封面"
            getImageUrl={(url: string) => {
              state.topic.cover = url;
            }}
          />
        </div>

        <div className="mt-8">
          <TextField
            className="w-full"
            value={state.topic.name}
            onChange={(e) => {
              state.topic.name = e.target.value;
            }}
            label="名称"
            margin="dense"
            variant="outlined"
          />
        </div>

        <div className="pt-2">
          <TextField
            className="w-full"
            value={state.topic.description}
            onChange={(e) => {
              state.topic.description = e.target.value;
              if (e.target.value.length >= 300) {
                snackbarStore.show({
                  message: '最多 300 字',
                  type: 'error',
                });
              }
            }}
            label="描述、介绍"
            margin="dense"
            rowsMax={6}
            rows={3}
            multiline
            inputProps={{
              maxLength: 300,
            }}
            variant="outlined"
          />
        </div>

        <div className="flex items-center mt-5">
          <div className="font-bold text-base text-gray-700">允许其他人投稿：</div>
          <Switch
            color="primary"
            checked={state.topic.contributionEnabled}
            onChange={(e) => {
              state.topic.contributionEnabled = e.target.checked;
            }}
          />
        </div>

        {state.topic.contributionEnabled && !isMobile && (
          <div className="flex items-center mt-2">
            <div className="font-bold text-base text-gray-700">投稿需要我审核：</div>
            <Tooltip
              title="审核功能正在开发中，还不能使用。这意味着其他人一旦投稿，文章就会立即被这个专题收录哦（等下个版本发布就有审核功能啦）"
              arrow
              placement="top"
            >
              <div>
                <Switch
                  disabled
                  color="primary"
                  checked={state.topic.reviewEnabled}
                  onChange={(e) => {
                    state.topic.reviewEnabled = e.target.checked;
                  }}
                />
              </div>
            </Tooltip>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button onClick={submit} isDoing={state.isDoing} className="w-full md:w-auto">
            保存
          </Button>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  const { open } = props;

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={() => props.close()}>
        <TopicEditor {...props} />
      </DrawerModal>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={() => props.close()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <TopicEditor {...props} />
    </Dialog>
  );
});
