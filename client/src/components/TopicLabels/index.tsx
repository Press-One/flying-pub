import React from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { useStore } from 'store';
import Add from '@material-ui/icons/Add';
import MoreHoriz from '@material-ui/icons/MoreHoriz';
import { IPostTopic, IPost } from 'apis/post';
import classNames from 'classnames';
import { isMobile } from 'utils';
import Tooltip from '@material-ui/core/Tooltip';

export const IncludedButton = (props: { post: IPost; onClose?: () => void }) => {
  const { modalStore, userStore } = useStore();

  return (
    <div
      className="flex items-center bg-gray-f2 rounded-full cursor-pointer px-1"
      onClick={() =>
        modalStore.openTopicList({
          post: props.post,
          userAddress: userStore.user.address,
          title: '收录到我的专题',
          type: 'CONTRIBUTION_TO_MY_TOPICS',
          onClose: () => {
            props.onClose && props.onClose();
          },
        })
      }
    >
      <div className="rounded-full w-4 h-3 m-2 mr-0 text-16 overflow-hidden box-border text-blue-400 flex items-center">
        <Add />
      </div>
      <div className="text-blue-400 text-14 pr-2"></div>
    </div>
  );
};
interface IProps {
  post: IPost;
  topics: IPostTopic[];
  showContributionButton?: boolean;
  maxListCount?: number;
  onClose?: () => void;
}

export default observer((props: IProps) => {
  const { modalStore, userStore } = useStore();
  const topics = props.topics.filter((topic) => !topic.deleted);
  const length = topics.length;
  const maxListCount = props.maxListCount || 0;
  const folderEnabled = props.maxListCount && length > maxListCount;
  return (
    <div className="flex items-start flex-wrap">
      {topics.slice(0, maxListCount > 0 ? maxListCount : length).map((topic) => (
        <div key={topic.uuid} className="z-10">
          <div
            className={classNames(
              {
                'md:mb-2': maxListCount > 0,
              },
              'mr-2',
            )}
          >
            <Link to={`/topics/${topic.uuid}`}>
              <div className="flex items-center bg-gray-f2 rounded-full cursor-pointer">
                <div className="rounded-full w-3 h-3 bg-blue-300 ml-2 mr-1 label-icon" />
                <div className="text-blue-400 text-13 label-text topic-name truncate">{topic.name}</div>
              </div>
            </Link>
          </div>
        </div>
      ))}
      {folderEnabled && length > maxListCount && (
        <div
          className="flex items-center bg-gray-f2 rounded-full cursor-pointer px-1 mr-2"
          onClick={() =>
            modalStore.openTopicList({
              post: props.post,
              userAddress: userStore.user.address,
              title: '文章被以下专题收录',
              type: 'CONTRIBUTED_TOPICS',
            })
          }
        >
          <div className="rounded-full w-4 h-3 m-2 mr-0 text-16 overflow-hidden box-border text-blue-400 flex items-center">
            <MoreHoriz />
          </div>
          <div className="text-blue-400 text-14 pr-2"></div>
        </div>
      )}
      {topics.length > 0 && props.showContributionButton && userStore.isLogin && (
        <Tooltip disableHoverListener={isMobile} placement="top" title="收录到我的专题" arrow>
          <div>
            <IncludedButton post={props.post} onClose={props.onClose} />
          </div>
        </Tooltip>
      )}
      <style jsx>{`
        .label-icon {
          margin-top: 7px;
          margin-bottom: 7px;
        }
        .label-text {
          margin-right: 10px;
        }
        .topic-name {
          max-width: 190px;
        }
      `}</style>
    </div>
  );
});
