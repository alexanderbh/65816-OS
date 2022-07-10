import { Grid, Typography } from "@mui/material";
import { CPUState } from "../../App";

type CPUContainerProps = {
  cpuState: CPUState;
};
export const CPUContainer: React.FC<CPUContainerProps> = ({ cpuState }) => {
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
        <Grid item xs={4}>
          Cycles: {cpuState.cycles}
        </Grid>
      </Grid>
    </>
  );
};
