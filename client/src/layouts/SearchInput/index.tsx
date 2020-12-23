import React from 'react';
import classNames from 'classnames';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Input, InputAdornment } from '@material-ui/core';
import { Search } from '@material-ui/icons';
import { useHistory } from "react-router-dom";
import { isMobile, isPc } from 'utils';

import './index.sass';

interface Props {
  className?: string
}

export const SearchInput = observer((props: Props) => {
  const history = useHistory();
  const state = useLocalStore(() => ({
    width: 0,
    value: '',
    focused: false,
    inputRef: React.createRef<HTMLInputElement>(),
    searchRoot: React.createRef<HTMLDivElement>(),
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    state.value = e.target.value;
  };

  const handleSearch = () => {
    if (state.value.trim()) {
      history.push(`/search?query=${state.value.trim()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFocus = () => {
    state.focused = true;
  };

  const handleBlur = () => {
    state.focused = false;
  };

  const handleClick = () => {
    if (isMobile) {
      history.push(`/search?query=${state.value.trim()}`);
    }
  };

  const handleFocusInput = () => {
    state.inputRef.current?.focus();
  };

  return (
    <div
      className={classNames(
        'header-search-input-box flex flex-center relative',
        state.focused && isPc && 'focused',
        props.className,
      )}
      ref={state.searchRoot}
      onClick={handleClick}
    >
      <Input
        className="search-input flex-1 duration-300 ease-in-out text-white"
        placeholder="搜索文章"
        inputProps={{
          className: 'search-input-element',
        }}
        inputRef={state.inputRef}
        value={state.value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        startAdornment={
          <InputAdornment className="text-3xl" position="start">
            <Search className="ml-2 text-gray-88 text-30" onClick={handleFocusInput} />
          </InputAdornment>
        }
      />
    </div>
  );
});
