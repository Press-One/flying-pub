import React from 'react';
import { useStore } from 'store';
import { observer, useLocalStore } from 'mobx-react-lite';
import ModalLink from 'components/ModalLink';
import Img from 'components/Img';
import Button from 'components/Button';
import { TextField, Badge } from '@material-ui/core';
import topicApi, { ITopicContributionRequest } from 'apis/topic';
import Loading from 'components/Loading';
import { MdCheckCircle, MdBlock } from 'react-icons/md';
import classNames from 'classnames';
import { sleep, isPc, isMobile } from 'utils';
import useInfiniteScroll from 'react-infinite-scroll-hook';

const LIMIT = 20;

export default observer(() => {
  const { snackbarStore, modalStore } = useStore();
  const state = useLocalStore(() => ({
    hasMore: false,
    requests: [] as ITopicContributionRequest[],
    page: 0,
    isFetching: false,
    isFetched: false,
    showRejectConfirmMap: {} as any,
    selectedRequestId: 0,
    invisible: true,
  }));

  React.useEffect(() => {
    (async () => {
      state.isFetching = true;
      try {
        const { requests } = await topicApi.fetchContributionRequests({
          offset: state.page * LIMIT,
          limit: LIMIT,
        });
        state.requests.push(...(requests as ITopicContributionRequest[]));
        state.hasMore = requests.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      if (modalStore.notification.data.messageId) {
        await sleep(1500);
      }
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [state, state.page, modalStore]);

  React.useEffect(() => {
    if (state.isFetched) {
      if (modalStore.notification.data.messageId) {
        (async () => {
          const commentEle: any = document.querySelector(
            `#request_${modalStore.notification.data.messageId}`,
          );
          if (!commentEle) {
            await sleep(500);
            snackbarStore.show({
              message: 'Ta 已经撤销了投稿请求',
            });
            state.invisible = false;
            return;
          }
          commentEle.scrollIntoView();
          await sleep(10);
          state.invisible = false;
          state.selectedRequestId = modalStore.notification.data.messageId as number;
          await sleep(2000);
          state.selectedRequestId = 0;
        })();
      } else {
        state.invisible = false;
      }
    }
  }, [modalStore.notification.data.messageId, state.isFetched, state, snackbarStore]);

  const infiniteRef: any = useInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    scrollContainer: 'parent',
    threshold: 350,
    onLoadMore: () => {
      state.page += 1;
    },
  });

  if (!state.isFetched) {
    return (
      <div className="pt-20">
        <div className="pt-10" style={{ height: '100px' }}>
          <Loading />
        </div>
      </div>
    );
  }

  const approveContributionRequest = async (request: ITopicContributionRequest) => {
    try {
      const updatedRequest = await topicApi.approveContributionRequest(request.id);
      request.status = (updatedRequest as ITopicContributionRequest).status;
    } catch (err) {
      snackbarStore.show({
        message: '好像哪里出错了',
        type: 'error',
      });
      console.log(err);
    }
  };

  const rejectContributionRequest = async (request: ITopicContributionRequest) => {
    try {
      const updatedRequest = await topicApi.rejectContributionRequest(request.id, request.note);
      request.status = (updatedRequest as ITopicContributionRequest).status;
    } catch (err) {
      snackbarStore.show({
        message: '好像哪里出错了',
        type: 'error',
      });
      console.log(err);
    }
  };

  return (
    <div
      ref={infiniteRef}
      className={classNames(
        {
          invisible: state.invisible,
        },
        'm-auto pb-2 md:pt-3',
      )}
    >
      {state.isFetched && state.requests.length === 0 && (
        <div className="pt-20 text-center text-gray-500 font-medium">还没有收到投稿请求</div>
      )}
      {state.requests.map((request) => {
        return (
          <div
            key={request.id}
            id={`request_${request.id}`}
            className={classNames(
              {
                highlight: request.id === state.selectedRequestId,
              },
              'px-4 md:px-3 duration-500 ease-in-out transition-colors border-gray-200 border-b pt-5 pb-4 flex',
            )}
          >
            <div className="msg-avatar">
              <ModalLink
                to={`/authors/${request.post.author.address}`}
                openInNew={isPc}
                onClick={() => {
                  isMobile && modalStore.closeNotification();
                }}
                className="font-bold text-blue-400"
              >
                <Img
                  className="rounded-full"
                  src={request.post.author.avatar}
                  alt="avatar"
                  width="36"
                  height="36"
                />
              </ModalLink>
            </div>
            <div className="msg-body ml-3 flex-1">
              <div className="msg-title mb-6-px flex items-center">
                <ModalLink
                  to={`/authors/${request.post.author.address}`}
                  openInNew={isPc}
                  onClick={() => {
                    isMobile && modalStore.closeNotification();
                  }}
                  className="font-bold text-blue-400 relative from-user-name truncate"
                >
                  <div className="absolute top-0 right-0 -mt-2 -mr-2">
                    <Badge
                      badgeContent={1}
                      color="error"
                      variant="dot"
                      invisible={request.status !== 'pending'}
                    />
                  </div>
                  {request.post.author.nickname}
                </ModalLink>
              </div>
              <div className="text-13 text-gray-4a">
                我想把文章《
                <ModalLink
                  to={`/posts/${request.post.rId}`}
                  openInNew={isPc}
                  onClick={() => {
                    isMobile && modalStore.closeNotification();
                  }}
                  className="font-bold text-blue-400"
                >
                  {request.post.title}
                </ModalLink>
                》投稿到你的专题《{request.topic.name}》
              </div>
              {request.status !== 'pending' && (
                <div className="pt-2 pb-2-px">
                  {request.status === 'approved' && (
                    <div className="flex items-start text-16 text-green-500 ">
                      <MdCheckCircle />
                      <span className="ml-2 text-12 -mt-1-px">已允许，文章已收录到你的专题</span>
                    </div>
                  )}
                  {request.status === 'rejected' && (
                    <div className="flex items-start text-16 text-red-400">
                      <MdBlock />
                      <div className="ml-2 text-12 -mt-1-px">
                        已拒绝{request.note && `，原因是：${request.note}`}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {request.status === 'pending' && (
                <div>
                  {state.showRejectConfirmMap[request.id] && (
                    <div className="mt-1">
                      <TextField
                        className="w-full"
                        value={request.note}
                        onChange={(e) => {
                          request.note = e.target.value;
                        }}
                        margin="dense"
                        label="告诉 Ta 拒绝的具体原因"
                        rowsMax={4}
                        rows={2}
                        multiline
                        inputProps={{
                          maxLength: 200,
                        }}
                        variant="outlined"
                      />
                      <div className="flex items-start justify-end pt-3">
                        <Button
                          className="mr-5"
                          size="mini"
                          outline
                          color="gray"
                          onClick={() => {
                            state.showRejectConfirmMap[request.id] = false;
                          }}
                        >
                          取消
                        </Button>
                        <Button
                          size="mini"
                          color="red"
                          outline
                          onClick={() => rejectContributionRequest(request)}
                        >
                          确定
                        </Button>
                      </div>
                    </div>
                  )}
                  {!state.showRejectConfirmMap[request.id] && (
                    <div className="flex items-start pt-3">
                      <Button
                        className="mr-5"
                        size="mini"
                        outline
                        color="gray"
                        onClick={() => {
                          state.showRejectConfirmMap[request.id] = true;
                        }}
                      >
                        拒绝
                      </Button>
                      <Button size="mini" onClick={() => approveContributionRequest(request)}>
                        允许
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {state.isFetched && state.isFetching && (
        <div className="pt-10">
          <Loading />
        </div>
      )}
      <style jsx>{`
        .highlight {
          background: #e2f6ff;
        }
      `}</style>
    </div>
  );
});
