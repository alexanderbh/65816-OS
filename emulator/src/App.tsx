import { Box, Grid, ThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { useCallback, useState } from "react";
import { ControlContainer } from "./modules/control/ControlContainer";
import { CPUContainer } from "./modules/cpu/CPUContainer";
import { RAMContainer } from "./modules/ram/RAMContainer";
import { ROMContainer } from "./modules/rom/ROMContainer";
import { theme } from "./theme/ThemeSetup";
import { ParseRom } from "./helpers/ROMParser";

export const ROM_OFFSET = 0x8000;

const worker = new Worker(new URL("./workers/worker.ts", import.meta.url));

export type CPUState = {
  A: string;
  X: string;
  Y: string;
  PC: string;
  cycles: string;
  hz: number;
};

function App() {
  const [systemState, setSystemState] = useState<"stopped" | "running">(
    "stopped"
  );
  const [rom, setRom] = useState<string | undefined>();
  const [cpuState, setCpuState] = useState<CPUState>({
    A: "-",
    X: "-",
    Y: "-",
    PC: "-",
    cycles: "-",
    hz: 0,
  });

  const loadRom = useCallback((romBuffer: ArrayBuffer) => {
    setRom(ParseRom(romBuffer));
    worker.postMessage({
      cmd: "load",
      romBuffer,
    });
    worker.addEventListener("message", (e) => {
      switch (e.data.cmd) {
        case "update":
          setCpuState(e.data.cpu);
          break;
        case "running":
          setSystemState("running");
          break;
        case "stopped":
          setSystemState("stopped");
          break;
        default:
          console.warn("Command not recognized in app");
      }
    });
  }, []);

  return (
    <Box sx={{ height: "100%" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ p: 1, borderBottom: "5px solid grey" }}>
          <ControlContainer
            loadRom={loadRom}
            reset={() => {
              worker.postMessage({ cmd: "reset" });
            }}
            step={
              systemState === "stopped" && rom
                ? () => {
                    worker.postMessage({ cmd: "step" });
                  }
                : undefined
            }
            play={
              systemState === "stopped" && rom
                ? () => {
                    worker.postMessage({ cmd: "start" });
                  }
                : undefined
            }
            stop={
              systemState === "running"
                ? () => {
                    worker.postMessage({ cmd: "stop" });
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
