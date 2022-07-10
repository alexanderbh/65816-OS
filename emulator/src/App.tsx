import { Box, Grid, ThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { useState } from "react";
import { ControlContainer } from "./modules/control/ControlContainer";
import { CPUContainer } from "./modules/cpu/CPUContainer";
import { RAMContainer } from "./modules/ram/RAMContainer";
import { ROMContainer } from "./modules/rom/ROMContainer";
import { theme } from "./theme/ThemeSetup";

function App() {
  const [rom, setRom] = useState<string>();
  return (
    <Box sx={{ height: "100%" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 1, borderBottom: "5px solid grey" }}>
          <ControlContainer setRom={setRom} />
        </Box>
        <Grid container sx={{ height: "100%" }}>
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                p: 1,
                height: "100%",
                borderRight: { xs: "0px", sm: "5px solid grey" },
                borderBottom: "5px solid grey",
              }}
            >
              <ROMContainer rom={rom} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Grid container>
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 1,
                    borderBottom: "5px solid grey",
                  }}
                >
                  <CPUContainer />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 1,
                    borderBottom: "5px solid grey",
                  }}
                >
                  <RAMContainer />
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </ThemeProvider>
    </Box>
  );
}

export default App;
