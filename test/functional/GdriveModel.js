'use strict'

var cfg         = require('config'),
    chai        = require('chai'),
    expect      = chai.expect,
    fs          = require('fs'),
    GdriveModel = require('../../GdriveModel.js'),
    should      = chai.should()

var timeout = (1000*20)

describe('Creating an instance of a gdrive-model', function () {

  this.timeout(timeout);

  var requiredParams = [
    { p: 'googleScopes',     c: cfg.auth.scopes},
    { p: 'tokenFile',        c: cfg.auth.tokenFile},
    { p: 'tokenDir',         c: cfg.auth.tokenFileDir},
    { p: 'clientSecretFile', c: cfg.auth.clientSecretFile}
  ]


  requiredParams.forEach(function(rp) {

    it('should error when not passing in ' + rp.p , function() {

      // Add all args except the current one due to be skipped
      var args = {}
      for (var j = 0; j < requiredParams.length; j++) {
        if (requiredParams[j].p != rp.p) {
          args[requiredParams[j].p] = requiredParams[j].c
        }
      }

      function fn () {var x = new GdriveModel(args);}

      expect(fn).to.throw(Error);
      expect(fn).to.throw('Gdrive Model - required parameter not set: ' + rp.p);
    });

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



var newFileId, newFolderId, newUploadedLocalFileId, testFolderName;

var g = new GdriveModel({
  googleScopes: cfg.auth.scopes,
  tokenFile: cfg.auth.tokenFile,
  tokenDir: cfg.auth.tokenFileDir,
  clientSecretFile: cfg.auth.clientSecretFile
});

describe('Using a gdrive-model to upload files', function (done) {

  this.timeout(timeout);


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

      err.should.be.an.error
      err.message.should.equal('GdriveModel.createFile - Media body and local file path passed');
      done();
    });

  });



  it('should create a folder on the google drive' , function(done) {

    var d = new Date();
    var desc =  "Test folder created on " + d.toString();
    testFolderName = "Test folder " + d.getTime();

    g.createFile({
      isFolder: true,
      resource: {
        description: desc,
        title: testFolderName
      }
    }, function (err, resp) {

      should.not.exist(err);
      resp.id.should.be.a('String')
      resp.name.should.equal(testFolderName)
      newFolderId = resp.id;
      done();
    })

  });

  it('should upload a file with content passed in on the google drive' , function(done) {

    var d = new Date();
    var desc  = "Test file created on " + d.toString();
    var title = "Delete this test file " + d.getTime();

    g.createFile({
      media: {
        body: 'some dud data'
      },
      resource: {
        description: desc,
        mimeType: 'text/plain',
        title: title
      }
    }, function (err, resp) {

      should.not.exist(err);
      resp.id.should.be.a('String')
      resp.name.should.equal(title)
      newFileId = resp.id;
      done();
    });

  });

  it('should upload a local file into the test folder on the google drive' , function(done) {

    var d = new Date();
    var desc =  "Test file created on " + d.toString();
    var title = "Test file " + d.getTime()

    g.createFile({
      localFile: './test/data/fileToUpload.txt',
      resource: {
        description: desc,
        mimeType: 'text/plain',
        parents: [{id: newFolderId}],
        title: title
      },
      retFields: ['id','name','parents']
    }, function (err, resp) {

      console.log('Resp: ' + JSON.stringify(resp))
      should.not.exist(err);
      resp.id.should.be.a('String')
      resp.name.should.equal(title)
      resp.parents[0].should.equal(newFolderId)
      newUploadedLocalFileId = resp.id;
      done();
    });

  });

});


describe('Using a gdrive-model to search for files', function (done) {

  this.timeout(timeout);

  it('should search successfully for the folder created' , function(done) {

    g.listFiles({
      freetextSearch: "name='"+testFolderName+"'",
      spaces: "drive"
    }, function (err, files) {

      should.not.exist(err);
      files.length.should.equal(1)
      files[0].id.should.equal(newFolderId)
      done();
    })

  });

});

describe('Using a gdrive-model to remove files', function (done) {

  this.timeout(timeout);


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

});
