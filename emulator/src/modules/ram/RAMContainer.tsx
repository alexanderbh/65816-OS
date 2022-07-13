import { Box, Grid, Typography } from "@mui/material";
import { useMemo } from "react";
import { CPUState } from "../../App";
import { ParseMemory } from "../../helpers/ROMParser";
import { colors } from "../../theme/ThemeSetup";

type RAMContainerProps = {
  mem: CPUState["RAM"] | null;
};

export const RAMContainer: React.FC<RAMContainerProps> = ({ mem }) => {
  const ram = useMemo(() => {
    if (mem) {
      console.log(mem);
      return ParseMemory(
        mem.mem,
        {
          addr: mem.lastAccess as number,
          size: mem.lastAccessSize,
          color: mem.lastAccessType === "read" ? colors.blue : colors.pink,
        },
        0,
        0,
        true
      );
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
