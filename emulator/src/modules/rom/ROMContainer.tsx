import { Grid, Typography } from "@mui/material";

type ROMContainerProps = {
  rom: string | undefined;
};
export const ROMContainer: React.FC<ROMContainerProps> = ({ rom }) => {
  return (
    <Grid container>
      <Grid item>
        <Typography variant="body1" gutterBottom>
          ROM
        </Typography>
      </Grid>
      <Grid item sx={{ overflowWrap: "anywhere" }}>
        <Typography variant="caption" sx={{ fontSize: "9px" }}>
          {rom}
        </Typography>
      </Grid>
    </Grid>
  );
};
