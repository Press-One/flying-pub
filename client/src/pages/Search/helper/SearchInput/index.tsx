import React from 'react';
import classNames from 'classnames';
import { OutlinedInput } from '@material-ui/core';
import { observer, useLocalStore } from 'mobx-react-lite';

interface Props {
  className?: string
  value: string
  onChange: (v: string) => unknown
  onEnter: () => unknown
}

export const SearchInput = observer((props: Props) => {
  const state = useLocalStore(() => ({
    width: 0,
    searchRoot: React.createRef<HTMLDivElement>(),
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      props.onEnter();
    }
  };

  return (
    <div
      className={classNames(
        'flex justify-center items-center relative',
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
        margin="dense"
      />
    </div>
  );
});
