import React from 'react';
import { Folder } from '@material-ui/icons';
import { useStore } from 'store';
import _ from 'lodash';
import { isMobile } from 'utils';
import { resizeImage } from 'utils';

type Folder = {
  hide?: boolean;
  topicUuid?: string;
  authorAddress?: string;
  type:
    | 'CREATED_TOPICS'
    | 'FOLLOWING_TOPICS'
    | 'FOLLOWING_USERS'
    | 'TOPIC_FOLLOWERS'
    | 'USER_FOLLOWERS'
    | 'TOPIC_AUTHORS';
  title: string;
  content: string;
  gallery: string[];
  onClose?: () => void;
};

interface Props {
  folders: Folder[];
}

export default (props: Props) => {
  const { modalStore } = useStore();
  const { folders } = props;

  const handleClick = (folder: Folder) => {
    const { type } = folder;
    if (type === 'FOLLOWING_USERS' || type === 'USER_FOLLOWERS') {
      modalStore.openUserList({
        type,
        authorAddress: folder.authorAddress as string,
        title: folder.title,
        onClose: folder.onClose,
      });
      return;
    }

    if (type === 'CREATED_TOPICS' || type === 'FOLLOWING_TOPICS') {
      modalStore.openTopicList({
        userAddress: folder.authorAddress as string,
        type,
        title: folder.title,
        onClose: folder.onClose,
      });
      return;
    }

    if (type === 'TOPIC_FOLLOWERS') {
      modalStore.openUserList({
        topicUuid: folder.topicUuid,
        type: 'TOPIC_FOLLOWERS',
        authorAddress: folder.authorAddress as string,
        title: folder.title,
        onClose: folder.onClose,
      });
      return;
    }

    if (type === 'TOPIC_AUTHORS') {
      modalStore.openUserList({
        topicUuid: folder.topicUuid,
        type: 'TOPIC_AUTHORS',
        authorAddress: folder.authorAddress as string,
        title: folder.title,
        onClose: folder.onClose,
      });
      return;
    }
  };

  if (_.every(folders, (folder) => folder.hide === true)) {
    if (isMobile) {
      return <div className="py-20 text-center text-gray-99">空空如也~</div>;
    }
    return null;
  }

  return (
    <div className="bg-white rounded-12 mb-3 text-gray-4a">
      <div className="p-6 flex flex-wrap folder-container w-11/12 md:w-full m-auto mt-8 md:mt-0 rounded md:rounded-none border md:border-none">
        {folders.map((folder) =>
          !folder.hide ? (
            <div
              className="flex flex-col justify-between cursor-pointer folder rounded-8 box-border"
              key={folder.type}
              onClick={() => handleClick(folder)}
            >
              <div className="leading-none">
                <div className="mt-2">{folder.title}</div>
                <div className="mt-2 text-13 text-gray-af">{folder.content}</div>
              </div>
              <div className="flex items-center mt-4">
                {folder.gallery.map((url, index) => (
                  <img
                    key={index}
                    className="mr-1 rounded"
                    width="28"
                    height="28"
                    src={resizeImage(url)}
                    alt="cover"
                  />
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
      <style jsx>{`
        .folder-container {
          width: ${isMobile ? '86vw' : 'auto'};
          height: ${isMobile ? (folders.length > 2 ? '53vh' : '42vh') : 'auto'};
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: minmax(120px, 120px);
          gap: 24px 16px;
          row-gap: 24px;
          column-gap: 16px;
          align-items: center;
          justify-items: center;
        }
        .folder {
          padding: 12px 12px 16px;
          width: 120px;
          height: 120px;
          box-shadow: rgba(0, 0, 0, 0.06) 0px -1px 4px, rgba(0, 0, 0, 0.1) 0px 4px 8px;
        }
      `}</style>
    </div>
  );
};
