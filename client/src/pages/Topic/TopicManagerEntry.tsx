import React from 'react';
import { observer } from 'mobx-react-lite';
import DrawerModal from 'components/DrawerModal';
import { ITopic } from 'apis/topic';
import Button from 'components/Button';
import { sleep } from 'utils';

interface IProps {
  open: boolean;
  topic: ITopic;
  close: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRemove: () => void;
}

const TopicIntroduction = observer((props: IProps) => {
  return (
    <div>
      <div className="mt-2 text-center text-18 py-4 font-bold">管理专题</div>
      <div className="mt-5 flex items-center justify-center pb-12">
        <Button
          size="small"
          className="mx-2"
          outline
          onClick={async () => {
            props.close();
            await sleep(200);
            props.onEdit();
          }}
        >
          编辑
        </Button>
        <Button
          size="small"
          className="mx-2"
          outline
          onClick={async () => {
            props.close();
            await sleep(200);
            props.onDelete();
          }}
        >
          删除
        </Button>
        <Button
          size="small"
          className="mx-2"
          outline
          onClick={async () => {
            props.close();
            await sleep(200);
            props.onRemove();
          }}
        >
          移除文章
        </Button>
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
