import React from 'react';
import { TextField, Tabs, Tab } from '@material-ui/core';
import Button from 'components/Button';
import ButtonProgress from 'components/ButtonProgress';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import { useStore } from 'store';
import Api from 'api';

export default () => {
  const [value, setValue] = React.useState('');
  const [isFetching, setIsFetching] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [tab, setTab] = React.useState(0);
  const [resultPost, setResultPost] = React.useState<any>();
  const [deletedPosts, setDeletedPosts] = React.useState<any[]>([]);
  const { snackbarStore, confirmDialogStore } = useStore();

  React.useEffect(() => {
    if (tab === 1) {
      fetchDeletedPosts();
    }
  }, [tab]);

  const changeValue = (e: any) => setValue(e.target.value);

  const search = async () => {
    if (!value) {
      snackbarStore.show({
        message: '请粘贴你要操作的文章链接',
        type: 'error',
      });
      return;
    }
    try {
      const rId = value.split('/posts/')[1];
      if (!rId) {
        snackbarStore.show({
          message: '无效的文章链接',
          type: 'error',
        });
        return;
      }
      setResultPost(null);
      setIsSearching(true);
      await sleep(1000);
      const post = await Api.getReaderPost(rId);
      setResultPost(post);
    } catch (err) {
      snackbarStore.show({
        message: '没有搜索到相关的文章',
        type: 'error',
      });
    }
    setIsSearching(false);
  };

  const tryDenyPost = (rId: string) => {
    confirmDialogStore.show({
      content: '禁止之后，阅读站将不再显示这篇文章',
      ok: async () => {
        confirmDialogStore.setLoading(true);
        await confirm(rId, 'deny');
        confirmDialogStore.setLoading(false);
        confirmDialogStore.hide();
      },
    });
  };

  const tryAllowPost = (rId: string) => {
    confirmDialogStore.show({
      content: '阅读站将恢复显示这篇文章',
      ok: async () => {
        confirmDialogStore.setLoading(true);
        await confirm(rId, 'allow');
        confirmDialogStore.setLoading(false);
        confirmDialogStore.hide();
      },
    });
  };

  const confirm = async (rId: string, actionType: string) => {
    try {
      actionType === 'deny' ? await Api.denyReaderPost(rId) : await Api.allowReaderPost(rId);
      setResultPost(null);
      if (tab === 0 && actionType === 'deny') {
        setTab(1);
      } else {
        await fetchDeletedPosts();
      }
      snackbarStore.show({
        message: `已${actionType === 'deny' ? '禁止' : '允许'}`,
      });
    } catch (err) {
      snackbarStore.show({
        message: err.message,
      });
    }
  };

  const fetchDeletedPosts = async () => {
    setIsFetching(true);
    try {
      const { posts } = await Api.getBannedReaderPosts();
      await sleep(800);
      setDeletedPosts(posts);
    } catch (err) {
      console.log({ err });
    }
    setIsFetching(false);
  };

  const PostSearcher = () => {
    return (
      <div>
        <div className="flex items-center">
          <TextField
            className="w-5/12"
            placeholder="粘贴你要操作的文章链接"
            value={value}
            onChange={changeValue}
            margin="dense"
            variant="outlined"
          />
          <div className="ml-4 mt-1">
            <Button onClick={search}>
              搜索
              <ButtonProgress isDoing={isSearching} />
            </Button>
          </div>
        </div>
        {resultPost && PostSearcherResult()}
      </div>
    );
  };

  const Post = (post: any) => (
    <div className="flex items-center mt-4">
      <div className="flex items-center">
        <img
          className="w-10 h-10 rounded-full border border-gray-300"
          src={post.author.avatar}
          alt={post.author.name}
        />
        <span className="ml-2 text-gray-800 w-16 truncate">{post.author.name}</span>
      </div>
      <div className="ml-4 text-black font-bold title truncate">{post.title}</div>
      <div className="ml-4">
        {post.deleted && <Button onClick={() => tryAllowPost(post.rId)}>允许</Button>}
        {!post.deleted && (
          <Button className="bg-red-color" onClick={() => tryDenyPost(post.rId)}>
            禁止
          </Button>
        )}
      </div>
      <style jsx>{`
        .title {
          width: 400px;
        }
      `}</style>
    </div>
  );

  const PostSearcherResult = () => {
    return (
      <div>
        <div className="mt-5">
          <div className="text-gray-800 text-base font-bold">搜索结果：</div>
          {Post(resultPost)}
        </div>
      </div>
    );
  };

  const DenyPosts = () => (
    <div>
      {deletedPosts.length === 0 && <div className="py-4">还没有禁止过任何文章</div>}
      {deletedPosts.map((post: any) => (
        <div key={post.rId}>{Post(post)}</div>
      ))}
    </div>
  );

  return (
    <div className="p-topic max-w-1200 flex flex-col">
      <section className="p-topic-head flex items-center justify-between">
        <div className="p-topic-head-title">文章权限</div>
      </section>

      <section className="p-topic-main flex flex-col max-w-1200">
        <div className="p-topic-main-inner flex flex-col MuiPaper-elevation1">
          <Tabs className="flex" value={tab} onChange={(_e, v) => setTab(v)}>
            <Tab label="操作文章" />
            <Tab label="禁止显示的文章" />
          </Tabs>
          <div className="py-4 p-8">
            {tab === 0 && PostSearcher()}
            {tab === 1 && !isFetching && DenyPosts()}
            {tab === 1 && isFetching && (
              <div className="mt-10 flex justify-start ml-32">
                <Loading size={40} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
