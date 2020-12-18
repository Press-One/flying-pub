import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import Loading from 'components/Loading';
import pixabayApi from 'apis/pixabay';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import BottomLine from 'components/BottomLine';
import Dialog from '@material-ui/core/Dialog';
import DrawerModal from 'components/DrawerModal';
import { isMobile, sleep, isPc } from 'utils';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';

const LIMIT = isMobile ? 20 : 24;

const containsChinese = (s: string) => {
  const pattern = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
  if (pattern.exec(s)) {
    return true;
  } else {
    return false;
  }
};

const ImageLib = observer((props: any) => {
  const state = useLocalStore(() => ({
    isFetching: false,
    isFetched: false,
    page: 1,
    searchKeyword: '',
    keyword: '',
    hasMore: false,
    total: 0,
    images: [] as any,
    tooltipDisableHoverListener: true,
    get ids() {
      return this.images.map((image: any) => image.id);
    },
  }));
  const RATIO = 16 / 9;

  React.useEffect(() => {
    if (state.isFetching) {
      return;
    }
    state.isFetching = true;
    (async () => {
      try {
        const query: string = state.searchKeyword.split(' ').join('+');
        const res: any = await pixabayApi.search({
          q: query,
          page: state.page,
          per_page: LIMIT,
          lang: containsChinese(query) ? 'zh' : 'en',
        });
        for (const image of res.hits) {
          if (!state.ids.includes(image.id)) {
            state.images.push(image);
          }
        }
        state.total = res.totalHits;
        state.hasMore = res.hits.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
      state.isFetched = true;
      if (state.tooltipDisableHoverListener) {
        await sleep(3000);
        state.tooltipDisableHoverListener = false;
      }
    })();
  }, [state, state.page, state.searchKeyword]);

  const infiniteRef: any = useInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    scrollContainer: 'parent',
    threshold: 80,
    onLoadMore: () => {
      state.page = state.page + 1;
    },
  });

  const search = async () => {
    state.images = [];
    state.page = 1;
    state.isFetched = false;
    state.searchKeyword = state.keyword;
  };

  const onKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      search();
      e.target.blur();
    }
  };

  const SearchInput = () => (
    <div className="flex items-center justify-center image-search">
      <form action="/">
        <TextField
          className="w-64 md:w-72"
          placeholder="输入关键词"
          size="small"
          value={state.keyword}
          onChange={(e) => (state.keyword = e.target.value)}
          onKeyDown={onKeyDown}
          margin="dense"
          variant="outlined"
          type="search"
        />
      </form>
      <style jsx global>{`
        .image-search .MuiOutlinedInput-root {
          border-radius: 30px !important;
        }
      `}</style>
    </div>
  );

  return (
    <div className="bg-white rounded-12 text-center p-0 md:p-8 md:pt-5">
      <div className="md:w-600-px relative pt-4 md:pt-0">
        {SearchInput()}
        {isPc && (
          <Tooltip placement="top" arrow title="图片由 Pixabay 提供，都是免费可自由使用的">
            <a
              href="https://pixabay.com/zh"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-0 right-0 w-20 -mr-3 mt-5"
            >
              <img src="https://i.xue.cn/172e1214.png" alt="pixabay" />
            </a>
          </Tooltip>
        )}
        <div
          className="mt-3 md:mt-2 overflow-y-auto p-1"
          style={{
            height: isPc ? 400 : '84vh',
          }}
        >
          <div
            className={classNames(
              {
                sm: isMobile,
              },
              'grid-container',
            )}
            ref={infiniteRef}
          >
            {state.images.map((image: any) => (
              <div key={image.id} id={image.id}>
                <Tooltip
                  placement="left"
                  arrow
                  enterDelay={500}
                  enterNextDelay={500}
                  disableHoverListener={state.tooltipDisableHoverListener}
                  disableTouchListener
                  title={
                    <img
                      className="max-w-none"
                      style={{
                        width: Math.min(image.webformatWidth, 280),
                        height:
                          (Math.min(image.webformatWidth, 280) * image.webformatHeight) /
                          image.webformatWidth,
                      }}
                      src={image.webformatURL.replace('_640', '_340')}
                      alt="图片"
                    />
                  }
                >
                  <div
                    className={'rounded image cursor-pointer'}
                    style={{
                      backgroundImage: `url(${image.webformatURL.replace(
                        '_640',
                        isMobile ? '_340' : '_180',
                      )})`,
                      width: isMobile ? window.innerWidth * 0.42 : 132,
                      height: (isMobile ? window.innerWidth * 0.42 : 132) / RATIO,
                    }}
                    onClick={() => props.selectImage(image.webformatURL)}
                  />
                </Tooltip>
              </div>
            ))}
          </div>
          {state.isFetched && state.total === 0 && (
            <div className="py-20 text-center text-gray-500 text-14">
              没有搜索到相关的图片呢
              <br />
              <div className="mt-1">换个关键词试试</div>
              <div className="mt-1">也可以换英文试一试</div>
            </div>
          )}
          {state.isFetched && state.total > 0 && state.total === state.images.length && (
            <div className="pb-5 -mt-2">
              <BottomLine />
            </div>
          )}
          {!state.isFetched && (
            <div className="pt-20 mt-2">
              <Loading />
            </div>
          )}
          {state.isFetched && state.hasMore && (
            <div className="py-8 flex items-center justify-center">
              <Loading />
            </div>
          )}
        </div>
        <style jsx>
          {`
            .image {
              background-size: cover;
              background-position: center center;
            }
            .grid-container {
              padding: 10px 4px;
              width: 100%;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              grid-auto-rows: minmax(62px, 62px);
              row-gap: 24px;
              column-gap: 0;
              align-items: center;
              justify-items: center;
            }
            .grid-container.sm {
              padding: 10px 12px;
              grid-template-columns: repeat(2, 1fr);
              row-gap: 38px;
            }
          `}
        </style>
      </div>
    </div>
  );
});

export default (props: any) => {
  const { open, close } = props;

  if (isMobile) {
    return (
      <DrawerModal open={open} onClose={close}>
        <ImageLib {...props} />
      </DrawerModal>
    );
  }

  return (
    <Dialog open={open} onClose={close} maxWidth={false}>
      <ImageLib {...props} />
    </Dialog>
  );
};
