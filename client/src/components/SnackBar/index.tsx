import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { isMobile } from 'utils';

import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

  if (isMobile) {
    return (
      <div>
        {snackbarStore.open && (
          <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center snackbar-container">
            <div className="bg-black p-8 max-w-5xl rounded-12 text-white mask">
              <div className="text-50 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={snackbarStore.type === 'error' ? faTimesCircle : faCheckCircle}
                />
              </div>
              <div className="mt-4 text-16 text-center content">{snackbarStore.message}</div>
            </div>
          </div>
        )}
        <style jsx>{`
          .snackbar-container {
            z-index: 999999;
          }
          .content {
            max-width: 200px;
            min-width: 150px;
          }
          .mask {
            background-color: rgba(0, 0, 0, 0.9);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <Snackbar
        className="snack-bar"
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
        .snack-bar > div {
          background: ${snackbarStore.type === 'error'
            ? '#fc8181 !important'
            : '#63b3ed !important'};
        }
      `}</style>
    </div>
  );
});
