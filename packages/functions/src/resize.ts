import { S3Event, S3Handler } from "aws-lambda";
import AWS from "aws-sdk";
import sharp from "sharp";
import stream from "stream";

const S3 = new AWS.S3();
const width = 150;
const height = 150;
const prefix = `${width}-${height}`;

export const main: S3Handler = async (event: S3Event) => {
  if(event.Records.length <= 0) {
    return;
  }
  const s3Record = event.Records[0].s3;

  const Key = s3Record.object.key;
  const Bucket = s3Record.bucket.name;
  console.log("Key", Key);
  console.log("Bucket", Bucket);

  const resizedKey = `${prefix}-${Key}`;
  if (Key.startsWith(prefix)) {
    return;
  }

  const readStream = S3.getObject({ Bucket, Key }).createReadStream();
  const resizeStream = sharp().resize(width, height);
  const writeStream = new stream.PassThrough();

  readStream.pipe(resizeStream).pipe(writeStream);

  try {
    await S3.upload({
      Key: resizedKey,
      Bucket,
      Body: writeStream,
    }).promise();
  } catch (error) {
    console.log(error);
  }

};