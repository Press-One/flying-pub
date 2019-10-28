import React from 'react';
import { observer } from 'mobx-react-lite';

import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import { useStore } from 'store';

const variantIcon = {
  success: CheckCircleIcon,
  error: ErrorIcon,
};

export default observer(() => {
  const { snackbarStore } = useStore();
  const Icon = variantIcon[snackbarStore.type === 'error' ? 'error' : 'success'];
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={snackbarStore.open}
      autoHideDuration={snackbarStore.autoHideDuration}
      onClose={() => snackbarStore.close()}
      className="snackBar"
    >
      <SnackbarContent
        message={
          <span id="client-snackbar">
            <Icon className="mr-2" />
            {snackbarStore.message}
          </span>
        }
        action={[
          null,
          <IconButton
            key="close"
            aria-label="close"
            color="inherit"
            onClick={() => {
              snackbarStore.close();
            }}
          >
            <CloseIcon />
          </IconButton>,
        ]}
      />
    </Snackbar>
  );
});
