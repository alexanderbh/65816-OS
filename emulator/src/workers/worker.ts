/* eslint-disable no-restricted-globals */

import { ROM } from "../lib/ROM";
import { System } from "../lib/System";

let sys: System | undefined;

let lastUpdate = 0;

let slowDownFactor = 0;

let breaker = false;

let hz = 0;

async function run() {
  let cyclesLastCount = sys?.cpu.cycles || 0;
  let cyclesLastMeasure = Date.now();
  let counter = 0;
  while (breaker !== true) {
    sys && sys.cpu.step();
    const delta = Date.now() - cyclesLastMeasure;
    if (delta >= 250) {
      const newCycles = (sys?.cpu.cycles || 0) - cyclesLastCount;
      hz = (newCycles / (delta / 250)) * 4;
      cyclesLastCount = sys?.cpu.cycles || 0;
      cyclesLastMeasure = Date.now();
    }
    counter++;
    if (
      slowDownFactor > 0 &&
      counter % Math.max(1, 1001 - slowDownFactor) === 0
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, slowDownFactor - 1000))
      );
    }
    if (counter % 1000000 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  breaker = false;
}

function updateState() {
  if (sys) {
    self.postMessage({
      cmd: "update",
      cpu: {
        A: sys.cpu.A.toString(),
        X: sys.cpu.X.toString(),
        Y: sys.cpu.Y.toString(),
        PC: sys.cpu.PC.toString(16).padStart(4, "0"),
        cycles: sys.cpu.cycles + "",
        hz: hz,
        // NVMXDIZC
        P: [
          sys.cpu.P.N,
          sys.cpu.P.V,
          sys.cpu.P.M,
          sys.cpu.P.X,
          sys.cpu.P.I,
          sys.cpu.P.Z,
          sys.cpu.P.C,
        ].map((s) => (s ? "1" : "0")),
      },
    });
  }
}

self.addEventListener(
  "message",
  function (e) {
    switch (e.data.cmd) {
      case "load":
        sys = new System(
          new ROM(Array.from(new Uint8Array(e.data.romBuffer)), 0x4000)
        );
        sys.observe((newSystem) => {
          if (lastUpdate < Date.now() - 20) {
            lastUpdate = Date.now();
            updateState();
          }
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
        console.log("STARTT");
        run();
        break;
      case "stop":
        console.log("stoppp");
        breaker = true;
        updateState();
        self.postMessage({ cmd: "stopped" });
        break;
      default:
        console.warn("Command not recognized in worker");
    }
  },
  false
);
