'use strict';

var crypto = require('crypto');

var _ = require('lodash');
var assert = require('chai').assert;
var AWS = require('aws-sdk');

var Uploader = require('..');

describe('S3 Uploader stream test', function() {
  var payload;

  before(function(done) {
    crypto.randomBytes(32, function(err, bytes) {
      payload = bytes.toString('hex');
      done();
    });
  });

  describe('upload stream', function() {
    it('is expected to upload a file as stream', function(done) {
      var s3 = new AWS.S3();

      var params = {
        Bucket: process.env.STREAM_UPLOADER_BUCKET,
        Key: 'stream-upload-test.txt'
      };

      var up = new Uploader(s3, _.clone(params));

      up.on('close', function() {
        s3.getObject(_.clone(params), function(err, res) {
          assert.ifError(err, 'getObject completion callback error');

          assert.strictEqual(res.Body.toString(), payload, 'payload matches');

          done();
        });
      });

      up.on('error', function(err) {
        assert.ifError(err, 'Uploader error event');
      });

      up.end(payload);
    });
  });
});
