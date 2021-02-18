import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { RouteChildrenProps } from 'react-router';
import { Link } from 'react-router-dom';
import Loading from 'components/Loading';
import { MdNotificationsNone } from 'react-icons/md';
import Badge from '@material-ui/core/Badge';
import Button from 'components/Button';
import Pagination from '@material-ui/lab/Pagination';
import { Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import ContributionModal from 'components/ContributionModal';
import PostImportModal from 'components/PostImportModal';
import fileApi from 'apis/file';
import PostEntry from './postEntry';
import { useStore } from 'store';

import './index.scss';

const LIMIT = 15;

export default observer((props: RouteChildrenProps) => {
  const { fileStore, settingsStore, notificationStore, modalStore } = useStore();
  const state = useLocalStore(() => ({
    page: 0,
    showContributionModal: false,
    showPostImportModal: false,
  }));
  const { isFetching, files, total } = fileStore;
  const { settings } = settingsStore;
  const unread = notificationStore.getUnread() || 0;

  const fetchFiles = React.useCallback(
    async (page: number) => {
      fileStore.setIsFetching(true);
      try {
        const { total, files } = await fileApi.getFiles({
          offset: page * LIMIT,
          limit: LIMIT,
        });
        fileStore.setTotal(total);
        fileStore.setFiles(files);
      } catch (err) {}
      fileStore.setIsFetching(false);
    },
    [fileStore],
  );

  React.useEffect(() => {
    document.title = `${settings['site.title'] || ''}`;
  }, [settings]);

  React.useEffect(() => {
    fetchFiles(state.page);
  }, [fetchFiles, state.page]);

  const renderPosts = (files: any) => {
    return (
      <section>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>标题</TableCell>
                <TableCell>封面</TableCell>
                {(localStorage.getItem('VIEW_COUNT_ENABLED') ||
                  settings.extra['postView.visible']) && <TableCell>阅读</TableCell>}
                <TableCell>状态</TableCell>
                <TableCell>更新于</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {files.map((file: any) => (
                <PostEntry
                  file={file}
                  history={props.history}
                  key={file.id}
                  fetchFiles={() => fetchFiles(state.page)}
                />
              ))}
            </TableBody>
          </Table>
        </Paper>
      </section>
    );
  };

  const changePage = (e: any, newPage: number) => {
    state.page = newPage - 1;
    window.scrollTo(0, 0);
  };

  const PaginationView = () => (
    <div className="flex justify-center mt-5 pt-2 list-none pb-6">
      <Pagination
        count={Math.ceil(total / LIMIT)}
        variant="outlined"
        shape="rounded"
        page={state.page + 1}
        onChange={changePage}
      />
    </div>
  );

  const renderNoPosts = () => {
    return (
      <div className="py-64 text-center text-gray-500 text-base tracking-wider">
        开始创作你的第一篇文章吧 ~
      </div>
    );
  };

  return (
    <div className="p-dashboard-main max-w-1200">
      <section className="p-dashboard-main-head flex items-center justify-between">
        <div className="p-dashboard-main-head-title">文章</div>

        <div className="p-dashboard-main-right">
          {settings['notification.enabled'] && (
            <Badge
              badgeContent={unread}
              className="text-gray-700 mr-8 transform scale-90 cursor-pointer"
              color="error"
              onClick={() => {
                modalStore.openNotification();
              }}
            >
              <div className="text-3xl flex items-center icon-btn-color">
                <MdNotificationsNone />
              </div>
            </Badge>
          )}
          {settings['import.enabled'] && (
            <Button onClick={() => (state.showPostImportModal = true)} outline className="mr-5">
              导入微信公众号文章
            </Button>
          )}

          <Link to="/editor">
            <Button>写文章</Button>
          </Link>
        </div>

        <style jsx>
          {`
            .icon-btn-color {
              color: rgba(0, 0, 0, 0.54);
            }
          `}
        </style>
      </section>

      {isFetching && (
        <div className="mt-64">
          <Loading />
        </div>
      )}

      {!isFetching && (
        <div className="p-dashboard-main-table-container max-w-1200">
          <div className="bg-white rounded-12 overflow-hidden">
            {files.length === 0 && renderNoPosts()}
            {files.length > 0 && renderPosts(files)}
            {total > LIMIT && PaginationView()}
          </div>
        </div>
      )}

      {settings['import.enabled'] && (
        <PostImportModal
          open={state.showPostImportModal}
          close={() => (state.showPostImportModal = false)}
        />
      )}

      <ContributionModal />
    </div>
  );
});
