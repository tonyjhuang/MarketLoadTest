import { Amplify, Storage } from "aws-amplify";
import awsconfig from "./aws-exports";

export async function initApi() {
  Amplify.configure(awsconfig);
  Storage.configure(awsconfig);
  return Storage;
}

export async function uploadFile(api, fileName, file) {
  await api.put(fileName, "test");
}

export async function downloadFile(api, fileName) {
  await file.get(fileName, { download: true });
}
