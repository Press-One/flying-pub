import React from 'react';
import { TextField, Tabs, Tab } from '@material-ui/core';
import Button from 'components/Button';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import { useStore } from 'store';
import Api from '../../api';
import Img from 'components/Img';

export default () => {
  const [value, setValue] = React.useState('');
  const [isFetching, setIsFetching] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [tab, setTab] = React.useState(0);
  const [resultPost, setResultPost] = React.useState<any>();
  const [stickyPosts, setStickyPosts] = React.useState<any[]>([]);
  const { snackbarStore } = useStore();

  React.useEffect(() => {
    if (tab === 1) {
      fetchStickyPosts();
    }
  }, [tab]);

  const changeValue = (e: any) => setValue(e.target.value);

  const search = async () => {
    if (!value) {
      snackbarStore.show({
        message: '请粘贴你要置顶的文章链接',
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

  const stickyPost = (rId: string) => {
    submit('stick', rId);
  };

  const unstickyPost = (rId: string) => {
    submit('unstick', rId);
  };

  const submit = async (actionType: string, rId: string) => {
    try {
      actionType === 'stick' ? await Api.stickyReaderPost(rId) : await Api.unstickyReaderPost(rId);
      setResultPost(null);
      if (tab === 0 && actionType === 'stick') {
        setTab(1);
      } else {
        await fetchStickyPosts();
      }
      snackbarStore.show({
        message: `已${actionType === 'stick' ? '置顶' : '取消置顶'}`,
      });
    } catch (err) {
      snackbarStore.show({
        message: err.message,
      });
    }
  };

  const fetchStickyPosts = async () => {
    setIsFetching(true);
    try {
      const { posts } = await Api.getStickyReaderPosts();
      await sleep(800);
      setStickyPosts(posts);
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
            placeholder="粘贴你要置顶的文章链接"
            value={value}
            onChange={changeValue}
            margin="dense"
            variant="outlined"
          />
          <div className="ml-4 mt-1">
            <Button onClick={search} isDoing={isSearching}>
              搜索
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
        <Img
          className="w-10 h-10 rounded-full border border-gray-300"
          src={post.author.avatar}
          alt={post.author.nickname}
        />
        <span className="ml-2 text-gray-800 w-16 truncate">{post.author.nickname}</span>
      </div>
      <div className="ml-4 text-black font-bold title truncate">{post.title}</div>
      <div className="ml-4">
        {post.sticky && (
          <Button className="bg-red-color" onClick={() => unstickyPost(post.rId)}>
            取消置顶
          </Button>
        )}
        {!post.sticky && <Button onClick={() => stickyPost(post.rId)}>置顶</Button>}
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

  const StickyPosts = () => (
    <div>
      {stickyPosts.length === 0 && <div className="py-4">还没有置顶过任何文章</div>}
      {stickyPosts.map((post: any) => (
        <div key={post.rId}>{Post(post)}</div>
      ))}
    </div>
  );

  return (
    <div className="p-topic max-w-1200 flex flex-col">
      <section className="p-topic-head flex items-center justify-between">
        <div className="p-topic-head-title">文章置顶</div>
      </section>

      <section className="p-topic-main flex flex-col max-w-1200">
        <div className="p-topic-main-inner flex flex-col MuiPaper-elevation1">
          <Tabs className="flex" value={tab} onChange={(_e, v) => setTab(v)}>
            <Tab label="置顶文章" />
            <Tab label="已置顶的文章" />
          </Tabs>
          <div className="py-4 p-8">
            {tab === 0 && PostSearcher()}
            {tab === 1 && !isFetching && StickyPosts()}
            {tab === 1 && isFetching && (
              <div className="mt-10 flex justify-start ml-32">
                <Loading />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
