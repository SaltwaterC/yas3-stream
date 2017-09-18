## About

Yet Another S3 streaming uploader built on top of the `aws-sdk` library. The number of available solutions for this problem is shockingly high. Also, the number of solutions which properly provide a streaming solution is shockingly low.

By properly, I mean:

 * uses the [upload](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property) method of the S3 object part of `aws-sdk` rather than the MultiPart API directly which means the object size doesn't have to be bigger than 5MB
 * no extra fluff - it behaves like an actual `Writable` stream rather than making assumptions about the use case
 * doesn't buffer more data than necessary which is up to the size of a MultiPart chunk

This is implemented as a very thin wrapper over `S3.upload` as `PassThrough` stream. The output of the stream is passed as the Body param of the `S3.upload` method. For all intents and purposes it should be used as a `Writable` stream. This module does not provide a `Readable` stream as `aws-sdk` already implements one via `S3.getObject.createReadStream`.

Before you even think about playing the NIH card, think about that fact that I've read the source code of about a dozen libraries solving this problem. Out of those I got my hands on, only one uses `S3.upload`. Its input is a file path rather than being an actual `Writable` stream.

## System requirements

 * node.js 6+

`aws-sdk` must be installed before using this library. An S3 client instance must be passed to the Uploader constructor.

## Uploader

```javascript
var fs = require('fs');
var Uploader = require('yas3-stream');
var AWS = require('aws-sdk');

var rs = fs.createReadStream('path/to/file.txt');
var up = new Uploader(new AWS.S3(), {
  Bucket: 'bucket_name',
  Key: 'path/to/file.txt'
});

rs.pipe(up);
```

The `Uploader` constructor accepts three arguments:

 * `AWS.S3` instance
 * `params` 1st argument of `S3.upload` - object of which the Body key is always set as the output of `Uploader`
 * `options` 2nd argument of `S3.upload` - defaults to `{}` and it is actually the options argument of `S3.ManagedUpload`

Events:

 * `error` - emitted when `S3.upload` emits the error event
 * `progress` - emitted when the underlying `S3.ManagedUpload` emits the `httpUploadProgress` event
 * `close` - emitted when the completion callback of `S3.upload` is called and no error is being passed to this callback
