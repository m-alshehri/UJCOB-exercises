const activeWorkers = {};
function getWorker(type) {
  if (!activeWorkers[type]) {
    activeWorkers[type] = new Worker("/workers/" + type + ".js");
  }
  return activeWorkers[type];
}
function killWorker(type) {
  if (activeWorkers[type]) {
    activeWorkers[type].terminate();
    delete activeWorkers[type];
  }
}
window.runInWorker = (type, payload, timeout = 20000) =>
  new Promise((resolve, reject) => {
    let worker;
    try {
      worker = getWorker(type);
    } catch {
      Tamareen.report?.("engine_load");
      return reject(new Error("The execution engine could not load."));
    }
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      killWorker(type);
      Tamareen.report?.("engine_timeout");
      reject(
        new Error(
          "Execution timed out. Check for an infinite loop or expensive query and try again.",
        ),
      );
    }, timeout);
    worker.onmessage = (e) => {
      if (settled) return;
      clearTimeout(timer);
      if (e.data?.error) reject(new Error(e.data.error));
      else resolve(e.data);
    };
    worker.onerror = (e) => {
      if (settled) return;
      clearTimeout(timer);
      killWorker(type);
      Tamareen.report?.("engine_load");
      reject(new Error(e.message || "The execution engine could not load."));
    };
    worker.postMessage(payload);
  });
