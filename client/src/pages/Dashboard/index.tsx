import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { RouteChildrenProps } from 'react-router';
import { Link } from 'react-router-dom';
import Loading from 'components/Loading';
import NotificationModal from 'components/NotificationModal';
import NotificationsOutlined from '@material-ui/icons/NotificationsOutlined';
import Badge from '@material-ui/core/Badge';
import Button from 'components/Button';
import Pagination from '@material-ui/lab/Pagination';

import { Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';

import { pressOneLinkRegexp, wechatLinkRegexp } from '../../utils/import';
import PostImportDialog from '../../components/PostImportDialog';

import Api from '../../api';
import { useStore } from '../../store';

import { sleep } from '../../utils';

import PostEntry from './postEntry';

import './index.scss';

const useImportDialog = (props: any) => {
  const store = useStore();
  const { snackbarStore } = store;
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [importDialogLoading, setImportDialogLoading] = useState(false);
  const handleOpenImportDialog = () => setImportDialogVisible(true);
  const handleImportDialogClose = () => {
    if (!importDialogLoading) {
      setImportDialogVisible(false);
    }
  };
  const handleImportDialogConfirm = (url: string) => {
    const validUrl = [pressOneLinkRegexp.test(url), wechatLinkRegexp.test(url)].some(Boolean);
    if (!validUrl) {
      snackbarStore.show({
        message: '请输入正确的文章地址',
        type: 'error',
      });
      return;
    }

    setImportDialogLoading(true);
    Api.importArticle(url)
      .then(
        (file) => {
          setTimeout(() => {
            props.history.push(`/editor?id=${file.id}`);
          });
        },
        (err) => {
          let message = '导入失败';
          if (err.message === 'url is invalid') {
            message = '请输入有效的文章地址';
          }
          snackbarStore.show({
            message,
            type: 'error',
          });
        },
      )
      .finally(() => {
        setImportDialogLoading(false);
      });
  };

  return {
    importDialogVisible,
    importDialogLoading,
    handleOpenImportDialog,
    handleImportDialogClose,
    handleImportDialogConfirm,
  };
};

const LIMIT = 15;

export default observer((props: RouteChildrenProps) => {
  const { fileStore, settingsStore, notificationStore } = useStore();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [page, setPage] = React.useState(0);
  const { isFetching, files, total } = fileStore;
  const { settings } = settingsStore;
  const unread = notificationStore.getUnread() || 0;

  const {
    importDialogVisible,
    importDialogLoading,
    handleOpenImportDialog,
    handleImportDialogClose,
    handleImportDialogConfirm,
  } = useImportDialog(props);

  const fetchFiles = React.useCallback(
    async (page: number) => {
      fileStore.setIsFetching(true);
      try {
        const { total, files } = await Api.getFiles({
          offset: page * LIMIT,
          limit: LIMIT,
        });
        await sleep(1000);
        fileStore.setTotal(total);
        fileStore.setFiles(files);
      } catch (err) {}
      fileStore.setIsFetching(false);
    },
    [fileStore],
  );

  React.useEffect(() => {
    fetchFiles(page);
  }, [fetchFiles, page]);

  const renderPosts = (files: any) => {
    return (
      <section>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>标题</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>更新时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {files.map((file: any) => (
                <PostEntry
                  file={file}
                  history={props.history}
                  key={file.id}
                  fetchFiles={() => fetchFiles(page)}
                />
              ))}
            </TableBody>
          </Table>
        </Paper>
      </section>
    );
  };

  const changePage = (e: any, newPage: number) => {
    setPage(newPage - 1);
    window.scrollTo(0, 0);
  };

  const PaginationView = () => (
    <div className="flex justify-center mt-5 pt-2 list-none">
      <Pagination
        count={Math.ceil(total / LIMIT)}
        variant="outlined"
        shape="rounded"
        page={page + 1}
        onChange={changePage}
      />
    </div>
  );

  const renderNoPosts = () => {
    return (
      <div className="mt-56 pt-5 text-center text-gray-500 text-base tracking-wider">
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
                setShowNotificationModal(true);
              }}
            >
              <div className="text-3xl flex items-center icon-btn-color">
                <NotificationsOutlined />
              </div>
            </Badge>
          )}
          {settings['import.enabled'] && (
            <Button onClick={handleOpenImportDialog} outline className="mr-5">
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

      <div className="p-dashboard-main-table-container max-w-1200">
        {!isFetching && files.length === 0 && renderNoPosts()}
        {!isFetching && files.length > 0 && renderPosts(files)}
        {!isFetching && total > LIMIT && PaginationView()}
      </div>

      {settings['import.enabled'] && (
        <PostImportDialog
          loading={importDialogLoading}
          open={importDialogVisible}
          cancel={handleImportDialogClose}
          ok={handleImportDialogConfirm}
        />
      )}
      {settings['notification.enabled'] && (
        <NotificationModal
          open={showNotificationModal}
          close={() => {
            setShowNotificationModal(false);
            notificationStore.reset();
          }}
        />
      )}
    </div>
  );
});
