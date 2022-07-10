import { Button, Divider, Grid, IconButton, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { ROMLoader } from "./components/ROMLoader";

type ControlContainerProps = {
  loadRom: (rom: ArrayBuffer) => void;
  step: undefined | (() => void);
  play: undefined | (() => void);
  stop: undefined | (() => void);
  reset: undefined | (() => void);
};
export const ControlContainer: React.FC<ControlContainerProps> = ({
  loadRom,
  step,
  play,
  stop,
  reset,
}) => {
  return (
    <>
      <Typography variant="caption">CONTROL</Typography>
      <Grid container spacing={2}>
        <Grid item>
          <ROMLoader loadRom={loadRom} />
        </Grid>
        <Grid item>
          <Divider orientation="vertical" />
        </Grid>
        <Grid item>
          <Button
            size="small"
            onClick={() => {
              reset && reset();
            }}
            variant="contained"
          >
            RESET
          </Button>
        </Grid>
        <Grid item>
          <Divider orientation="vertical" />
        </Grid>
        <Grid item>
          <IconButton
            size="small"
            color="primary"
            disabled={play === undefined}
            onClick={() => {
              play && play();
            }}
          >
            <PlayArrowIcon />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            disabled={stop === undefined}
            onClick={() => {
              stop && stop();
            }}
          >
            <PauseIcon />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            disabled={step === undefined}
            onClick={() => {
              step && step();
            }}
          >
            <SkipNextIcon />
          </IconButton>
        </Grid>
      </Grid>
    </>
  );
};
