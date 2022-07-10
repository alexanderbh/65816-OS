import { Button, Divider, Grid, IconButton, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { useRef } from "react";

type ControlContainerProps = {
  setRom: (rom: string) => void;
};
export const ControlContainer: React.FC<ControlContainerProps> = ({
  setRom,
}) => {
  const fileUploadRef = useRef(null);
  let fileReader: FileReader;

  const handleFileRead = (e: ProgressEvent<FileReader>) => {
    const content = fileReader.result;
    console.log("file", content);
    if (content) {
      setRom(content?.toString());
    }
  };

  const handleFileChosen = (file: FileList | null) => {
    fileReader = new FileReader();

    fileReader.onloadend = handleFileRead;
    fileReader.readAsText(file!.item(0)!);
  };
  return (
    <>
      <Typography variant="caption">CONTROL</Typography>
      <Grid container spacing={2}>
        <Grid item>
          <Button
            size="small"
            onClick={() => {
              if (fileUploadRef?.current) {
                (fileUploadRef.current as any).click();
              }
            }}
            variant="contained"
          >
            LOAD ROM
          </Button>
          <input
            ref={fileUploadRef}
            type="file"
            id="file"
            style={{ display: "none" }}
            className="input-file"
            onChange={(e) => handleFileChosen(e.target.files)}
          />
        </Grid>
        <Grid item>
          <Divider orientation="vertical" />
        </Grid>
        <Grid item>
          <Button size="small" onClick={() => {}} variant="contained">
            RESET
          </Button>
        </Grid>
        <Grid item>
          <Divider orientation="vertical" />
        </Grid>
        <Grid item>
          <IconButton size="small" color="primary" onClick={() => {}}>
            <PlayArrowIcon />
          </IconButton>
          <IconButton size="small" color="primary" onClick={() => {}}>
            <PauseIcon />
          </IconButton>
          <IconButton size="small" color="primary" onClick={() => {}}>
            <SkipNextIcon />
          </IconButton>
        </Grid>
      </Grid>
    </>
  );
};
