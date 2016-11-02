/**
 * @file Controller for the deploy UI
 * @author Joseph Ferraro <@joeferraro>
 */

'use strict';

var express         = require('express');
var router          = express.Router();
var requestStore    = require('../lib/request-store');
var logger          = require('winston');
var Deploy          = require('../lib/services/deploy');
var querystring     = require('querystring');

//[TODO] remove after refactor of _getTestClasses()
var path            = require('path');
var fs              = require('fs-extra');
var util            = require('../lib/util');

router.get('/new', function(req, res) {
  if (!req.project) {
    res.render('error', { error: 'Error: No project attached to this request.' });
  } else {
    var commandExecutor = req.app.get('commandExecutor');
    var deployDelegate = new Deploy({
      project: req.project
    });
    commandExecutor.execute({
      project: req.project,
      name: 'get-connections',
      editor: req.editor
    })
    .then(function(response) {
      res.render('deploy/index.html', {
        connections: response,
        namedDeployments: deployDelegate.getNamedDeployments(),
        hasIndexedMetadata: req.project.hasIndexedMetadata(),
        title: 'Deploy',
        testClasses : _getTestClasses(req.project)
      });
    })
    .catch(function(err) {
      logger.error(err);
      res.status(500).send({ error: err.message });
    });
  }
});

router.post('/', function(req, res) {
  var commandExecutor = req.app.get('commandExecutor');
  var request = commandExecutor.execute({
    project: req.project,
    name: 'deploy',
    body: req.body,
    editor: req.editor
  })
  var requestId = requestStore.add(request);
  return res.send({
    status: 'pending',
    id: requestId
  });
});


/** [TODO: copied from routes/test.  Refactor to keep DRY]
 * Iterates project's classes directory looking for unit test classes
 * @return {Array}- Array of class names
 */
function _getTestClasses(project) {
  var self = this;
  var classes = [];
  var classPath = path.join(project.path, 'src', 'classes');

  var isTestRegEx = new RegExp(/@istest/i);
  var testMethodRegex = new RegExp(/testmethod/i);

  if (fs.existsSync(classPath)) {
    fs.readdirSync(classPath).forEach(function(filename) {
      var fileNameParts = path.basename(filename).split('.');
      var fn = fileNameParts[0];
      var fileBody = util.getFileBody(path.join(classPath, filename));
      if (isTestRegEx.test(fileBody) || testMethodRegex.test(fileBody)) {
        classes.push(fn);
      }
    });
  }
  return classes;
}

module.exports = router;