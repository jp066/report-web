import React from "react";

const ButtonAlt: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button {...props} className={`buttonAlt ${props.className || ""}`}>
    {props.children}
  </button>
);

const ButtonReport: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button {...props} className={`buttonReport ${props.className || ""}`}>
    {props.children}
  </button>
);

const ButtonHeader: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button {...props} className={`buttonHeader ${props.className || ""}`}>
    {props.children}
  </button>
);

const ButtonDownload: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button {...props} className={`buttonDownload ${props.className || ""}`}>
    {props.children}
  </button>
);

const ButtonLogin: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button {...props} className={`buttonLogin ${props.className || ""}`}>
    {props.children}
  </button>
);

const ButtonSignUp: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button {...props} className={`buttonSignUp ${props.className || ""}`}>
    {props.children}
  </button>
);

export { ButtonAlt, ButtonReport, ButtonHeader, ButtonDownload, ButtonLogin, ButtonSignUp };