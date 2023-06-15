import * as util from "util";
import { performance, PerformanceObserver } from "perf_hooks";
import { exec } from "child_process";
import { initApi, uploadFile, downloadFile } from "./api";
import * as fs from "fs/promises";

const p_exec = util.promisify(exec);

const BYTES_IN_KB = 1024;
const KB_IN_MB = 1024;

async function createFile(size) {
  const outputFile = `/tmp/${size}_file`;
  await p_exec(`head -c ${size} </dev/urandom >${outputFile}`);
  return outputFile;
}

async function readFile(fileName) {
  const file = fs.readFile(fileName);
  return new Uint8Array(file).buffer;
}

function getAvg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * @param {string} measureName name of the test being run, e.g. file-upload
 * @param {(string) => Promise} func async function of the test, accepts the run index
 * @param {num} numRuns number of times to run the measure
 */
async function runAsyncWithMeasure(measureName, func, numRuns) {
  console.log(`\nrunning load test "${measureName}" ${numRuns} times`);

  return new Promise(async (resolve) => {
    let durations = [];
    // Setup performance watcher.
    const perfObserver = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        durations.push(entry.duration);
        if (durations.length === numRuns) {
          resolve(getAvg(durations));
        }
      });
    });
    perfObserver.observe({ entryTypes: ["measure"], buffer: true });

    // Run tests.
    for (let i = 0; i < numRuns; i++) {
      const start = `${measureName}_run${i}_start`;
      const stop = `${measureName}_run${i}_end`;
      performance.mark(start);
      await func(i);
      performance.mark(stop);
      performance.measure(measureName, start, stop);
    }
  });
}

async function runLoadTestWithParams(testId, api, fileSizeInBytes, numRuns) {
  console.log(
    "\n=====================\n" +
      `running upload and download load tests for file size: ${fileSizeInBytes}`
  );
  console.log(`creating file ${fileSizeInBytes}`);
  const fileName = await createFile(fileSizeInBytes);
  const file = await readFile(fileName);
  console.log(`${file}`);

  // Run upload tests.
  const avgUploadTime = await runAsyncWithMeasure(
    `${testId}-upload-${fileSizeInBytes}-test`,
    (runIndex) => uploadFile(api, `${testId}-${runIndex}`, file),
    numRuns
  );
  console.log(`average upload latency: ${avgUploadTime.toFixed(4)}ms`);

  // Run download tests.
  const avgDownloadTime = await runAsyncWithMeasure(
    `${testId}-download-${fileSizeInBytes}-test`,
    (runIndex) => downloadFile(api, `${testId}-${runIndex}`),
    numRuns
  );
  console.log(`average download latency: ${avgDownloadTime.toFixed(4)}ms`);

  console.log("cleaning up\n=====================");

  await p_exec(`rm ${file}`);
}

async function runLoadTest() {
  console.log("\n\nrunning...");
  const api = await initApi();
  const testId = Date.now();
  await runLoadTestWithParams(testId, api, BYTES_IN_KB * KB_IN_MB, 1); // 1MB

  await runLoadTestWithParams(testId, api, BYTES_IN_KB * KB_IN_MB * 50, 1); // 50MB

  console.log("\nall done.\n");
}

runLoadTest();
