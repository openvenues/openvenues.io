'use strict'

var request = require('superagent')
var GeoJSON = require('geojson')
var fs = require('fs')

var OV_MANIFEST = 'http://s3.amazonaws.com/openvenues-static-public/cities/manifest.json'
var dest = 'data/cities.geojson'

request
  .get(OV_MANIFEST)
  .end(function (err, res) {
    if (err) {
      console.error('Error @ GET request!', err)
      process.exit(1)
    }

    var data = JSON.parse(res.text)
    GeoJSON.parse(data.files, { Point: ['latitude', 'longitude'] }, function (geojson) {
      fs.writeFileSync(dest, JSON.stringify(geojson))
      console.log('OpenVenues city manifest data processed to ' + dest)
    })
  })
