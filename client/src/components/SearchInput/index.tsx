import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import { useStore } from 'store';
import { MdSearch, MdClose } from 'react-icons/md';

interface IProps {
  size?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
  search: (value: string) => void;
  onBlur?: () => void;
}

export default observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    value: '',
  }));

  React.useEffect(() => {
    if (props.defaultValue && !state.value) {
      state.value = props.defaultValue;
    }
  }, [state, props]);

  const onChange = (e: any) => {
    state.value = e.target.value;
  };

  const onKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.target.blur();
      if (props.required && !state.value) {
        snackbarStore.show({
          message: '请输入要搜索的内容',
          type: 'error',
        });
        return;
      }
      props.search(state.value);
    }
  };

  const onBlur = () => {
    if (props.onBlur) {
      props.onBlur();
    }
  };

  return (
    <div className="relative">
      <div className="text-20 text-gray-af flex items-center absolute top-0 left-0 z-10 mt-7-px ml-9-px md:mt-8-px md:ml-10-px">
        <MdSearch />
      </div>
      {state.value && (
        <div className="flex items-center absolute top-0 right-0 z-10 mt-9-px mr-10-px md:mt-8-px">
          <div
            className="flex items-center h-4 w-4 md:h-5 md:w-5 justify-center bg-gray-ec text-gray-99 rounded-full text-12 md:text-16"
            onClick={() => {
              state.value = '';
            }}
          >
            <MdClose />
          </div>
        </div>
      )}
      <form action="/">
        <TextField
          className={`search-input ${props.className || 'w-72'} ${props.size || ''}`}
          placeholder={props.placeholder}
          size="small"
          autoFocus={props.autoFocus || false}
          value={state.value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          margin="none"
          variant="outlined"
          type="search"
        />
      </form>
      <style jsx global>{`
        .search-input .MuiOutlinedInput-root {
          border-radius: 30px !important;
        }
        .search-input .MuiOutlinedInput-input {
          padding: 10px 10px 9px 34px;
        }
        .search-input.small .MuiOutlinedInput-input {
          padding: 8px 9px 8px 33px;
        }
      `}</style>
    </div>
  );
});
