import React from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'components/Button';
import ButtonProgress from 'components/ButtonProgress';

import { Menu, MenuItem, TableRow, TableCell, Tooltip } from '@material-ui/core';

import LinkIcon from '@material-ui/icons/Link';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Visibility from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';
import Settings from '@material-ui/icons/Settings';
import CreateIcon from '@material-ui/icons/Create';

import fileApi from 'apis/file';

import { useStore } from 'store';

import { ago, sleep } from 'utils';
import Img from 'components/Img';

export const FileStatus: any = {
  published: '已发布',
  pending: '已发布',
  draft: '草稿',
};

export default observer((props: any) => {
  const { settingsStore, snackbarStore, confirmDialogStore, modalStore } = useStore();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [hiding, setHiding] = React.useState(false);
  const [showing, setShowing] = React.useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const editFile = (fileId: number) => {
    props.history.push(`/write?id=${fileId}`);
  };

  const showFile = (id: number) => {
    (async () => {
      try {
        setShowing(true);
        await fileApi.showFile(id);
        handleMenuClose();
        await sleep(300);
        setShowing(false);
        props.fetchFiles();
      } catch (err) {
        setShowing(false);
        snackbarStore.show({
          message: '显示失败',
          type: 'error',
        });
      }
    })();
  };

  const hideFile = (id: number) => {
    (async () => {
      try {
        setHiding(true);
        await fileApi.hideFile(id);
        handleMenuClose();
        await sleep(300);
        setHiding(false);
        props.fetchFiles();
      } catch (err) {
        setHiding(false);
        snackbarStore.show({
          message: '隐藏失败',
          type: 'error',
        });
      }
    })();
  };

  const deleteFile = (rId: string) => {
    (async () => {
      try {
        setDeleting(true);
        await fileApi.deleteFile(rId);
        handleMenuClose();
        await sleep(300);
        setDeleting(false);
        props.fetchFiles();
      } catch (err) {
        setDeleting(false);
        snackbarStore.show({
          message: '删除失败',
          type: 'error',
        });
      }
    })();
  };

  const { file } = props;
  const readerUrl = settingsStore.settings['site.url'];
  const isPublished = file.status === 'published' || file.status === 'pending';

  return (
    <TableRow key={file.id}>
      <TableCell component="th" scope="row">
        {(!isPublished || file.invisibility) && <div className="font-bold title">{file.title}</div>}
        {isPublished && !file.invisibility && (
          <a
            className="flex items-center text-blue-400"
            href={`${readerUrl}/posts/${file.rId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="font-bold title">{file.title}</div>
          </a>
        )}
      </TableCell>
      <TableCell>
        {file.cover ? (
          <Img width="55px" src={file.cover} resizeWidth={55} useOriginalDefault alt="封面" />
        ) : (
          ''
        )}
      </TableCell>
      {(localStorage.getItem('VIEW_COUNT_ENABLED') ||
        settingsStore.settings.extra['postView.visible']) && (
        <TableCell>
          <span className="gray-color">{file.postViewCount || ''}</span>
        </TableCell>
      )}
      <TableCell>
        {!file.invisibility && (
          <span className={`font-bold ${file.status}`}>{FileStatus[file.status]}</span>
        )}
        {file.invisibility && <span className={`font-bold public-off`}>已隐藏</span>}
      </TableCell>
      <TableCell>
        <span className="gray-color">{ago(file.updatedAt)}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <span>
            <Tooltip title="编辑" placement="top">
              <IconButton
                className="mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  editFile(+file.id);
                }}
              >
                <CreateIcon />
              </IconButton>
            </Tooltip>
          </span>
          <div>
            <IconButton
              className="text-base"
              aria-label="more"
              aria-controls="dashboard-post-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
            >
              <Settings className="text-base" />
            </IconButton>
            <Menu
              id="dashboard-post-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              PaperProps={{
                style: {
                  width: 100,
                },
              }}
            >
              {isPublished && !file.invisibility && (
                <MenuItem
                  onClick={(e) => {
                    hideFile(file.id);
                  }}
                >
                  <Tooltip title="隐藏后的文章对他人不可见" placement="left">
                    <div className="flex items-center text-gray-700 leading-none">
                      <span className="flex items-center text-lg mr-2">
                        <VisibilityOff />
                      </span>
                      <span className="font-bold">隐藏</span>
                      <ButtonProgress color={'primary-color'} size={12} isDoing={hiding} />
                    </div>
                  </Tooltip>
                </MenuItem>
              )}
              {isPublished && file.invisibility && (
                <MenuItem
                  onClick={(e) => {
                    showFile(file.id);
                  }}
                >
                  <div className="flex items-center text-gray-700 leading-none">
                    <span className="flex items-center text-lg mr-2">
                      <Visibility />
                    </span>
                    <span className="font-bold">显示</span>
                    <ButtonProgress color={'primary-color'} size={12} isDoing={showing} />
                  </div>
                </MenuItem>
              )}
              <MenuItem
                onClick={(e) => {
                  confirmDialogStore.show({
                    content: '删除后无法找回，确定删除吗？',
                    ok: async () => {
                      confirmDialogStore.hide();
                      await sleep(300);
                      deleteFile(file.id);
                    },
                  });
                }}
              >
                <div>
                  <div className="flex items-center text-gray-700 leading-none">
                    <span className="flex items-center text-lg mr-2">
                      <DeleteIcon />
                    </span>
                    <span className="font-bold">删除</span>
                    <ButtonProgress color={'primary-color'} size={12} isDoing={deleting} />
                  </div>
                </div>
              </MenuItem>
            </Menu>
          </div>
          {isPublished && !file.invisibility && (
            <Tooltip title="查看文章" placement="top">
              <a href={`${readerUrl}/posts/${file.rId}`} target="_blank" rel="noopener noreferrer">
                <IconButton className="mr-1">
                  <LinkIcon />
                </IconButton>
              </a>
            </Tooltip>
          )}
          {isPublished && !file.invisibility && (
            <Button
              size="mini"
              outline
              className="ml-2"
              onClick={() =>
                modalStore.openContribution({
                  file,
                })
              }
            >
              投稿
            </Button>
          )}
        </div>
      </TableCell>
      <style jsx>{`
        .title {
          max-width: 16rem;
        }
      `}</style>
      <style jsx global>{`
        #dashboard-post-menu .MuiMenuItem-root {
          font-size: 14px !important;
        }
      `}</style>
    </TableRow>
  );
});
