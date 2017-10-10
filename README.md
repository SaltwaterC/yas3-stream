## About [![build status](https://secure.travis-ci.org/SaltwaterC/yas3-stream.png?branch=master)](https://travis-ci.org/SaltwaterC/yas3-stream)

Yet Another S3 streaming solution built on top of the `aws-sdk` library. The number of available solutions for this problem is shockingly high. Also, the number of solutions which properly provide a streaming solution (for uploads) is shockingly low.

## System requirements

 * node.js 6+

`aws-sdk` must be installed before using this library. An S3 client instance must be passed to the Uploader constructor.

## Uploader

By properly, I mean:

 * uses the [upload](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property) method of the S3 object part of `aws-sdk` rather than the MultiPart API directly which means the object size doesn't have to be bigger than 5MB
 * no extra fluff - it behaves like an actual `Writable` stream rather than making assumptions about the use case
 * doesn't buffer more data than necessary which is up to the size of a MultiPart chunk multiplied by the number of workers i.e `partSize` * `queueSize` of `S3.ManagedUpload`

This is implemented as a very thin wrapper over `S3.upload` as `PassThrough` stream. The output of the stream is passed as the Body param of the `S3.upload` method. For all intents and purposes it should be used as a `Writable` stream. This module does not provide a `Readable` stream as `aws-sdk` already implements one via `S3.getObject.createReadStream`.

Before you even think about playing the NIH card, think about that fact that I've read the source code of about a dozen libraries solving this problem. Out of those I got my hands on, only one uses `S3.upload`. Its input is a file path rather than being an actual `Writable` stream.

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
 * `params` 1st argument of `S3.upload` - params object of which the Body key is always set as the output of the `Uploader` stream
 * `options` 2nd argument of `S3.upload` - defaults to `{}` and it is actually the options argument of `S3.ManagedUpload`

Events:

 * `error` - emitted when `S3.upload` is passing an error argument to the completion callback
 * `progress` - emitted when the underlying `S3.ManagedUpload` emits the `httpUploadProgress` event
 * `close` - emitted when the completion callback of `S3.upload` is called and no error is being passed to this callback

## List

The `List` stream is a convenient way for getting the object list and their sizes. Implemented as `Readable` stream. Supports pausing. Implemented on top of `S3.listObjectsV2`.

```javascript
var list = new List(new AWS.S3(), {
  Bucket: 'bucket_name'
});

list.on('data', function(object) {
  console.log(JSON.parse(object));
  /*
  { Key: 'file_name',
  LastModified: 2017-09-25T13:17:37.000Z,
  ETag: '"5279a0b29abe3c5c773882c48eacab79"',
  Size: 32,
  StorageClass: 'STANDARD' }
  */
});
```

The `List` constructor accepts two arguments:

 * `AWS.S3` instance
 * `params` 1st argument of `S3.listObjectsV2` - params object which requires at least the `Bucket` key
 * `options` - options list which affects the behaviour of `List`:
  * `retries` - the maximum number of retries for `S3.listObjectsV2` before bailing out; Default: 10

Events:

 * `error` - emitted when `S3.listObjectsV2` encounters too many retries; the completion callback error argument is passed to the error event
 * `data` - emitted for every S3 object found in the bucket; basically it is an element of the `data.Contents` array passed to the completion callback of `S3.listObjectsV2`; it is encoded as JSON string which is passed as `Buffer` to the callback executed by the `data` event

The List stream supports pausing. If the stream is paused, then no new `S3.listObjectsV2` requests are being sent, however, an in flight request may still be processing. While no new data events are being emitted while the stream is paused, the object list from the in flight request is going to be buffered by the stream.
