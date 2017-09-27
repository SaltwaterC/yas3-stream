'use strict';

var util = require('util');
var PassThrough = require('stream').PassThrough;

function Uploader(s3, options, params) {
  PassThrough.call(this, options);

  var self = this;
  params = params || {};
  options.Body = this;

  this.upload = s3.upload(options, params, function(err) {
    if (err) {
      self.emit('error', err);
    }
    self.emit('close');
  });

  this.upload.on('httpUploadProgress', function(progress) {
    self.emit('progress', progress);
  });
}
util.inherits(Uploader, PassThrough);
module.exports = Uploader;
