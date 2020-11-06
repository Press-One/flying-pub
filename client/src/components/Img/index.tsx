import React from 'react';
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
    rawImgProps: {} as any,
  }));

  React.useEffect(() => {
    state.src = resizeImage(props.src, getImageWidth(props.resizeWidth || 80));
    state.rawImgProps = { ...props };
    delete state.rawImgProps.useOriginalDefault;
    delete state.rawImgProps.resizeWidth;
    delete state.rawImgProps.ignoreError;
  }, [props.src, props.resizeWidth, state, props]);

  return (
    <img
      {...state.rawImgProps}
      src={state.src}
      alt={props.alt}
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
