import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { isMobile } from 'utils';

import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

const variantIcon = {
  success: CheckCircleIcon,
  error: ErrorIcon,
};

export default observer(() => {
  const { snackbarStore } = useStore();
  const Icon = variantIcon[snackbarStore.type === 'error' ? 'error' : 'success'];
  return (
    <div>
      <Snackbar
        anchorOrigin={{ vertical: isMobile ? 'top' : 'bottom', horizontal: 'center' }}
        open={snackbarStore.open}
        autoHideDuration={snackbarStore.autoHideDuration}
        onClose={() => snackbarStore.close()}
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
      <style jsx global>{`
        .MuiSnackbar-root .MuiTypography-root {
          background: ${snackbarStore.type === 'error'
            ? '#fc8181 !important'
            : '#63b3ed !important'};
        }
      `}</style>
    </div>
  );
});
