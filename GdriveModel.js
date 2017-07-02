'use strict';

var doGoogleAuth = require('do-google-auth'),
    fs           = require('fs'),
    google       = require('googleapis');


/**
 * A module for interacting with Google Drive's APIs
 * @module griveModel
 */

// Some object variables
var
    _drive,
    _googleAuth;



/**
 * Gdrive Model constructor.
 * @param {object}   params - Params to be passed in
 * @param {string}   params.clientSecretFile - full path to the client secret file to be used by google if an access token doesn't yet exist
 * @param {string[]} params.googleScopes - Google drive scopes for which this object instance will have permissions
 * @param {string}   params.tokenDir - directory on the local machine in which the google access token lives
 * @param {string}   params.tokenFile - name of file on the local machine that contains the google access token
 * @param {string}   params.userId - id of the drive to be accessed (defaults to 'me' if the argument isn't passed in
 * @constructor
 */
function GdriveModel(params) {

  this.userId = (params.userId === undefined)? 'me' : params.userId;


  // Test inputs
  var requiredParams = ['googleScopes', 'tokenFile', 'tokenDir', 'clientSecretFile']
  for (var i = 0; i < requiredParams.length; i++) {
    if (params[requiredParams[i]] === undefined) throw new Error('Gdrive Model - required parameter not set: ' + requiredParams[i]);
  }

  this._googleAuth = new doGoogleAuth(
    params.googleScopes.join(" "),
    params.tokenFile,
    params.tokenDir,
    params.clientSecretFile
  );

  this._drive = google.drive('v3');

}


var method = GdriveModel.prototype;


/**
 * gdriveModel.createFile
 *
 * @desc Inserts a file into the drive.
 *
 * @alias gdriveModel.createFile
 * @memberOf! gdriveModel(v1)
 *
 * @param  {object} params - Parameters for request
 * @param  {boolean} params.isFolder - Whether or not this is a folder being created
 * @param  {string} params.localFile - If set, this is a path to a file on the local file system that will be uploaded
 * @param  {object} params.media - Media resource
 * @param  {string} params.media.body - Body of the file being uploaded
 * @param  {object} params.resource - Media resource metadata
 * @param  {string} params.resource.description - A short description of the file
 * @param  {string} params.resource.mimeType -
 * @param  {string[]} params.resource.parents - Ids of parent folders
 * @param  {string} params.resource.title - Name of the file
 * @param  {string[]} params.retFields - Optional. The specific resource fields to return in the response.
 * @param  {callback} callback - The callback that handles the response. Returns callback(error,response)
 * @return {object} response - The google resource returned
 */
method.createFile = function (params,callback) {

  var self = this;

  var mimeType;
  if (params.isFolder) {
    mimeType = 'application/vnd.google-apps.folder'
  } else {

    mimeType = params.resource.mimeType


    var mediaBody;

    if (params.localFile) {

      if (params.hasOwnProperty('media') && params.media.hasOwnProperty('body')) {
        callback(new Error('GdriveModel.createFile - Media body and local file path passed'));
        return null
      }
      mediaBody = fs.readFileSync(params.localFile)
    } else {
      mediaBody = params.media.body;
    }
  }



  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  self._googleAuth.authorize(function (err, auth) {

    if (err) { callback(err); return null}

    var fileArgs = {
      auth: auth,
      userId: self.userId,
      media: {
        body: mediaBody
      },
      resource: {
        description: params.resource.description,
        mimeType: mimeType,
        name: params.resource.title
      }
    }

    // Optional params to send to google
    if (params.retFields) fileArgs.fields = params.retFields.join(',')
    if (params.resource.parents) {
      fileArgs.resource.parents = []
      params.resource.parents.forEach(function(el) {fileArgs.resource.parents.push(el.id)});
    }

    self._drive.files.create(fileArgs, function(err, response) {

      if (err) { callback(err); return null}

      callback(null,response)
    });
  });
}


