import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Auth0Provider } from "@auth0/auth0-react";

console.log("DEVELOPMENT LOGGING");
console.log("Environment Variables:");
console.log("REACT_APP_SERVER_URL:",process.env.REACT_APP_SERVER_URL);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider 
      domain="clinicsandqs-users.eu.auth0.com"
      clientId="NrGmmUmMUZKOW2fmf2tWMTDLmWFLOkYx"
      authorizationParams={{ 
        redirect_uri: window.location.origin,
        audience: `${process.env.REACT_APP_SERVER_URL}`
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();