import { Grid, Typography } from "@mui/material";
import { useMemo } from "react";
import { CPUState } from "../../App";

type CPUContainerProps = {
  cpuState: CPUState;
};
export const CPUContainer: React.FC<CPUContainerProps> = ({ cpuState }) => {
  const hz = useMemo(() => {
    if (cpuState.hz === 0) {
      return "-";
    }
    if (cpuState.hz > 500000) {
      return (cpuState.hz / 1000000).toFixed(2) + " MHz";
    }
    if (cpuState.hz > 50000) {
      return (cpuState.hz / 100000).toFixed(2) + " kHz";
    }
    return cpuState.hz.toFixed(2) + " Hz";
  }, [cpuState.hz]);

  return (
    <>
      <Typography variant="body1" gutterBottom>
        CPU
      </Typography>
      <Grid container columnSpacing={2}>
        <Grid item xs={6}>
          A: {cpuState.A}
          <br />
          X: {cpuState.X}
          <br />
          Y: {cpuState.Y}
          <br />
          NVMXIZC
          <br />
          {cpuState.P}
          <br />
          <br />
          PC: {cpuState.PC}
        </Grid>
        <Grid item xs={6}>
          HZ:{hz}
          <br />
          Cycles: {cpuState.cycles}
        </Grid>
      </Grid>
    </>
  );
};
