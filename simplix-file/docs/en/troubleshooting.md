# Troubleshooting simplix-file

Symptoms an application meets when it stores and serves files, the cause of each and what to change.

| Symptom | Cause | What to do |
|---|---|---|
| A refused upload is answered with status 500 and `GEN_INTERNAL_SERVER_ERROR` | the exception handler of the starter does not know `FileUploadException` | add the advice of [Getting started](./getting-started.md) |
| An upload over a few megabytes is answered with status 500 before the controller runs | Spring's multipart limit refused it | raise `spring.servlet.multipart.max-file-size` and `max-request-size`, and handle `MaxUploadSizeExceededException` in the advice |
| A download returns JSON instead of the file | the response has no content type, so the JSON converter wrote the `Resource` | set the content type from `describe` or from your record |
| The URL of a file answers 404, or redirects to the login page | the module builds URLs and serves nothing; a path outside `/api` goes to the form login | write the download endpoint, and choose `public-url-prefix` to match it |
| An image is stored under `images` although the request names another directory | processed images always go to `images` | read the path from the result; do not build it from the directory |
| A PNG comes back as WebP or JPEG | an image over the size limit is resized, and a large enough one is converted | store the type of the result; set `enableWebpOptimization(false)` or raise the limits to keep the original |
| An empty file was stored | `processAndStoreGenericFile` and `processAndStoreImage` skip the checks | use `processAndStore` for files users send |
| A file with a wrong extension was accepted | a mismatch between the extension and the content type is only logged | check the extension in your own code when it matters |
| `No image reader found for the input` | the content is not an image, or its format has no reader, such as HEIC | accept JPEG, PNG, GIF or WebP, and answer the exception with status 400 |
| Every S3 call throws `NOT_CONFIGURED` | the bucket, the access key or the secret key is missing; the message names which | set the missing property, or supply it through your `StorageConfigurationSource` |
| Links to S3 files stop working after an hour | without `s3.public-url-prefix`, `getPublicUrl` returns a signed link that expires | create the link when it is needed and do not store it; keep the stored path |
| Memory runs out while large S3 files are served | `retrieve` loads the whole object | hand out `getDownloadUrl` and let the browser read from the bucket |

## Related documents

- [How simplix-file works](./how-it-works.md)
- [Configuration reference](./configuration-reference.md)
