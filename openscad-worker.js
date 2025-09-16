// Web Worker that runs OpenSCAD WASM rendering off the main thread with Manifold backend and multi-threading
import OpenSCAD from "./openscad.js";

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
      // Enable multi-threading support
      pthread: true,
      // Configure for better performance with Manifold backend
      memoryInitializerPrefixURL: new URL(".", import.meta.url).href,
      // Additional Manifold backend optimizations
      wasmMemory: {
        initial: 256,
        maximum: 2048
      },
      // Enable shared memory for multi-threading
      sharedMemory: true,
      // Optimize for Manifold backend
      optimizeForSize: false,
      // Enable SIMD for better performance
      simd: true
    });

    mod.FS.writeFile("/__model.scad", `$fn=${fnValue};\n${sourceText}`);
    
    // Build command arguments for Manifold backend
    const args = ["/__model.scad", "--backend=manifold", "-o", outPath];
    
    // Log the command being executed for debugging
    self.postMessage({type: "log", text: `Executing OpenSCAD with: ${args.join(' ')}`});
    
    // Execute OpenSCAD with configured backend and multi-threading
    mod.callMain(args);
    
    const bytes = mod.FS.readFile(outPath);
    const buffer = bytes.buffer;
    self.postMessage({type: "result", id, buffer}, [buffer]);
  } catch (err) {
    const message = err && (err.message || String(err));
    self.postMessage({type: "error", id, message});
  }
};


