import { Box, Grid, ThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { useCallback, useState } from "react";
import { ControlContainer } from "./modules/control/ControlContainer";
import { CPUContainer } from "./modules/cpu/CPUContainer";
import { RAMContainer } from "./modules/ram/RAMContainer";
import { ROMContainer } from "./modules/rom/ROMContainer";
import { theme } from "./theme/ThemeSetup";
import { ParseRom } from "./helpers/ROMParser";
import { System } from "./lib/System";
import { ROM } from "./lib/ROM";

export const ROM_OFFSET = 0x4000;

let system: System | undefined;

export type CPUState = {
  A: string;
  X: string;
  Y: string;
  PC: string;
  cycles: string;
};

function App() {
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>();
  const [rom, setRom] = useState<string | undefined>();
  const [cpuState, setCpuState] = useState<CPUState>({
    A: "-",
    X: "-",
    Y: "-",
    PC: "-",
    cycles: "-",
  });

  const loadRom = useCallback((romBuffer: ArrayBuffer) => {
    setRom(ParseRom(romBuffer));
    const sys = new System(
      new ROM(Array.from(new Uint8Array(romBuffer)), ROM_OFFSET)
    );
    sys.observe((newSystem) => {
      setCpuState({
        A: newSystem.cpu.A.toString(),
        X: newSystem.cpu.X.toString(),
        Y: newSystem.cpu.Y.toString(),
        PC: newSystem.cpu.PC.toString(16).padStart(4, "0"),
        cycles: newSystem.cpu.cycles + "",
      });
    });
    sys.reset();

    system = sys;
  }, []);

  return (
    <Box sx={{ height: "100%" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 1, borderBottom: "5px solid grey" }}>
          <ControlContainer
            loadRom={loadRom}
            reset={() => {
              system?.reset();
            }}
            step={
              rom
                ? () => {
                    system?.cpu.step();
                  }
                : undefined
            }
            play={
              !timer && rom
                ? () => {
                    const to = setInterval(() => {
                      system?.cpu.step();
                    }, 100);
                    setTimer(to);
                  }
                : undefined
            }
            stop={
              timer
                ? () => {
                    clearTimeout(timer);
                    setTimer(undefined);
                  }
                : undefined
            }
          />
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
                  <CPUContainer cpuState={cpuState} />
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
