import { createTheme } from "@mui/material";

export const theme = createTheme({
  typography: {
    fontFamily: "PrintChar21, Arial",
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#33FF33",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'PrintChar21';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('PrintChar21'), local('PrintChar21-Regular'), url(/assets/fonts/PrintChar21.ttf) format('truetype');
          unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
        }
      `,
    },
  },
});
