import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import DrawerModal from 'components/DrawerModal';
import DrawerMenu from 'components/DrawerMenu';
import Loading from 'components/Loading';
import { ago, sleep } from 'utils';
import { faEyeSlash, faImage } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MoreVert from '@material-ui/icons/MoreVert';
import { useHistory } from 'react-router-dom';
import fileApi, { IFile } from 'apis/file';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { useStore } from 'store';

const COVER_WIDTH = 40;

const DraftEntry = observer((props: { file: IFile; refreshPosts: () => void }) => {
  const { file } = props;
  const { confirmDialogStore, snackbarStore } = useStore();
  const history = useHistory();
  const state = useLocalStore(() => ({
    useOriginalCover: false,
    showMenu: false,
  }));

  return (
    <div>
      <div
        className="flex justify-between items-center py-3 pl-6 pr-1 border-b border-gray-300"
        onClick={() => (state.showMenu = true)}
      >
        <div className="flex items-center">
          {file.cover && (
            <div
              className="cover cover-container rounded"
              style={{
                backgroundImage: state.useOriginalCover
                  ? `url(${file.cover})`
                  : `url(${file.cover}?image=&action=resize:h_${COVER_WIDTH})`,
              }}
            >
              <img
                className="cover rounded invisible"
                src={`${file.cover}?image=&action=resize:h_${COVER_WIDTH}`}
                alt="封面"
                onError={() => {
                  if (!state.useOriginalCover) {
                    state.useOriginalCover = true;
                  }
                }}
              />
            </div>
          )}
          {!file.cover && (
            <div className="cover flex items-center justify-center text-40 text-gray-bd">
              <FontAwesomeIcon icon={faImage} />
            </div>
          )}
          <div className="ml-4 flex flex-col justify-between h-10">
            <div className="text-14 text-gray-4a truncate w-56">{file.title}</div>
            <div className="flex items-end text-12 text-gray-af">
              <div>{ago(file.updatedAt)} 更新</div>
              {file.invisibility && <span className="w-5 text-center opacity-75">·</span>}
              {file.invisibility && (
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faEyeSlash} />
                  <span className="ml-1">已隐藏</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-gray-af text-20 flex items-center px-5 py-3">
          <MoreVert />
        </div>
      </div>
      <DrawerMenu
        open={state.showMenu}
        onClose={() => {
          state.showMenu = false;
        }}
        items={[
          {
            invisible: file.invisibility,
            name: '编辑',
            onClick: () => {
              history.push(`/editor?id=${file.id}`);
            },
          },
          {
            invisible: !file.invisibility,
            name: '显示',
            onClick: () => {
              confirmDialogStore.show({
                content: '确定将文章设置为对他人可见？',
                ok: async () => {
                  try {
                    await fileApi.showFile(file.id);
                    confirmDialogStore.hide();
                    await sleep(100);
                    state.showMenu = false;
                    await sleep(200);
                    props.refreshPosts();
                    snackbarStore.show({
                      message: '文章已显示',
                    });
                  } catch (err) {
                    snackbarStore.show({
                      message: '设置失败',
                      type: 'error',
                    });
                  }
                },
              });
            },
            stayOpenAfterClick: true,
          },
          {
            name: '删除',
            onClick: () => {
              confirmDialogStore.show({
                content: '删除后无法找回，确定删除吗？',
                ok: async () => {
                  try {
                    await fileApi.deleteFile(file.id);
                    confirmDialogStore.hide();
                    await sleep(100);
                    state.showMenu = false;
                    await sleep(200);
                    props.refreshPosts();
                    snackbarStore.show({
                      message: '文章已删除',
                    });
                  } catch (err) {
                    snackbarStore.show({
                      message: '删除失败',
                      type: 'error',
                    });
                  }
                },
              });
            },
            className: 'text-red-400',
            stayOpenAfterClick: true,
          },
        ]}
      />
      <style jsx>{`
        .cover-container {
          background-size: cover;
          background-position: center center;
        }
        .cover {
          width: ${COVER_WIDTH}px;
          height: ${COVER_WIDTH}px;
        }
      `}</style>
    </div>
  );
});

const Drafts = observer(() => {
  const state = useLocalStore(() => ({
    get hasFiles() {
      return this.files.length > 0;
    },
    hasMore: false,
    page: 0,
    total: 0,
    files: [] as IFile[],
    isFetching: false,
    isFetched: false,
  }));
  const LIMIT = 10;

  const fetchPosts = React.useCallback(() => {
    (async () => {
      if (state.isFetching) {
        return;
      }
      state.isFetching = true;
      try {
        const res = await fileApi.getFiles({
          type: 'DRAFT',
          offset: state.page * LIMIT,
          limit: LIMIT,
        });
        state.files.push(...(res.files as IFile[]));
        state.total = res.total as number;
        state.hasMore = res.files.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [state]);

  React.useEffect(() => {
    fetchPosts();
  }, [state, state.page, fetchPosts]);

  const infiniteRef: any = useInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    scrollContainer: 'parent',
    threshold: 80,
    onLoadMore: () => {
      state.page = state.page + 1;
    },
  });

  return (
    <div className="py-8 bg-white rounded-12 text-gray-4a">
      <div className="font-bold items-center text-18 flex justify-center">草稿</div>
      <div className="mt-3 h-80-vh overflow-y-auto" ref={infiniteRef}>
        {!state.isFetched && (
          <div className="pt-24 flex items-center justify-center">
            <Loading />
          </div>
        )}
        {state.isFetched && !state.hasFiles && (
          <div className="py-20 text-center text-gray-500 text-14">空空如也 ~</div>
        )}
        {state.isFetched &&
          state.files.map((file, idx: number) => (
            <div key={idx}>
              <DraftEntry
                file={file}
                refreshPosts={() => {
                  state.page = 0;
                  state.isFetched = false;
                  state.files = [];
                  fetchPosts();
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
});

export default (props: any) => {
  return (
    <DrawerModal open={props.open} onClose={props.close}>
      <Drafts />
    </DrawerModal>
  );
};
