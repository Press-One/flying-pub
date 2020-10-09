import { createMuiTheme } from '@material-ui/core';

export const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#3a6788',
      contrastText: '#fff',
    },
    secondary: {
      main: '#63b3ed',
      contrastText: '#fff',
    },
  },
  overrides: {
    MuiTypography: {
      body1: {
        fontFamily: 'inherit',
      },
    },
  },
});
