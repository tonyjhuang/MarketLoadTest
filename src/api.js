import AWS from "aws-sdk";
import * as fs from "fs";

const BUCKET = "project-storage-bfec9e64185420-staging";

export async function initApi() {
  AWS.config.update({ region: "us-east-1" });
  return new AWS.S3();
}

export async function uploadFile(api, fileName, fileNameOnDisk) {
  const fileStream = fs.createReadStream(fileNameOnDisk);
  const res = await api
    .upload({
      Bucket: BUCKET,
      Key: fileName,
      Body: fileStream,
    })
    .promise();
  //   console.log(`uploaded ${fileName}`);
  return res;
}

export async function downloadFile(api, fileName) {
  const res = await api.getObject({ Bucket: BUCKET, Key: fileName }).promise();
  //   console.log(`downloaded ${fileName}`);
  return res;
}
