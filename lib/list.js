'use strict';

var util = require('util');

var Readable = require('stream').Readable;

function List(s3, params, options) {
  Readable.call(this, options);
  this.s3 = s3;
  this.params = params;

  options = options || {};
  this.retries = options.retries || 10;
  this.reqCount = 0;

  this._streamList();
}
util.inherits(List, Readable);
module.exports = List;

List.prototype._read = function() {
  return 0;
};

List.prototype._streamList = function(token) {
  var self = this;

  // don't buffer data in the stream if the stream is paused
  if (this.isPaused()) {
    return setTimeout(function() {
      self._streamList(token);
    }, 250);
  }

  if(token) {
    this.params.ContinuationToken = token;
  }

  this.s3.listObjectsV2(this.params, function(err, res) {
    if (err) {
      self.reqCount++;
      if(self.reqCount >= self.retries) {
        return self.emit('error', err);
      }

      return setTimeout(function() {
        self._streamList(token);
      }, self.reqCount * 1000);
    }

    self.reqCount = 0;

    var idx = 0, object;
    for(idx, idx<res.Contents.length; idx++) {
      self.push(res.Contents[idx]);
    }

    if(res.IsTruncated) {
      self._streamList(res.NextContinuationToken);
    } else {
      self.push(null);
      self.emit('close');
    }
  });
};
