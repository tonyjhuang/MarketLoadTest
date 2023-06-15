import { Amplify, Storage } from "aws-amplify";
import awsconfig from "./aws-exports";

export async function initApi() {
  Amplify.configure(awsconfig);
  return Storage;
}

export async function uploadFile(api, file, fileName) {
  // TODO
}

export async function downloadFile(api, fileName) {
  // TODO
}
