import { ApiHandler } from "sst/node/api";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { Bucket } from "sst/node/bucket";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = ApiHandler(async (event) => {
  const name = event.pathParameters.name;
  /*const command = new PutObjectCommand({
    ACL: "public-read",
    Key: crypto.randomUUID(),
    Bucket: Bucket.public.bucketName,
  });
  const url = await getSignedUrl(new S3Client({}), command)*/
  console.log(name);
  return {
    statusCode: 200,
    body: name,
  };
});