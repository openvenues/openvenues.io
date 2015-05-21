'use strict'

var request = require('superagent')
var xml = require('xml2js').parseString
//var fs = require('fs')

var OV_MANIFEST = 'http://s3.amazonaws.com/openvenues-static-public/cities/manifest.json'
var OV_BUCKETLIST = 'http://s3.amazonaws.com/openvenues-static-public/'

request
  .get(OV_BUCKETLIST)
  .buffer(true)
  .end(function (err, res) {
    if (err) {
      console.error('Error @ GET request!', err)
      process.exit(1)
    }

    // Parse XML result
    xml(res.text, function (err, json) {
      if (err) {
        console.error('Error @ XML parse!', err)
        process.exit(1)
      }

      console.log('Retrieved!')
    })
  })
