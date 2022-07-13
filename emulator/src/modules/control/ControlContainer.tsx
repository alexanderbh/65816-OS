import {
  Button,
  Divider,
  Grid,
  IconButton,
  Slider,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { ROMLoader } from "./components/ROMLoader";
import { useState } from "react";

type ControlContainerProps = {
  loadRom: (rom: ArrayBuffer) => void;
  step: undefined | (() => void);
  play: undefined | (() => void);
  stop: undefined | (() => void);
  reset: undefined | (() => void);
  onSpeedChanged: (speed: number) => void;
};
export const ControlContainer: React.FC<ControlContainerProps> = ({
  loadRom,
  step,
  play,
  stop,
  reset,
  onSpeedChanged,
}) => {
  const [speed, setSpeed] = useState(100);
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
        <Grid item>
          <Divider orientation="vertical" />
        </Grid>
        <Grid item>
          <Grid container alignItems="center" columnSpacing={2}>
            <Grid item>
              <Typography variant="caption">Slow:</Typography>
            </Grid>
            <Grid item>
              <Slider
                max={100}
                min={0}
                sx={{ width: "75px" }}
                value={speed}
                onChange={(_, value) => setSpeed(value as number)}
                onChangeCommitted={(_, value) =>
                  onSpeedChanged(value as number)
                }
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Divider orientation="vertical" />
        </Grid>
      </Grid>
    </>
  );
};
