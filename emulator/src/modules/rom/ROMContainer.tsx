import { Grid, Typography } from "@mui/material";

type ROMContainerProps = {
  rom: string | undefined;
};
export const ROMContainer: React.FC<ROMContainerProps> = ({ rom }) => {
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
        >
          {rom}
        </Typography>
      </Grid>
    </Grid>
  );
};
