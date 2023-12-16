import { StackContext, NextjsSite, Bucket, Api, Function } from "sst/constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export function Default({ stack }: StackContext) {
  const bucket = new Bucket(stack, "public", {
    notifications: {
      resize: {
        function: {
          handler: "packages/functions/src/resize.main",
        },
        events: ["object_created"],
      },
    },
  });

  // Allow the notification functions to access the bucket
  bucket.attachPermissions([bucket]);;
  const api = new Api(stack, "api", {
    routes: {
      "GET /resizedImage/{name}": "packages/functions/src/api.handler",
    },
  })

  const site = new NextjsSite(stack, "site", {
    path: "packages/web",
    bind: [api, bucket],
  });
  new Function(stack, "ResizeFunction", {
    handler: "packages/functions/src/resize.handler",

  });
  stack.addOutputs({
    ApiUrl: api.url,
    SiteUrl: site.url,
    BucketName: bucket.bucketName,
  });
}
