/* eslint-disable no-restricted-globals */

import { ROM } from "../lib/ROM";
import { System } from "../lib/System";

let sys: System | undefined;

let timer: number;

self.addEventListener(
  "message",
  function (e) {
    switch (e.data.cmd) {
      case "load":
        sys = new System(
          new ROM(Array.from(new Uint8Array(e.data.romBuffer)), 0x4000)
        );
        sys.observe((newSystem) => {
          self.postMessage({
            cmd: "update",
            cpu: {
              A: newSystem.cpu.A.toString(),
              X: newSystem.cpu.X.toString(),
              Y: newSystem.cpu.Y.toString(),
              PC: newSystem.cpu.PC.toString(16).padStart(4, "0"),
              cycles: newSystem.cpu.cycles + "",
            },
          });
        });
        sys.reset();
        break;
      case "step":
        console.time("Step");
        sys && sys.cpu.step();
        console.timeEnd("Step");
        break;
      case "start":
        self.postMessage({ cmd: "running" });

        timer = this.setInterval(() => {
          sys && sys.cpu.step();
        }, 0);

        break;
      case "stop":
        if (timer) {
          this.clearInterval(timer);
          timer = 0;
        }
        self.postMessage({ cmd: "stopped" });
        break;
      default:
        console.warn("Command not recognized in worker");
    }
  },
  false
);
