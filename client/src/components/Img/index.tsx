import React from 'react';
import { toJS } from 'mobx';
import { observer, useLocalStore } from 'mobx-react-lite';
import { resizeImage, getDefaultAvatar, getImageWidth } from 'utils';

interface IProps {
  useOriginalDefault?: boolean;
  resizeWidth?: number;
  ignoreError?: boolean;
  [k: string]: any;
}

export default observer((props: IProps) => {
  const state = useLocalStore(() => ({
    src: '',
    style: {} as any,
    rawImgProps: {} as any,
  }));

  React.useEffect(() => {
    state.src = resizeImage(props.src, getImageWidth(props.resizeWidth || 80));
    state.rawImgProps = { ...props };
    delete state.rawImgProps.useOriginalDefault;
    delete state.rawImgProps.resizeWidth;
    delete state.rawImgProps.ignoreError;
    if (props.width) {
      state.style.width = props.width;
    }
    if (props.height) {
      state.style.height = props.height;
    }
  }, [props.src, props.resizeWidth, state, props]);

  return (
    <img
      {...state.rawImgProps}
      src={state.src}
      alt={props.alt}
      style={toJS(state.style)}
      onError={() => {
        if (props.ignoreError) {
          return;
        }
        if (state.src === props.src || state.src === getDefaultAvatar()) {
          return;
        }
        state.src = props.useOriginalDefault ? props.src : getDefaultAvatar();
      }}
    />
  );
});
