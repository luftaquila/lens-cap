// Web Worker that runs OpenSCAD WASM rendering off the main thread
import OpenSCAD from "./openscad.wasm.js";

self.onmessage = async (event) => {
  const msg = event.data || {};
  const {id, action} = msg;
  if (action !== "render") return;

  try {
    const {sourceText, fnValue, outPath} = msg;
    // Create a fresh module instance for each render to avoid "program has already aborted" issues
    const mod = await OpenSCAD({
      noInitialRun: true,
      locateFile: (path) => new URL(path, import.meta.url).href,
      print: (txt) => self.postMessage({type: "log", text: String(txt)}),
      printErr: (txt) => self.postMessage({type: "log", text: String(txt)}),
    });

    mod.FS.writeFile("/__model.scad", `$fn=${fnValue};\n${sourceText}`);
    mod.callMain(["/__model.scad", "-o", outPath]);
    const bytes = mod.FS.readFile(outPath);
    const buffer = bytes.buffer;
    self.postMessage({type: "result", id, buffer}, [buffer]);
  } catch (err) {
    const message = err && (err.message || String(err));
    self.postMessage({type: "error", id, message});
  }
};


