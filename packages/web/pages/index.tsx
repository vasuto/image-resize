import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { Bucket } from "sst/node/bucket";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import * as React from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Dropzone from "react-dropzone";
import { LoadingButton } from "@mui/lab";

const width = 150;
const height = 150;
const prefix = `${width}-${height}`;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getServerSideProps() {
  const key = crypto.randomUUID();
  const putCommand = new PutObjectCommand({
    ACL: "public-read",
    Key: key,
    Bucket: Bucket.public.bucketName,
  });
  const signedPutS3Url = await getSignedUrl(new S3Client({}), putCommand);
  const getCommand = new GetObjectCommand({
    Key: `${prefix}-${key}`,
    Bucket: Bucket.public.bucketName,
  });
  const signedGetS3Url = await getSignedUrl(new S3Client({}), getCommand);

  const outputKey = `${prefix}-${key}`;
  const bucketName = Bucket.public.bucketName;

  return { props: { signedPutS3Url, signedGetS3Url, outputKey, bucketName } };
}

export default function Home({ signedPutS3Url, signedGetS3Url, outputKey, bucketName }: { signedPutS3Url: string, signedGetS3Url: string, outputKey: string, bucketName: string }) {
  const [file, setFile] = React.useState<File | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  return (
    <main>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if(!file) {
            alert("Please choose file first.");
            return;
          }
          setIsLoading(true);

          await fetch(signedPutS3Url, {
            body: file,
            method: "PUT",
            headers: {
              "Content-Type": file.type,
              "Content-Disposition": `attachment; filename="${file.name}"`,
            },
          });
          let retry = 0;
          while(retry < 3) {
            await sleep(2000);
            try {
              const resizedImage = await fetch(signedGetS3Url, {
                method: "GET"
              });
              console.log(resizedImage);
              if (resizedImage.status === 404) {
                retry++;
                continue;
              } else {
                window.location.href = resizedImage.url;
              }
            } catch (err) {
              console.error(err);
            }
            break;
          }
          setIsLoading(false);
        }}
      >
        <Dropzone onDrop={acceptedFiles => setFile(acceptedFiles[0])} accept={{
          'image/png': ['.png'],
          'image/jpeg': ['.jpeg', '.jpg'],
        }}
        maxFiles={1}>
          {({getRootProps, getInputProps}) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
              {file ? (<aside>
                <h4>File</h4>
                <ul><li key={file?.name}>
                  {file?.name} - {file?.size} bytes
                </li></ul>
              </aside>):""
              }
            </section>
          )}
        </Dropzone>

        <LoadingButton
          loading={isLoading}
          loadingPosition="start"
          startIcon={<CloudUploadIcon />}
          variant="contained"
          type="submit"
        >
          Upload
        </LoadingButton>

      </form>
    </main>
  );
}
