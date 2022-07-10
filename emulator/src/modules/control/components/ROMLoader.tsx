import { Button } from "@mui/material";
import { useRef } from "react";

type ROMLoaderProps = {
  loadRom: (rom: ArrayBuffer) => void;
};
export const ROMLoader: React.FC<ROMLoaderProps> = ({ loadRom }) => {
  const fileUploadRef = useRef(null);
  let fileReader: FileReader;

  const handleFileRead = (e: ProgressEvent<FileReader>) => {
    const content = fileReader.result as ArrayBuffer;
    if (content) {
      loadRom(content);
    }
  };

  const handleFileChosen = (file: FileList | null) => {
    fileReader = new FileReader();

    fileReader.onloadend = handleFileRead;
    fileReader.readAsArrayBuffer(file!.item(0)!);
  };
  return (
    <>
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
    </>
  );
};
