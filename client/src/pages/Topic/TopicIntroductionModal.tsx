import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { ITopic } from 'apis/topic';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import DrawerModal from 'components/DrawerModal';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import FolderGrid from 'components/FolderGrid';
import marked from 'marked';

interface IProps {
  open: boolean;
  topic: ITopic;
  close: () => void;
}

const TopicIntroduction = observer((props: IProps) => {
  const state = useLocalStore(() => ({
    tab: 'description',
    loadingOthers: false,
  }));

  return (
    <div className="bg-white rounded-12 text-gray-4a h-60-vh">
      <div>
        <div className="border-b border-gray-300">
          <Tabs
            value={state.tab}
            onChange={(_e, tab) => {
              state.tab = tab;
              if (tab === 'others') {
                (async () => {
                  state.loadingOthers = true;
                  await sleep(500);
                  state.loadingOthers = false;
                })();
              }
            }}
          >
            <Tab value="description" className="form-tab" label="介绍" />
            <Tab value="others" className="form-tab" label="动态" />
          </Tabs>
        </div>
        <div>
          {state.tab === 'description' && (
            <div
              className="px-5 py-4 mt-2 markdown-body small"
              dangerouslySetInnerHTML={{ __html: marked.parse(props.topic.description) }}
            ></div>
          )}
          {state.tab === 'others' && (
            <div className="h-">
              {!state.loadingOthers && (
                <FolderGrid
                  folders={[
                    {
                      topicUuid: props.topic.uuid,
                      type: 'TOPIC_AUTHORS',
                      title: '包含的作者',
                      content: `${props.topic.summary?.author?.count}个`,
                      gallery: props.topic.summary?.author?.preview || [],
                    },
                    {
                      topicUuid: props.topic.uuid,
                      type: 'TOPIC_FOLLOWERS',
                      title: '关注的人',
                      content: `${props.topic.summary.follower.count}个`,
                      gallery: props.topic.summary.follower.preview,
                    },
                  ]}
                />
              )}
              {state.loadingOthers && (
                <div className="pt-24 mt-5">
                  <Loading />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  const { open } = props;

  return (
    <DrawerModal open={open} onClose={() => props.close()}>
      <TopicIntroduction {...props} />
    </DrawerModal>
  );
});
