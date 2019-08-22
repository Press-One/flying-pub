import * as Sentry from '@sentry/browser';
import SentryIgnoreErrors from './sentryIgnoreErrors';

export default {
  init: () => {
    Sentry.init({
      ignoreErrors: SentryIgnoreErrors,
      dsn: 'https://345262eccd9f4679a94452bfc43d7eba@sentry.xue.cn/8',
    });
  },
};
