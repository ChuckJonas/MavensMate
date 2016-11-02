/**
 * @file Execute SOQL
 * @author Charlie Jonas <@chuckjonas>
 */

'use strict';

var express         = require('express');
var router          = express.Router();
var requestStore    = require('../lib/request-store');
var logger          = require('winston');

// todo: refactor errors
router.get('/new', function(req, res) {
  if (!req.project) {
    res.render('error', { error: 'Error: No project attached to this request.' });
  } else {
    res.render('soql/index.html', {
      title: 'Execute SOQL'
    });
  }
});

router.post('/', function(req, res) {
  var request = req.project.sfdcClient.executeSoql(req.body.query);
  var requestId = requestStore.add(request);
  
  return res.send({
    status: 'pending',
    id: requestId
  });
});


module.exports = router;