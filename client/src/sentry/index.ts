import * as Sentry from '@sentry/browser';
import SentryIgnoreErrors from './sentryIgnoreErrors';

export default {
  init: () => {
    Sentry.init({
      ignoreErrors: SentryIgnoreErrors,
      dsn: 'https://8375adf925c34925998c9b0ec0c89b71@sentry.xue.cn/11',
    });
  },
};
