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
      <Grid container spacing={4}>
        <Grid item xs={4}>
          A: {cpuState.A}
        </Grid>
        <Grid item xs={4}>
          X: {cpuState.X}
        </Grid>
        <Grid item xs={4}>
          Y: {cpuState.Y}
        </Grid>
      </Grid>
      <Grid container spacing={4}>
        <Grid item xs={4}>
          PC: {cpuState.PC}
        </Grid>
        <Grid item xs={8}>
          Cycles: {cpuState.cycles}
        </Grid>
      </Grid>
      <Grid container spacing={4}>
        <Grid item xs={8}>
          HZ: {hz}
        </Grid>
      </Grid>
    </>
  );
};
