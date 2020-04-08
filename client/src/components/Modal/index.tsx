import React from 'react';
import Modal from '@material-ui/core/Modal';
import Fade from '@material-ui/core/Fade';

export default (props: any) => {
  const { open, onClose } = props;
  return (
    <Modal open={open} onClose={onClose} className="flex justify-center items-center">
      <Fade in={open} timeout={open ? 300 : 100}>
        {props.children}
      </Fade>
    </Modal>
  );
};
