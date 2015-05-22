/*jslint browser: true*/
/*global $, L, Tangram */
(function () {
  'use strict'

  var DEBUG = true

  var map = L.map('map', {
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    trackResize: true,
    keyboard: false,
    inertia: false,
    zoomControl: false,
    wheelDebounceTime: 20
  })
  var layer = Tangram.leafletLayer({
    scene: 'tangram/scene.yaml',
    attribution: '<a href="https://mapzen.com/tangram">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/">Mapzen</a>'
  })
  var scene = layer.scene

  map.attributionControl.setPrefix('')
  // map.setView([40.708, -74.006], 15)

  // Feature selection
  function initFeatureSelection () {
    // Selection info shown on hover
    var selection_info = document.createElement('div')
    selection_info.className = 'poi-label'
    selection_info.style.display = 'block'

    // Show selected feature on hover
    scene.container.addEventListener('mousemove', function (event) {
      var pixel = { x: event.clientX, y: event.clientY }

      scene.getFeatureAt(pixel).then(function (selection) {
        var feature = selection.feature
        if (feature !== null) {
          // console.log("selection map: " + JSON.stringify(feature))

          var label = ''
          if (feature.properties.name != null) {
            label = feature.properties.name
          }

          if (label !== '') {
            selection_info.style.left = (pixel.x + 5) + 'px'
            selection_info.style.top = (pixel.y + 15) + 'px'
            selection_info.innerHTML = '<span class="poi-label-inner">' + label + '</span>'
            scene.container.appendChild(selection_info)
          } else if (selection_info.parentNode != null) {
            selection_info.parentNode.removeChild(selection_info)
          }
        } else if (selection_info.parentNode != null) {
          selection_info.parentNode.removeChild(selection_info)
        }
      })

      // Don't show labels while panning
      if (scene.panning === true) {
        if (selection_info.parentNode !== null) {
          selection_info.parentNode.removeChild(selection_info)
        }
      }
    })
  }

  // Render loop
  window.addEventListener('load', function () {
    layer.on('init', function () {
      initFeatureSelection()
    })
    layer.addTo(map)

    $.get('data/cities.geojson', function (data) {
      var cities = L.geoJson(data).addTo(map)
      map.fitBounds(cities.getBounds())

      // Hacky zoom tweaks
      var zoom = map.getZoom()
      if (zoom < 1) zoom = 1
      if (zoom > 2) zoom = 2
      map.setZoom(zoom + 1)

      // Public / debuggable
      if (DEBUG === true) {
        window.cities = cities
      }
    }, 'json')
  })

  // Make stuff public
  if (DEBUG === true) {
    window.map = map
    window.layer = layer
    window.scene = scene
  }
}())
