import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { Bucket } from "sst/node/bucket";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({});

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
  return (
    <main>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const file = (e.target as HTMLFormElement).file.files?.[0]!;

          await fetch(signedPutS3Url, {
            body: file,
            method: "PUT",
            headers: {
              "Content-Type": file.type,
              "Content-Disposition": `attachment; filename="${file.name}"`,
            },
          });

          /*const getCommand = new GetObjectCommand({
            Key: outputKey,
            Bucket: bucketName,
          });*/

          await sleep(2000);

          try {
            //const signedGetS3Url = await getSignedUrl(new S3Client({}), getCommand);
            const resizedImage = await fetch(signedGetS3Url, {
              method: "GET"
            });
            console.log(resizedImage);
            //window.location.href = image.url.split("?")[0];
            window.location.href = resizedImage.url.split("?")[0];
          } catch (err) {
            console.error(err);
          }
        }}
      >
        <input name="file" type="file" accept="image/png, image/jpeg" />
        <button type="submit">Upload</button>
      </form>
    </main>
  );
}
