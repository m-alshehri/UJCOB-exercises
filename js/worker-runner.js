window.runInWorker = (type, payload, timeout = 20000) =>
  new Promise((resolve, reject) => {
    const worker = new Worker("/workers/" + type + ".js");
    const timer = setTimeout(() => {
      worker.terminate();
      Tamareen.report?.("engine_timeout");
      reject(
        new Error(
          "Execution timed out. Check for an infinite loop or expensive query and try again.",
        ),
      );
    }, timeout);
    function finish() {
      clearTimeout(timer);
      worker.terminate();
    }
    worker.onmessage = (e) => {
      finish();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data);
    };
    worker.onerror = (e) => {
      finish();
      Tamareen.report?.("engine_load");
      reject(new Error(e.message || "The execution engine could not load."));
    };
    worker.postMessage(payload);
  });
