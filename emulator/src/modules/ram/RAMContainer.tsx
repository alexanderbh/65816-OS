import { Box, Grid, Typography } from "@mui/material";
import { useMemo } from "react";
import { ParseMemory } from "../../helpers/ROMParser";

type RAMContainerProps = {
  mem: Uint8Array | null;
};

export const RAMContainer: React.FC<RAMContainerProps> = ({ mem }) => {
  const ram = useMemo(() => {
    if (mem) {
      return ParseMemory(mem, null, 0, 0, true);
    }
    return "";
  }, [mem]);
  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="body1" gutterBottom>
          RAM
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ overflowX: "hidden", height: "300px" }}>
          <Typography
            variant="body1"
            sx={{ fontSize: "12px", whiteSpace: "pre-line" }}
            dangerouslySetInnerHTML={{ __html: ram }}
          ></Typography>
        </Box>
      </Grid>
    </Grid>
  );
};
