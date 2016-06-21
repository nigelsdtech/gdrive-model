'use strict'

var cfg         = require('config'),
    chai        = require('chai'),
    fs          = require('fs'),
    GdriveModel = require('../GdriveModel.js'),
    should      = chai.should()

var timeout = (1000*10)

describe('Creating an instance of a gdrive-model', function () {

  this.timeout(timeout);

  it('should error when not passing in one of the required parameters' , function() {

    var requiredParams = [
      { p: 'googleScopes',     c: cfg.auth.scopes},
      { p: 'tokenFile',        c: cfg.auth.tokenFile},
      { p: 'tokenDir',         c: cfg.auth.tokenFileDir},
      { p: 'clientSecretFile', c: cfg.auth.clientSecretFile}
    ]

    for (var i = 0; i < requiredParams.length; i++) {

      // Add all args except the current one due to be skipped
      var args = {}
      for (var j = 0; j < requiredParams.length; j++) {
        if (i != j) {
          args[requiredParams[j].p] = requiredParams[j].c
        }
      }


      var error = {} ;
      try {
        var x = new GdriveModel(args);
      } catch (e) {
        error = e;
      } finally {
        error.should.be.a('Error')
        error.message.should.equal('Gdrive Model - required parameter not set: ' + requiredParams[i].p)
      }

    }

  });


  it('should succeed when passing in all the required parameters', function (done) {

    var g = new GdriveModel({
      googleScopes: cfg.auth.scopes,
      tokenFile: cfg.auth.tokenFile,
      tokenDir: cfg.auth.tokenFileDir,
      clientSecretFile: cfg.auth.clientSecretFile
    });

    done();

  });


});



var newFileId, newFolderId, newUploadedLocalFileId;

describe('Using a gdrive-model to upload files', function (done) {

  this.timeout(timeout);
  var g;

  before( function(done) {
    g = new GdriveModel({
      googleScopes: cfg.auth.scopes,
      tokenFile: cfg.auth.tokenFile,
      tokenDir: cfg.auth.tokenFileDir,
      clientSecretFile: cfg.auth.clientSecretFile
    });

    done();
  })


  it('should throw an error when passed a local file and a media body' , function(done) {

    var d = new Date();
    var desc =  "Delete this bad test file created on " + d.toString();

    g.createFile({
      localFile: '/tmp/blah.pdf',
      media: {
        body: 'some dud data'
      },
      resource: {
        description: desc,
        mimeType: 'text/plain',
        title: "Delete this bad test file " + d.getTime()
      }
    }, function (err, resp) {

      should.exist(err)
      err.message.should.equal('GdriveModel.createFile - Media body and local file path passed');
      done();
    });

  });



  it('should create a folder on the google drive' , function(done) {

    var d = new Date();
    var desc =  "Test folder created on " + d.toString();

    g.createFile({
      isFolder: true,
      resource: {
        description: desc,
        title: "Test folder " + d.getTime()
      }
    }, function (err, resp) {

      should.not.exist(err);
      resp.id.should.be.a('String')
      resp.description.should.equal(desc)
      newFolderId = resp.id;
      done();
    })

  });

  it('should upload a file with content passed in on the google drive' , function(done) {

    var d = new Date();
    var desc =  "Test file created on " + d.toString();

    g.createFile({
      media: {
        body: 'some dud data'
      },
      resource: {
        description: desc,
        mimeType: 'text/plain',
        title: "Delete this test file " + d.getTime()
      }
    }, function (err, resp) {

      should.not.exist(err);
      resp.id.should.be.a('String')
      resp.description.should.equal(desc)
      resp.parents[0].id.should.not.equal(newFolderId)
      newFileId = resp.id;
      done();
    });

  });

  it('should upload a local file into the test folder on the google drive' , function(done) {

    var d = new Date();
    var desc =  "Test file created on " + d.toString();

    g.createFile({
      localFile: './test/data/fileToUpload.txt',
      resource: {
        description: desc,
        mimeType: 'text/plain',
        parents: [{id: newFolderId}],
        title: "Test file " + d.getTime()
      }
    }, function (err, resp) {

      should.not.exist(err);
      resp.id.should.be.a('String')
      resp.description.should.equal(desc)
      resp.parents[0].id.should.equal(newFolderId)
      newUploadedLocalFileId = resp.id;
      done();
    });

  });

});


describe('Using a gdrive-model to remove files', function (done) {

  this.timeout(timeout);
  var g;

  before( function(done) {
    g = new GdriveModel({
      googleScopes: cfg.auth.scopes,
      tokenFile: cfg.auth.tokenFile,
      tokenDir: cfg.auth.tokenFileDir,
      clientSecretFile: cfg.auth.clientSecretFile
    });

    done();
  })

  it('should trash a single file (the content-passed-in file) from the google drive' , function(done) {

    g.trashFiles({ fileIds: [ newFileId ] }, function (err, resps) {

      should.not.exist(err);
      resps.length.should.equal(1)
      for (var i = 0; i < resps.length; i++ ) {
        resps[i].labels.trashed.should.equal(true)
      }
      done();
    })

  });

  it('should permanently delete a single file (the content-passed-in file) from the google drive' , function(done) {

    g.trashFiles({ fileIds: [newFileId], deletePermanently: true }, function (err, resps) {

      should.not.exist(err);
      resps.length.should.equal(1)
      for (var i = 0; i < resps.length; i++ ) {
        should.not.exist(resps[i])
      }
      done();
    })

  });
  it('should trash multiple files (the upload file and folder) from the google drive' , function(done) {

    g.trashFiles({ fileIds: [newUploadedLocalFileId, newFolderId] }, function (err, resps) {

      should.not.exist(err);
      resps.length.should.equal(2)
      for (var i = 0; i < resps.length; i++ ) {
        resps[i].labels.trashed.should.equal(true)
      }
      done();
    })

  });

  it('should permanently delete multiple files (the upload file and folder) from the google drive' , function(done) {

    g.trashFiles({ fileIds: [newUploadedLocalFileId, newFolderId], deletePermanently: true }, function (err, resps) {

      should.not.exist(err);
      resps.length.should.equal(2)
      for (var i = 0; i < resps.length; i++ ) {
        should.not.exist(resps[i])
      }
      done();
    })

  });

})
