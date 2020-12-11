import React from 'react';
import classNames from 'classnames';
import { action, observable } from 'mobx';
import escapeStringRegexp from 'escape-string-regexp';
import { defineComponent, onMounted } from '@firefox-pro-coding/react-composition-api';
import { Fade, OutlinedInput } from '@material-ui/core';

import { bookService } from '@/service/book';
import { Book } from '@/api/books';
import { resizeQincloudImageUrlH } from '@/utils';
import { bookSearch } from '@/utils/bookSearch';

import './index.sass';

interface Props {
  className?: string
  value: string
  onChange: (v: string) => unknown
  onEnter: () => unknown
}

export const SearchInput = defineComponent((props: Props) => {
  const state = observable({
    index: -1,
    width: 0,

    filterTimer: 0,
    result: {
      open: false,
      list: [] as Array<Book>,
      keywords: [] as Array<string>,
    },
    renderBox: false,

    searchRoot: React.createRef<HTMLDivElement>(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange(e.target.value);
    handleFilterBooks();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const book = state.result.list[state.index];
      if (book) {
        e.preventDefault();
        window.open(`/hub/app/books/${book.id}`, '_blank', 'noopener');
        return;
      }

      props.onEnter();
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      changeIndex(1);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      changeIndex(-1);
    }
    if (e.key === 'Escape') {
      state.index = -1;
      handleCloseSuggestion();
    }
  };

  const changeIndex = action((delta: 1 | -1) => {
    let newIndex = state.index + delta;
    if (newIndex < 0) {
      newIndex = state.result.list.length - 1;
    }
    if (newIndex >= state.result.list.length) {
      newIndex = 0;
    }

    state.index = newIndex;
  });

  const handleFilterBooks = () => {
    window.clearTimeout(state.filterTimer);

    state.filterTimer = window.setTimeout(action(() => {
      if (!props.value || !bookService.state.allLoaded) {
        handleCloseSuggestion();
        return;
      }

      const keywords = props.value.toLowerCase().split(' ').filter(Boolean);
      const list = bookSearch(bookService.state.books, keywords);

      if (list.length) {
        state.result = {
          list: list.filter((_v, i) => i < 8).map((v) => v.book),
          keywords,
          open: true,
        };
        state.index = -1;
      } else {
        handleCloseSuggestion();
      }
    }), 100);
  };

  const handleOpenSuggestion = action(() => {
    if (state.result.list.length) {
      state.result.open = true;
    }
  });

  const handleCloseSuggestion = action(() => {
    state.result.open = false;
    window.clearTimeout(state.filterTimer);
  });

  onMounted(() => {
    bookService.listIfNone();
  });

  return () => (
    <div
      className={classNames(
        'flex flex-center relative',
        props.className,
      )}
      ref={state.searchRoot}
    >
      <OutlinedInput
        className="flex-1"
        placeholder="要搜索的内容"
        value={props.value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFilterBooks}
        onBlur={handleCloseSuggestion}
        margin="dense"
      />

      <Fade
        in={state.result.open}
        mountOnEnter
        unmountOnExit
        timeout={200}
      >
        <div
          className={classNames(
            'book-suggestion-box absolute left-0 right-0 top-0 mt-12 rounded z-10',
            'bg-white shadow-3 divide-y divide-gray-d8 overflow-hidden leading-relaxed',
          )}
          tabIndex={-1}
          onFocus={handleOpenSuggestion}
          onBlur={handleCloseSuggestion}
        >
          {state.result.list.map((v, i) => (
            <a
              className={classNames(
                'book-item flex p-2 hover:bg-gray-ec select-none cursor-pointer',
                state.index === i && 'bg-gray-ec',
              )}
              href={`/hub/app/books/${v.id}`}
              target="_blank"
              key={v.id}
            >
              <div className="book-cover flex-none overflow-hidden flex flex-center">
                <img
                  className="border border-gray-88 border-solid"
                  src={resizeQincloudImageUrlH(v.cover, 50)}
                  srcSet={`${resizeQincloudImageUrlH(v.cover, 100)} 2x, ${resizeQincloudImageUrlH(v.cover, 150)} 3x`}
                  alt=""
                />
              </div>

              <div className="ml-2 flex-col w-0 flex-1 justify-between">
                <div className="text-16 text-gray-af truncate text-gray-af">
                  <span className="mr-2 text-gray-4a font-medium">
                    {split(v.name, state.result.keywords).map((item, i) => (
                      <span className={item.type === 'text' ? '' : 'text-dark-peach'} key={i}>
                        {item.text}
                      </span>
                    ))}
                  </span>

                  <span className="text-gray-af text-12">
                    {v.authors.filter(Boolean).map((a) => {
                      const node = split(a.name, state.result.keywords).map((item, i) => (
                        <span className={item.type === 'text' ? '' : 'text-dark-peach'} key={i}>
                          {item.text}
                        </span>
                      ));
                      return (<React.Fragment key={a.id}>
                        {node} {`${a.role === 'origin' ? '著' : '译'}`} &nbsp;
                      </React.Fragment>);
                    })}
                  </span>
                </div>

                <div className="text-gray-af mt-1 truncate text-12">
                  {split(v.description, state.result.keywords).map((item, i) => (
                    <span className={item.type === 'text' ? '' : 'text-dark-peach'} key={i}>
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))}

          {!!state.result.list.length && (
            <a
              className={classNames(
                'flex flex-center p-2 hover:bg-gray-ec select-none cursor-pointer',
                'text-14 text-gray-99 hover:text-link',
                state.index === state.result.list.length && 'bg-gray-ec',
              )}
              href="/hub/app/bookshelf"
              target="_blank"
              rel="noopener"
            >
              浏览 XUE.cn 书库
            </a>
          )}
        </div>
      </Fade>
    </div>
  );
});

const split = (text: string, searchWord: Array<string>) => {
  const allMatches = searchWord.flatMap((k) => {
    const regexp = new RegExp(escapeStringRegexp(k), 'gi');
    return [...text.matchAll(regexp)];
  }).map((v) => ({ start: v.index!, end: v.index! + v[0].length }));

  // merge intervals
  allMatches.sort((a, b) => a.start - b.start);
  const list = allMatches.reduce<typeof allMatches>((p, c) => {
    const last = p[p.length - 1];
    if (last && c.start <= last.end) {
      last.end = Math.max(c.end, last.end);
    } else {
      p.push(c);
    }

    return p;
  }, []);

  // transform intervals to text pieces
  const result = [];
  let lastIndex = 0;
  for (const item of list) {
    result.push({
      text: text.substring(lastIndex, item.start),
      type: 'text',
    });
    lastIndex = item.end;
    result.push({
      text: text.substring(item.start, item.end),
      type: 'highlight',
    });
  }

  result.push({
    text: text.substring(lastIndex, text.length),
    type: 'text',
  });

  return result.filter((v) => v.text);
};
