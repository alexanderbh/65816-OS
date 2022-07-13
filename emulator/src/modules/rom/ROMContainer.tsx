import { Grid, Typography } from "@mui/material";
import { useMemo } from "react";
import { ROM_OFFSET } from "../../App";
import { ParseMemory } from "../../helpers/ROMParser";
import { ROM_START } from "../../lib/System";

type ROMContainerProps = {
  romBuffer: ArrayBuffer | undefined;
  PC: number | null;
};
export const ROMContainer: React.FC<ROMContainerProps> = ({
  romBuffer,
  PC,
}) => {
  const rom = useMemo(() => {
    if (romBuffer) {
      return ParseMemory(
        new Uint8Array(romBuffer),
        { addr: PC, size: 2 },
        ROM_START,
        ROM_OFFSET
      );
    }
    return "";
  }, [romBuffer, PC]);

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="body1" gutterBottom>
          ROM
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography
          variant="body1"
          sx={{ fontSize: "12px", whiteSpace: "pre-line" }}
          dangerouslySetInnerHTML={{ __html: rom }}
        ></Typography>
      </Grid>
    </Grid>
  );
};
