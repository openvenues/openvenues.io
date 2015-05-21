'use strict'

var fs = require('fs')
var minify = require('html-minifier').minify
var moment = require('moment')
var mustache = require('mustache')
var request = require('superagent')
var xml = require('xml2js').parseString
var _ = require('underscore')

var OV_MANIFEST = 'http://s3.amazonaws.com/openvenues-static-public/cities/manifest.json'
var OV_BUCKETLIST = 'http://s3.amazonaws.com/openvenues-static-public/'

var xmlOptions = {
  explicitArray: false
}

var getReadableFileSize = function (bytes) {
  bytes = parseInt(bytes, 10)
  if (bytes === 0) return 'n/a'

  var formats = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  var i = Math.floor(Math.log(bytes) / Math.log(1024))

  // For KB/bytes, cleaner to not display decimal
  if (i <= 1) {
    return (bytes / Math.pow(1024, i)).toFixed(0) + ' ' + formats[i]
  } else {
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + formats[i]
  }
}

console.log('Building HTML ...')

// Get the template
var template = fs.readFileSync('./templates/index.mustache.html', { encoding: 'utf8' })

// Get the file data sources (there are two)
request
  .get(OV_MANIFEST)
  .end(function (err, res) {
    if (err) {
      console.error('Error @ GET request for ' + OV_MANIFEST + '!', err)
      process.exit(1)
    }

    console.log('Retrieved ' + OV_MANIFEST + ' ...')

    var manifest = JSON.parse(res.text)

    request
      .get(OV_BUCKETLIST)
      .buffer(true)
      .end(function (err, res) {
        if (err) {
          console.error('Error @ GET request for ' + OV_BUCKETLIST + '!', err)
          process.exit(1)
        }

        console.log('Retrieved ' + OV_BUCKETLIST + ' ...')

        // Parse XML results
        xml(res.text, xmlOptions, function (err, json) {
          if (err) {
            console.error('Error @ XML parse!', err)
            process.exit(1)
          }

          var data = json['ListBucketResult']['Contents']
          var latestDateModified
          var combined = []

          for (var i = 0, j = data.length; i < j; i++) {
            // Match with manifest data if present, or reject
            var match = data[i]['Key'].split('/')[1]
            var city = _.findWhere(manifest.files, {file: match})
            if (!city) {
              continue
            }

            // Name hacks
            switch (city.locality) {
              case 'City of London':
                city.locality = 'London'
                break
              case 'Washington City':
                city.locality = 'Washington, D.C.'
                break
              default:
                break
            }

            // Create human readable file size value
            var sourceSize = data[i]['Size']
            var formattedSize = getReadableFileSize(sourceSize)

            // Also remember the latest LastModified date
            var dateToCheck = moment(data[i]['LastModified'])
            if (!latestDateModified || dateToCheck.isAfter(latestDateModified)) {
              latestDateModified = dateToCheck
            }

            // Create a simple key-value object of filenames and sizes
            combined.push({
              filename: data[i]['Key'],
              filesize: data[i]['Size'],
              formattedsize: formattedSize,
              cityname: city.locality,
              country: city.country,
              region: city.region
            })
          }

          // Alphabetize
          combined = _.sortBy(combined, 'cityname')

          console.log('Data parsed!')

          // Create data for template
          var viewdata = {
            dateRefreshed: latestDateModified.format('dddd, D MMMM YYYY'),
            timeRefreshed: latestDateModified.format('HH:mm'),
            manifest: combined
          }

          // Render and minify
          var output = mustache.render(template, viewdata)
          var result = output
          /*var result = minify(output, {
            collapseWhitespace: true
          })*/

          // Write the template to file
          fs.writeFile('index.html', result, {
            encoding: 'utf8'
          }, function (err) {
            if (err) {
              console.error('Error writing index.html: ', err)
              process.exit(1)
            }
            console.log('Front page created!')
          })
        })
      })
  })
