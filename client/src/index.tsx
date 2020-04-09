import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import Sentry from './sentry';

if (process.env.NODE_ENV === 'production') {
  Sentry.init();
}

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();

