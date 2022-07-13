import { Grid, Typography } from "@mui/material";
import { useMemo } from "react";
import { CPUState } from "../../App";
import { toHex } from "../../helpers/Formatters";
import { colors } from "../../theme/ThemeSetup";

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
          <RegisterValue
            title="A"
            n={cpuState.A}
            byteSize={cpuState.E || cpuState.P?.M}
          />
          <br />
          <RegisterValue
            title="X"
            n={cpuState.X}
            byteSize={cpuState.E || cpuState.P?.I}
          />
          <br />
          <RegisterValue
            title="Y"
            n={cpuState.Y}
            byteSize={cpuState.E || cpuState.P?.I}
          />
          <br />
          NVMXIZCE
          <br />
          {!cpuState.P
            ? "--------"
            : [
                cpuState.P.N,
                cpuState.P.V,
                cpuState.P.M,
                cpuState.P.X,
                cpuState.P.I,
                cpuState.P.Z,
                cpuState.P.C,
                cpuState.E,
              ].map((s) => (s ? "1" : "0"))}
          <br />
          <br />
          <RegisterValue title="PC" n={cpuState.PC} hideDecimal />
        </Grid>
        <Grid item xs={6}>
          Clock: {hz}
          <br />
          Cycles: {cpuState.cycles}
        </Grid>
      </Grid>
    </>
  );
};

const RegisterValue: React.FC<{
  n: number | null;
  byteSize?: boolean;
  hideDecimal?: boolean;
  title: string;
}> = ({ n, title, byteSize = false, hideDecimal = false }) => {
  return (
    <>
      {title}:{" "}
      <span style={{ color: colors.blue }}>{toHex(n, byteSize ? 2 : 4)}</span>
      {!hideDecimal && (
        <span style={{ color: colors.lowlight }}>
          {"  "}
          {n}
        </span>
      )}
    </>
  );
};
