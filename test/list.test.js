'use strict';

var assert = require('chai').assert;
var AWS = require('aws-sdk');

var List = require('..').List;

describe('S3 List stream test', function() {
  describe('list stream', function() {
    it('is expected to list objects as stream', function(done) {
      var s3 = new AWS.S3();

      var params = {
        Bucket: process.env.STREAM_UPLOADER_BUCKET,
        Prefix: 'stream-upload-test.txt'
      };

      var options = {
        retries: 1
      };

      var list = new List(s3, params, options);

      list.on('error', function(err) {
        assert.ifError(err, 'List error event');
      });

      list.on('data', function(chunk) {
        var object = JSON.parse(chunk);

        assert.strictEqual(object.Key, 'stream-upload-test.txt', 'object key matches');
        assert.strictEqual(object.Size, 64, 'object size matches');
        assert.strictEqual(object.StorageClass, 'STANDARD', 'storage class matches');
      });

      list.on('close', function() {
        done();
      });
    });
  });
});
