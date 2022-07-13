/* eslint-disable no-restricted-globals */

import { CPUState } from "../App";
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
    if (delta >= 1000) {
      const newCycles = (sys?.cpu.cycles || 0) - cyclesLastCount;
      hz = newCycles / (delta / 1000);
      cyclesLastCount = sys?.cpu.cycles || 0;
      cyclesLastMeasure = Date.now();
    }
    counter++;
    if (
      slowDownFactor > 0 &&
      counter % Math.max(1, 100 - slowDownFactor) === 0
    ) {
      const newLocal = slowDownFactor * 10;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, newLocal))
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
    const cpuState: CPUState = {
      A: sys.cpu.A.word,
      X: sys.cpu.X.word,
      Y: sys.cpu.Y.word,
      PC: sys.cpu.PC,
      cycles: sys.cpu.cycles,
      hz: hz,
      // NVMXDIZC
      P: sys.cpu.P,
      E: sys.cpu.E,
      RAM: {
        mem: sys.ram.mem,
        lastAccess: sys.ram.lastAccess as number,
        lastAccessSize: sys.ram.lastAccessSize,
        lastAccessType: sys.ram.lastAccessType,
      },
    };
    self.postMessage({
      cmd: "update",
      cpu: cpuState,
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
        sys.observe(() => {
          if (lastUpdate < Date.now() - 50) {
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
        run();
        break;
      case "stop":
        breaker = true;
        updateState();
        self.postMessage({ cmd: "stopped" });
        break;
      case "speed":
        slowDownFactor = 100 - e.data.value;
        console.log("SlowDown", slowDownFactor);
        break;
      case "reset":
        sys && sys?.reset();
        break;
      default:
        console.warn("Command not recognized in worker");
    }
  },
  false
);