/**
 * gdriveModel.getFile
 *
 * @desc Gets a file
 *
 * @alias gdriveModel.getFile
 * @memberOf! gdriveModel(v1)
 *
 * @param  {object} params - Parameters for request
 * @param  {boolean} params.fileId
 * @param  {string[]} params.retFields - Optional. The specific resource fields to return in the response.
 * @param  {callback} callback - The callback that handles the response. Returns callback(error,file)
 * @return {object} response - The google resource returned
 */
method.getFile = function (params,callback) {

  var self = this;

  // Authorize a client with the loaded credentials, then call the
  // Gdrive API.
  self._googleAuth.authorize(function (err, auth) {

    if (err) { callback(err); return null}

    var fileArgs = {
      auth: auth,
      userId: self.userId,
      fileId: params.fileId,
      prettyPrint: false
    }

    // Optional params to send to google
    if (params.retFields) fileArgs.fields = params.retFields.join(',')

    self._drive.files.get(fileArgs, function(err, response) {

      if (err) { callback(err); return null}

      callback(null,response)
    });
  });
}


/**
 * gdriveModel.listFiles
 *
 * @desc List files in the drive.
 *
 * @alias gdriveModel.listFiles
 * @memberOf! gdriveModel(v1)
 *
 * @param  {object} params - Parameters for request
 * @param  {string} params.freetextSearch - Drive search
 * @param  {string[]} params.retFields - Optional. The specific resource fields to return in the response.
 * @param  {string} params.spaces - As per the drive api
 * @param  {callback} callback - The callback that handles the response. Returns callback(error,files[])
 * @return {object} files[] - The google files resources
 */
method.listFiles = function (params,callback) {

  var self = this;

  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  self._googleAuth.authorize(function (err, auth) {

    if (err) { callback(err); return null}

    var fileArgs = {
      auth: auth,
      userId: self.userId
    }

    if (params.retFields) fileArgs.fields = params.retFields.join(',')
    if (params.spaces) fileArgs.spaces = params.spaces
    if (params.freetextSearch) fileArgs.q = params.freetextSearch

    self._drive.files.list(fileArgs, function(err, response) {

      if (err) { callback(err); return null }
      callback(null,response.files)

    });
  });
}

/**
 * gdriveModel.trashFiles
 *
 * @desc Deletes files from the drive.
 *
 * @alias gdriveModel.trashFiles
 * @memberOf! gdriveModel(v1)
 *
 * @param  {object} params - Parameters for request
 * @param  {string[]} params.fileIds - Google ids of the files being created
 * @param  {boolean]} params.deletePermanently - Whether to use instant deletion rather than trash
 * @param  {string} params.responses - Responses from trashed files (only used when calling recursively
 * @param  {callback} callback - The callback that handles the response. Returns callback(error,responses[])
 * @return {object} responses[] - The google resources returned for each deletion
 */
method.trashFiles = function (params,callback) {

  var self = this;

  var fileIds = params.fileIds,
      fileId  = fileIds[0];

  // Initialize params.responses if this isn't a recursive call
  var responses = (typeof params.responses !== 'undefined')? params.responses : [];

  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  self._googleAuth.authorize(function (err, auth) {

    if (err) { callback(err); return null}

    var fileArgs = {
      auth: auth,
      userId: self.userId,
      fileId: fileId
    }

    var trashFunc;
    if (params.deletePermanently) {
      trashFunc = self._drive.files.delete;
    } else {
      trashFunc = self._drive.files.update;
      fileArgs.resource = {trashed: true}
      fileArgs.fields   = "id,trashed"
    }


    trashFunc(fileArgs, function(err, response) {

      if (typeof err !== undefined && err != null) {
      console.log('Error is ' + JSON.stringify(err))
        var action = 'trashing'
        if (params.deletePermanently) action = 'deleting';

        var errMsg = 'gdriveModel.trashFiles: The google API returned an error when ' + action + ' file ' + fileId + ': ' + err;
        callback(errMsg)
        return null
      }

      responses.push(response);
      params.fileIds.splice(0,1)

      if (params.fileIds.length > 0) {
        params.responses = responses
        self.trashFiles(params, callback);
      } else {
        callback(null,responses)
      }

    });
  });
}



module.exports = GdriveModel
