import { createTheme } from "@mui/material";

export const colors = {
  main: "#00a800",
  highlight: "#ff6500",
  lowlight: "#b9b9b9",
  blue: "#0097ff",
  pink: "#ff0097",
};

export const theme = createTheme({
  typography: {
    fontFamily: "PrintChar21, Arial",
  },
  palette: {
    mode: "dark",
    primary: {
      main: colors.main,
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
