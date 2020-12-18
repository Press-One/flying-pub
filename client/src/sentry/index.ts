import * as Sentry from '@sentry/browser';
import SentryIgnoreErrors from './sentryIgnoreErrors';

export default {
  init: () => {
    Sentry.init({
      ignoreErrors: SentryIgnoreErrors,
      dsn: 'https://d7d05525733f4e8e880da3da812ea8f3@sentry.xue.cn/18',
    });
  },
};
