import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import Sentry from './sentry';
import { isProduction } from 'utils';

if (isProduction) {
  Sentry.init();
}

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();
