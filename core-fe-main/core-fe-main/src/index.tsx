/* eslint-disable */
import { ThemeProvider } from '@mui/material';
import { Amplify } from 'aws-amplify';
import flat from 'flat';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.scss';
import reportWebVitals from './reportWebVitals';
import store from './store';
import Theme from './styles/MuiTheme';
import enMessages from './translations/en.json';
import { awsConfig } from './utils/auth';

window.React = React;

Amplify.configure(awsConfig);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <React.StrictMode>
  <Provider store={store}>
    <IntlProvider locale="en" messages={flat(enMessages)}>
      <Router>
        <ThemeProvider theme={Theme}>
          <App />
        </ThemeProvider>
      </Router>
    </IntlProvider>
  </Provider>,
  // </React.StrictMode>,
);

reportWebVitals();
