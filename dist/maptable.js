this.d3 = this.d3 || {};
this.d3.maptable = (function () {
  'use strict';

  function appendOptions(select, options, defaultValue) {
    options.forEach(function (f) {
      // Filter select
      var option = document.createElement('option');
      option.setAttribute('value', f.value);
      option.innerText = f.text;
      select.appendChild(option);
    });
    select.value = defaultValue;
  }

  function rangeToBool(el1, range, el2) {
    if (range === '=') {
      return parseInt(el1, 10) === parseInt(el2, 10);
    }
    if (range === '≠') {
      return parseInt(el1, 10) !== parseInt(el2, 10) && el1 !== '' && el2 !== '';
    }
    if (range === '>') {
      return parseInt(el1, 10) > parseInt(el2, 10) && el1 !== '' && el2 !== '';
    }
    if (range === '<') {
      return parseInt(el1, 10) < parseInt(el2, 10) && el1 !== '' && el2 !== '';
    }
    if (range === '≥') {
      return parseInt(el1, 10) >= parseInt(el2, 10) && el1 !== '' && el2 !== '';
    }
    if (range === '≤') {
      return parseInt(el1, 10) <= parseInt(el2, 10) && el1 !== '' && el2 !== '';
    }
    return true;
  }

  function extendRecursive() {
    var dst = {};
    var src = void 0;
    var p = void 0;
    var args = [].splice.call(arguments, 0);
    var toString = {}.toString;

    while (args.length > 0) {
      src = args.splice(0, 1)[0];
      if (toString.call(src) === '[object Object]') {
        for (p in src) {
          if (src.hasOwnProperty(p)) {
            if (toString.call(src[p]) === '[object Object]') {
              dst[p] = extendRecursive(dst[p] || {}, src[p]);
            } else {
              dst[p] = src[p];
            }
          }
        }
      }
    }
    return dst;
  }

  function keyToTile(k) {
    var upperK = k.charAt(0).toUpperCase() + k.slice(1);
    return upperK.replace(/_/g, ' ');
  }

  function sanitizeKey(k) {
    return k.toLowerCase().replace(/ /g, '_').replace(/"/g, '').replace(/'/g, '');
  }

  var utils = {
    rangeToBool: rangeToBool,
    appendOptions: appendOptions,
    extendRecursive: extendRecursive,
    sanitizeKey: sanitizeKey,
    keyToTile: keyToTile
  };

  var defaultOptions = {
    map: {
      longitudeKey: 'longitude',
      latitudeKey: 'latitude',
      countryIdentifierKey: 'country_code',
      countryIdentifierType: 'iso_a2',
      zoom: true,
      ratioFromWidth: 0.5,
      scaleHeight: 1.0,
      scaleZoom: [1, 10],
      fitContentMargin: 10,
      autoFitContent: false,
      tooltipClassName: 'popover bottom',
      countries: {
        legend: false,
        attr: {
          fill: '#FCFCFC',
          stroke: '#CCC',
          'stroke-width': 0.5
        },
        tooltipClassName: 'mt-map-tooltip popover bottom'
      },
      markers: {
        attr: {
          r: 4,
          fill: 'blue',
          stroke: '#CCC',
          'stroke-width': 0.5
        },
        tooltipClassName: 'mt-map-tooltip popover bottom'
      },
      title: {
        fontSize: 12,
        fontFamily: 'Helevetica, Arial, Sans-Serif'
      }
    },
    table: {
      className: 'table table-striped table-bordered',
      collapseRowsBy: []
    }
  };

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var Legend = function () {
    function Legend(map) {
      classCallCheck(this, Legend);

      this.legendWidth = 220;
      this.map = map;
      // Create Legend
      this.node = this.map.svg.append('g').attr('id', 'mt-map-legend').attr('transform', 'translate(' + (this.map.getWidth() - 350) + ', ' + (this.map.getHeight() - 60) + ')');

      this.buildIndice();
    }

    createClass(Legend, [{
      key: 'buildScale',
      value: function buildScale(domain) {
        var legendGradient = this.node.append('defs').append('linearGradient').attr('id', 'mt-map-legend-gradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');

        if (this.map.options.countries.attr.fill.minNegative && this.map.options.countries.attr.fill.maxNegative) {

          // todo - maybe watch for domain[0] < 0 && domain[1] < 0? fall back to normal min & max?
          var midPercentNegative = Math.round((0 - domain[0]) / (domain[1] - domain[0]) * 100);
          var midPercentPositive = midPercentNegative + 1;

          legendGradient.append('stop').attr('offset', '0%').attr('style', 'stop-color:' + this.map.options.countries.attr.fill.maxNegative + ';stop-opacity:1');

          legendGradient.append('stop').attr('offset', midPercentNegative + '%').attr('style', 'stop-color:' + this.map.options.countries.attr.fill.minNegative + ';stop-opacity:1');
          legendGradient.append('stop').attr('offset', midPercentPositive + '%').attr('style', 'stop-color:' + this.map.options.countries.attr.fill.min + ';stop-opacity:1');
        } else {
          legendGradient.append('stop').attr('offset', '0%').attr('style', 'stop-color:' + this.map.options.countries.attr.fill.min + ';stop-opacity:1');
        }

        legendGradient.append('stop').attr('offset', '100%').attr('style', 'stop-color:' + this.map.options.countries.attr.fill.max + ';stop-opacity:1');

        this.node.append('rect').attr('x', 40).attr('y', 0).attr('width', this.legendWidth).attr('height', 15).attr('fill', 'url(#mt-map-legend-gradient)');
      }
    }, {
      key: 'buildIndice',
      value: function buildIndice() {
        var indice = this.node.append('g').attr('id', 'mt-map-legend-indice').attr('style', 'display:none').attr('transform', 'translate(36,15)');

        indice.append('polygon').attr('points', '4.5 0 9 5 0 5').attr('fill', '#222222');

        indice.append('text').attr('x', 4).attr('y', 13).attr('width', 10).attr('height', 10).attr('text-anchor', 'middle').attr('font-family', 'Arial').attr('font-size', '9').attr('stroke', '#FFFFF').attr('stroke-width', '1').attr('fill', '#222222').text('0');

        this.node.append('text').attr('id', 'mt-map-legend-min').attr('x', 35).attr('y', 13).attr('width', 35).attr('height', 15).attr('text-anchor', 'end').attr('font-family', 'Arial').attr('font-size', '14').attr('stroke', '#FFFFF').attr('stroke-width', '3').attr('fill', '#222222').text('0');

        this.node.append('text').attr('id', 'mt-map-legend-max').attr('y', 13).attr('x', 265).attr('width', 40).attr('height', 15).attr('text-anchor', 'start').attr('font-family', 'Arial').attr('font-size', '14').attr('stroke', '#FFFFF').attr('stroke-width', '3').attr('fill', '#222222').text('1');
      }
    }, {
      key: 'updateExtents',
      value: function updateExtents(domain) {
        document.getElementById('mt-map-legend').style.opacity = domain[0] === domain[1] ? 0 : 1;
        if (document.getElementById('mt-map-legend-min')) {
          this.node.select('#mt-map-legend-min').text(Math.round(domain[0]));
          this.node.select('#mt-map-legend-max').text(Math.round(domain[1]));

          // pass in the min and max (domain) to the legend
          this.buildScale(domain);
        }
      }
    }, {
      key: 'indiceChange',
      value: function indiceChange(val) {
        if (isNaN(val)) {
          this.node.select('#mt-map-legend-indice').attr('style', 'display:none');
        } else {
          var maxValue = parseInt(this.node.select('#mt-map-legend-max').text(), 10);
          var minValue = parseInt(this.node.select('#mt-map-legend-min').text(), 10);
          var positionDelta = Math.round((0 - (minValue - val) / (maxValue - minValue)) * this.legendWidth);
          this.node.select('#mt-map-legend-indice text').text(Math.round(val));
          this.node.select('#mt-map-legend-indice').attr('style', 'display:block').attr('transform', 'translate(' + (36 + positionDelta) + ',15)');
        }
      }
    }]);
    return Legend;
  }();

  var Legend$1 = function () {
    function Legend(map, options) {
      classCallCheck(this, Legend);

      this.map = map;
      this.src = options.src;
      this.position = options.position;
      this.width = parseInt(options.width, 10);
      this.height = parseInt(options.height, 10);
      this.padding = options.padding || 10;
      this.style = options.style;

      if (!options.src) {
        console.warn('Watermak src not found');
        return;
      }
      if (isNaN(this.width)) {
        console.warn('Watermak width not found');
        return;
      }
      if (isNaN(this.height)) {
        console.warn('Watermak height not found');
        return;
      }

      if (window.btoa) {
        this.buildWatermark();
      } else {
        console.warn('Watermark not rendered: btoa error');
      }
    }

    createClass(Legend, [{
      key: 'buildWatermark',
      value: function buildWatermark() {
        var _this = this;

        d3.xhr(this.src, function (res) {
          var mapWatermarkDelta = 0;
          if (_this.map.options.title) mapWatermarkDelta = 30;
          var mime = void 0;
          var x = void 0;
          var y = void 0;
          if (_this.src.indexOf('.svg') !== -1) {
            mime = 'image/svg+xml';
          } else if (_this.src.indexOf('.jpg') !== -1 || _this.src.indexOf('.jpeg') !== -1) {
            mime = 'image/jpeg';
          } else if (_this.src.indexOf('.png') !== -1) {
            mime = 'image/png';
          } else {
            console.warn('invalid watermark mime type');
            return;
          }
          var dataUri = 'data:' + mime + ';base64,' + window.btoa(res.responseText);

          if (_this.position) {
            var pos = _this.position.split(' ');
            if (pos[0] === 'top') {
              y = _this.padding;
            } else if (pos[0] === 'middle') {
              y = (_this.map.getHeight() - _this.height) / 2;
            } else if (pos[0] === 'bottom') {
              y = _this.map.getHeight() - _this.height - _this.padding - mapWatermarkDelta;
            } else {
              console.warn('position should be (top|middle|bottom) (left|middle|right)');
            }

            if (pos[1] === 'left') {
              x = _this.padding;
            } else if (pos[1] === 'middle') {
              x = (_this.map.getWidth() - _this.width) / 2;
            } else if (pos[1] === 'right') {
              x = _this.map.getWidth() - _this.width - _this.padding;
            } else {
              console.warn('position should be (top|middle|bottom) (left|middle|right)');
            }
          }

          _this.node = _this.map.svg.append('image').attr('xlink:href', dataUri).attr('width', _this.width).attr('height', _this.height);

          if (x && y) {
            _this.node.attr('x', x).attr('y', y);
          }

          if (_this.style) {
            _this.node.attr('style', _this.style);
          }
        });
      }
    }]);
    return Legend;
  }();

  // Used the name GeoMap instead of Map to avoid collision with the native Map class of JS

  var GeoMap = function () {
    function GeoMap(maptable, options, jsonWorld) {
      var _this = this;

      classCallCheck(this, GeoMap);

      var that = this;
      this.maptable = maptable;
      this.scale = 1;
      this.transX = 0;
      this.transY = 0;

      this.options = options;

      this.jsonWorld = jsonWorld;

      this.node = document.querySelector('#mt-map');
      if (!this.node) {
        // Map wrapper
        var mapWrapper = document.querySelector('.mt-map-container');

        // Map
        this.node = document.createElement('div');
        this.node.setAttribute('id', 'mt-map');
        mapWrapper.appendChild(this.node);
      }

      this.svg = d3.select(this.node).append('svg').attr('id', 'mt-map-svg').attr('viewBox', '0 0 ' + this.getWidth() + ' ' + this.getHeight()).attr('width', this.getWidth()).attr('height', this.getHeight());

      this.projection = d3.geo.equirectangular().translate([this.getWidth() / 2, this.getHeight() / (2 * this.options.scaleHeight)]).scale(this.getWidth() / 640 * 100).rotate([-12, 0]).precision(0.1);

      // Add coordinates to rawData
      this.maptable.rawData.forEach(function (d) {
        d.longitude = parseFloat(d[that.options.longitudeKey]);
        d.latitude = parseFloat(d[that.options.latitudeKey]);
        var coord = [0, 0];
        if (!isNaN(d.longitude) && !isNaN(d.latitude)) {
          coord = that.projection([d.longitude, d.latitude]);
        }
        d.x = coord[0];
        d.y = coord[1];
      });

      this.zoomListener = d3.behavior.zoom().scaleExtent(this.options.scaleZoom).on('zoom', this.rescale.bind(this));

      // Attach Zoom event to map
      if (this.options.zoom) {
        this.svg = this.svg.call(this.zoomListener.bind(this));
      }

      // Add tooltip
      this.tooltipMarkersNode = d3.select(this.node).append('div').attr('id', 'mt-map-markers-tooltip').attr('class', 'mt-map-tooltip ' + this.options.markers.tooltipClassName).style('display', 'none');

      this.tooltipCountriesNode = d3.select(this.node).append('div').attr('id', 'mt-map-countries-tooltip').attr('class', 'mt-map-tooltip ' + this.options.countries.tooltipClassName).style('display', 'none');

      this.layerGlobal = this.svg.append('g').attr('class', 'mt-map-global');
      this.layerCountries = this.layerGlobal.append('g').attr('class', 'mt-map-countries');
      this.layerMarkers = this.layerGlobal.append('g').attr('class', 'mt-map-markers');

      // Add Watermark
      if (this.options.watermark) {
        this.watermark = new Legend$1(this, this.options.watermark);
      }

      // Add Title
      if (this.options.title) {
        this.buildTitle();
      }

      // Add Export SVG Capability
      if (this.options.exportSvg) {
        this.addExportSvgCapability();
      }

      // AutoResize
      if (!this.options.width) {
        window.addEventListener('resize', function () {
          _this.svg.attr('width', _this.getWidth());
          _this.svg.attr('height', _this.getHeight());
          _this.rescale();
        });
      }

      // Let's build things
      this.loadGeometries();
    }

    createClass(GeoMap, [{
      key: 'scaleAttributes',
      value: function scaleAttributes() {
        return Math.pow(this.scale, 2 / 3);
      }
    }, {
      key: 'getWidth',
      value: function getWidth() {
        if (this.options.width) {
          return this.options.width;
        }
        return this.node.offsetWidth;
      }
    }, {
      key: 'getHeight',
      value: function getHeight() {
        var deltaHeight = this.options.title ? 30 : 0;
        if (!this.options.height && this.options.ratioFromWidth) {
          return this.getWidth() * this.options.ratioFromWidth * this.options.scaleHeight + deltaHeight;
        }
        return this.options.height * this.options.scaleHeight + deltaHeight;
      }
    }, {
      key: 'loadGeometries',
      value: function loadGeometries() {
        // We pre-simplify the topojson
        topojson.presimplify(this.jsonWorld);

        // Data geometry
        this.dataCountries = topojson.feature(this.jsonWorld, this.jsonWorld.objects.countries).features;

        this.layerCountries.selectAll('.mt-map-country').data(this.dataCountries).enter().insert('path').attr('class', 'mt-map-country').attr('d', d3.geo.path().projection(this.projection));

        this.legendCountry = {};

        if (this.options.countries.attr.fill && this.options.countries.attr.fill.legend && this.options.countries.attr.fill.min && this.options.countries.attr.fill.max) {
          this.legendCountry.fill = new Legend(this);
        }

        this.render();
      }
    }, {
      key: 'updateCountries',
      value: function updateCountries() {
        var _this2 = this;

        // Data from user input
        var dataByCountry = d3.nest().key(function (d) {
          return d[_this2.options.countryIdentifierKey];
        }).entries(this.maptable.data);

        // We merge both data
        this.dataCountries.forEach(function (geoDatum) {
          geoDatum.key = geoDatum.properties[_this2.options.countryIdentifierType];
          var matchedCountry = dataByCountry.filter(function (uDatum) {
            return uDatum.key === geoDatum.key;
          });
          geoDatum.values = matchedCountry.length === 0 ? [] : matchedCountry[0].values;
          geoDatum.attr = {};
          geoDatum.rollupValue = {};
        });

        // We calculate attributes values
        Object.keys(this.options.countries.attr).forEach(function (k) {
          _this2.setAttrValues(k, _this2.options.countries.attr[k], _this2.dataCountries);
        });

        // Update SVG
        var countryItem = d3.selectAll('.mt-map-country').each(function (d) {
          var targetPath = this;
          Object.keys(d.attr).forEach(function (key) {
            d3.select(targetPath).attr(key, d.attr[key]);
          });
        });

        // Update Legend
        Object.keys(this.options.countries.attr).forEach(function (attrKey) {
          var attrValue = _this2.options.countries.attr[attrKey];
          if ((typeof attrValue === 'undefined' ? 'undefined' : _typeof(attrValue)) === 'object' && attrValue.legend) {
            var scaleDomain = d3.extent(_this2.dataCountries, function (d) {
              return Number(d.rollupValue[attrKey]);
            });
            _this2.legendCountry[attrKey].updateExtents(scaleDomain);

            // When we mouseover the legend, it should highlight the indice selected
            countryItem.on('mouseover', function (d) {
              _this2.legendCountry[attrKey].indiceChange(d.rollupValue[attrKey]);
            }).on('mouseout', function () {
              _this2.legendCountry[attrKey].indiceChange(NaN);
            });
          }
        });

        // Update Tooltip
        if (this.options.countries.tooltip) {
          this.activateTooltip(countryItem, this.tooltipCountriesNode, this.options.countries.tooltip);
        }
      }
    }, {
      key: 'updateMarkers',
      value: function updateMarkers() {
        var _this3 = this;

        var defaultGroupBy = function defaultGroupBy(a) {
          return a.longitude + ',' + a.latitude;
        };

        this.dataMarkers = d3.nest().key(defaultGroupBy).entries(this.maptable.data).filter(function (d) {
          return d.values[0].x !== 0;
        });

        // We merge both data
        this.dataMarkers.forEach(function (d) {
          d.attr = {};
          d.rollupValue = {};
        });

        // We calculate attributes values
        Object.keys(this.options.markers.attr).forEach(function (k) {
          _this3.setAttrValues(k, _this3.options.markers.attr[k], _this3.dataMarkers);
        });

        // Enter
        var markerItem = this.layerMarkers.selectAll('.mt-map-marker').data(this.dataMarkers);
        var markerObject = markerItem.enter();
        if (this.options.markers.customTag) {
          markerObject = this.options.markers.customTag(markerObject);
        } else {
          markerObject = markerObject.append('svg:circle');
        }
        var markerClassName = this.options.markers.className ? this.options.markers.className : '';

        markerObject.attr('class', 'mt-map-marker ' + markerClassName);

        // Exit
        markerItem.exit().transition().attr('r', 0).attr('fill', '#eee').style('opacity', 0).remove();

        // Update
        var attrX = this.options.markers.attrX ? this.options.markers.attrX : 'cx';
        var attrY = this.options.markers.attrY ? this.options.markers.attrY : 'cy';

        var attrXDelta = this.options.markers.attrXDelta ? this.options.markers.attrXDelta : 0;
        var attrYDelta = this.options.markers.attrYDelta ? this.options.markers.attrYDelta : 0;

        var markerUpdate = markerItem.attr(attrX, function (d) {
          return d.values[0].x + attrXDelta;
        }).attr(attrY, function (d) {
          return d.values[0].y + attrYDelta;
        });

        d3.selectAll('.mt-map-marker').each(function (d) {
          var targetPath = this;
          Object.keys(d.attr).forEach(function (key) {
            d3.select(targetPath).attr(key, d.attr[key]);
          });
        });

        if (this.options.markers.tooltip) {
          this.activateTooltip(markerUpdate, this.tooltipMarkersNode, this.options.markers.tooltip);
        }
      }
    }, {
      key: 'fitContent',
      value: function fitContent() {
        if (this.maptable.data.length === 0) {
          this.transX = 0;
          this.transY = 0;
          this.scale = 1;
          this.zoomListener.translate([this.transX, this.transY]).scale(this.scale);
          return true;
        }
        var hor = d3.extent(this.maptable.data, function (d) {
          return d.x;
        });
        var ver = d3.extent(this.maptable.data, function (d) {
          return d.y;
        });

        // center dots with the good ratio
        var ratio = this.getWidth() / this.getHeight();
        var deltaMarker = 20 + (this.options.title ? 30 : 0);

        var currentWidth = hor[1] - hor[0] + deltaMarker;
        var currentHeight = ver[1] - ver[0] + deltaMarker;

        var realHeight = currentWidth / ratio;
        var realWidth = currentHeight * ratio;

        var diffMarginWidth = 0;
        var diffMarginHeight = 0;
        if (realWidth >= currentWidth) {
          diffMarginWidth = (realWidth - currentWidth) / 2;
        } else {
          diffMarginHeight = (realHeight - currentHeight) / 2;
        }

        // add layout margin
        hor[0] -= this.options.fitContentMargin + diffMarginWidth;
        hor[1] += this.options.fitContentMargin + diffMarginWidth;
        ver[0] -= this.options.fitContentMargin + diffMarginHeight;
        ver[1] += this.options.fitContentMargin + diffMarginHeight;

        this.scale = this.getWidth() / (hor[1] - hor[0]);
        this.transX = -1 * hor[0] * this.scale;
        this.transY = -1 * ver[0] * this.scale;

        this.zoomListener.translate([this.transX, this.transY]).scale(this.scale);
      }
    }, {
      key: 'buildTitle',
      value: function buildTitle() {
        var titleContainer = this.svg.append('svg').attr('width', this.getWidth()).attr('x', 0).attr('y', this.getHeight() - 30).attr('height', 30);

        if (this.options.title.bgColor) {
          titleContainer.append('rect').attr('x', 0).attr('y', 0).attr('width', this.getWidth()).attr('height', 30).attr('fill', this.options.title.bgColor);
        }

        titleContainer.append('text').attr('id', 'mt-map-title').attr('x', 20).attr('font-size', this.options.title.fontSize).attr('font-family', this.options.title.fontFamily).attr('y', 20);

        if (this.options.title.source) {
          titleContainer.append('text').attr('y', 20).attr('x', this.getWidth() - 20).attr('text-anchor', 'end').attr('font-size', this.options.title.fontSize).attr('font-family', this.options.title.fontFamily).html(this.options.title.source());
        }
      }
    }, {
      key: 'rescale',
      value: function rescale() {
        var that = this;
        if (d3.event && d3.event.translate) {
          this.scale = d3.event.scale;
          this.transX = this.scale === 1 ? 0 : d3.event.translate[0];
          this.transY = this.scale === 1 ? 0 : d3.event.translate[1];
        }

        var maxTransX = 0;
        var maxTransY = 0;
        var minTransX = this.getWidth() * (1 - this.scale);
        var minTransY = this.getHeight() * (1 - this.scale);

        if (this.transY > maxTransY) {
          this.transY = maxTransY;
        } else if (this.transY < minTransY) {
          this.transY = minTransY;
        }

        if (this.transX > maxTransX) {
          this.transX = maxTransX;
        } else if (this.transX < minTransX) {
          this.transX = minTransX;
        }

        if (d3.event && d3.event.translate) {
          d3.event.translate[0] = this.transX;
          d3.event.translate[1] = this.transY;
        }

        this.layerGlobal.attr('transform', 'translate(' + this.transX + ', ' + this.transY + ')scale(' + this.scale + ')');

        // Hide tooltip
        that.tooltipCountriesNode.attr('style', 'display:none;');
        that.tooltipMarkersNode.attr('style', 'display:none;');

        // Rescale markers size
        if (this.options.markers) {
          // markers
          d3.selectAll('.mt-map-marker').each(function (d) {
            // stroke
            if (d.attr['stroke-width']) {
              d3.select(this).attr('stroke-width', d.attr['stroke-width'] / that.scaleAttributes());
            }
            // radius
            if (d.attr.r) {
              d3.select(this).attr('r', d.attr.r / that.scaleAttributes());
            }
          });
        }

        // Rescale Country stroke-width
        d3.selectAll('.mt-map-country').style('stroke-width', this.options.countries.attr['stroke-width'] / this.scale);
      }
    }, {
      key: 'setAttrValues',
      value: function setAttrValues(attrKey, attrValue, dataset) {
        if (typeof attrValue === 'number' || typeof attrValue === 'string') {
          // Static value
          dataset.forEach(function (d) {
            d.attr[attrKey] = attrValue;
          });
        } else if ((typeof attrValue === 'undefined' ? 'undefined' : _typeof(attrValue)) === 'object') {
          (function () {
            // Dynamic value
            if (!attrValue.rollup) {
              attrValue.rollup = function (d) {
                return d.length;
              };
            }
            if (!attrValue.min || !attrValue.max) {
              throw new Error('MapTable: You should provide values \'min\' & \'max\' for attr.' + attrKey);
            }

            dataset.forEach(function (d) {
              d.rollupValue[attrKey] = attrValue.rollup(d.values);
            });

            var scaleDomain = d3.extent(dataset, function (d) {
              return Number(d.rollupValue[attrKey]);
            });
            if (attrValue.transform) {
              scaleDomain[0] = attrValue.transform(scaleDomain[0]);
              scaleDomain[1] = attrValue.transform(scaleDomain[1]);
            }

            var minValue = attrValue.min;
            var maxValue = attrValue.max;

            if (attrValue.min === 'minValue') {
              minValue = scaleDomain[0];
            }
            if (attrValue.max === 'maxValue') {
              maxValue = scaleDomain[1];
            }

            // check for negative color declarations
            if (attrValue.maxNegative && !attrValue.minNegative || !attrValue.maxNegative && attrValue.minNegative) {
              throw new Error('MapTable: maxNegative or minNegative undefined. Please declare both.');
            }
            var useNegative = attrValue.maxNegative && attrValue.minNegative;
            var scaleFunction = void 0;
            var scaleNegativeFunction = void 0;
            if (useNegative) {
              scaleFunction = d3.scale.linear().domain([0, scaleDomain[1]]).range([attrValue.min, attrValue.max]);

              scaleNegativeFunction = d3.scale.linear().domain([scaleDomain[0], 0]).range([attrValue.maxNegative, attrValue.minNegative]);
            } else {
              scaleFunction = d3.scale.linear().domain(scaleDomain).range([attrValue.min, attrValue.max]);
            }

            dataset.forEach(function (d) {
              var scaledValue = void 0;
              if (!d.values.length || isNaN(d.rollupValue[attrKey])) {
                if (typeof attrValue.empty === 'undefined') {
                  throw new Error('MapTable: no empty property found for attr.' + attrKey);
                }
                scaledValue = attrValue.empty;
              } else {
                var originalValueRaw = d.rollupValue[attrKey];
                var originalValue = attrValue.transform ? attrValue.transform(originalValueRaw) : originalValueRaw;
                if (useNegative && originalValue < 0) {
                  scaledValue = scaleNegativeFunction(originalValue);
                } else {
                  scaledValue = scaleFunction(originalValue);
                }
              }
              d.attr[attrKey] = scaledValue;
            });
          })();
        } else {
          throw new Error('Maptable: Invalid value for ' + attrKey);
        }
      }
    }, {
      key: 'render',
      value: function render() {
        if (this.options.markers) this.updateMarkers();
        if (this.options.countries) this.updateCountries();
        if (this.options.title) this.updateTitle();
        if (this.options.autoFitContent) {
          this.fitContent();
          this.rescale();
        }
      }
    }, {
      key: 'updateTitle',
      value: function updateTitle() {
        var _this4 = this;

        if (this.options.title.content) {
          var showing = this.maptable.data.filter(function (d) {
            return d[_this4.options.latitudeKey] !== 0;
          }).length;
          var total = this.maptable.rawData.filter(function (d) {
            return d[_this4.options.latitudeKey] !== 0;
          }).length;

          var inlineFilters = '';
          if (this.maptable.filters) {
            inlineFilters = this.maptable.filters.getDescription();
          }

          document.getElementById('mt-map-title').innerHTML = this.options.title.content(showing, total, inlineFilters);
        }
      }
    }, {
      key: 'activateTooltip',
      value: function activateTooltip(target, tooltipNode, tooltipContent, cb) {
        var _this5 = this;

        target.on('mousemove', function (d) {
          var mousePosition = d3.mouse(_this5.svg.node()).map(function (v) {
            return parseInt(v, 10);
          });

          var tooltipDelta = tooltipNode.node().offsetWidth / 2;
          var mouseLeft = mousePosition[0] - tooltipDelta;
          var mouseTop = mousePosition[1] + 10;

          tooltipNode.attr('style', 'top:' + mouseTop + 'px;left:' + mouseLeft + 'px;display:block;').html(tooltipContent(d)).on('mouseout', function () {
            return tooltipNode.style('display', 'none');
          });

          if (cb) {
            tooltipNode.on('click', cb);
          }
        }).on('mouseout', function () {
          return tooltipNode.style('display', 'none');
        });
      }
    }, {
      key: 'exportSvg',
      value: function exportSvg() {
        // Get the d3js SVG element
        var svg = document.getElementById('mt-map-svg');
        // Extract the data as SVG text string
        var svgXml = new XMLSerializer().serializeToString(svg);

        // Submit the <FORM> to the server.
        // The result will be an attachment file to download.
        var form = document.getElementById('mt-map-svg-form');
        form.querySelector('[name="data"]').value = svgXml;
        form.submit();
      }
    }, {
      key: 'addExportSvgCapability',
      value: function addExportSvgCapability() {
        var exportNode = document.createElement('div');
        exportNode.setAttribute('id', 'mt-map-export');
        document.getElementById('mt-map').appendChild(exportNode);

        var exportButton = document.createElement('button');
        exportButton.setAttribute('class', 'btn btn-xs btn-default');
        exportButton.innerHTML = 'Download';
        exportButton.addEventListener('click', this.exportSvg.bind(this));
        exportNode.appendChild(exportButton);

        var exportForm = document.createElement('div');
        exportForm.innerHTML = '<form id="mt-map-svg-form" method="post"\n      action="' + this.options.exportSvg + '"><input type="hidden" name="data"></form>';
        exportNode.appendChild(exportForm);
      }
    }]);
    return GeoMap;
  }();

  var Filters = function () {
    function Filters(maptable, options) {
      var _this = this;

      classCallCheck(this, Filters);

      this.maptable = maptable;
      this.options = options;
      this.criteria = [];

      if (this.options.show) {
        var arrayDiff = this.options.show.filter(function (i) {
          return Object.keys(_this.maptable.columnDetails).indexOf(i) < 0;
        });
        if (arrayDiff.length > 0) {
          throw new Error('MapTable: invalid columns "' + arrayDiff.join(', ') + '"');
        }
        this.activeColumns = this.options.show;
      } else {
        this.activeColumns = Object.keys(this.maptable.columnDetails);
      }

      this.container = document.createElement('div');
      this.maptable.node.appendChild(this.container);

      this.node = document.querySelector('#mt-filters');
      if (!this.node) {
        this.node = document.createElement('div');
        this.node.setAttribute('id', 'mt-filters');
        this.node.setAttribute('class', 'panel panel-default');
        this.maptable.node.appendChild(this.node);
      }

      // -- Filters Header

      var filtersHeaderNode = document.createElement('div');
      filtersHeaderNode.setAttribute('class', 'panel-heading');

      var filtersResetNode = document.createElement('button');
      filtersResetNode.setAttribute('id', 'mt-filters-reset');
      filtersResetNode.setAttribute('class', 'btn btn-default btn-xs pull-right');
      filtersResetNode.style.display = 'none';
      filtersResetNode.style.marginLeft = 5;
      filtersResetNode.innerText = '↺ Reset';
      filtersResetNode.addEventListener('click', this.reset);
      filtersHeaderNode.appendChild(filtersResetNode);

      var filtersTitleNode = document.createElement('h3');
      filtersTitleNode.setAttribute('class', 'panel-title');
      filtersTitleNode.appendChild(document.createTextNode('Filters'));
      filtersHeaderNode.appendChild(filtersTitleNode);

      this.node.appendChild(filtersHeaderNode);

      // -- Filters Content
      var filtersBodyNode = document.createElement('div');
      filtersBodyNode.setAttribute('id', 'mt-filters-content');
      filtersBodyNode.setAttribute('class', 'panel-body');

      var filtersElementsNode = document.createElement('div');
      filtersElementsNode.setAttribute('id', 'mt-filters-elements');
      filtersBodyNode.appendChild(filtersElementsNode);

      var filtersNewNode = document.createElement('a');
      filtersNewNode.setAttribute('id', 'mt-filters-new');
      filtersNewNode.setAttribute('href', '#');
      filtersNewNode.innerText = '+ New filter';
      filtersNewNode.addEventListener('click', this.add.bind(this));
      filtersBodyNode.appendChild(filtersNewNode);

      this.node.appendChild(filtersBodyNode);
    }

    createClass(Filters, [{
      key: 'add',
      value: function add(evt) {
        evt.preventDefault();
        var possibleFilters = this.getPossibleFilters();

        if (possibleFilters.length === 0) {
          return;
        }
        var filterName = possibleFilters[0].key;
        this.create(filterName);
      }
    }, {
      key: 'create',
      value: function create(filterName, replaceNode) {
        var rowNode = this.buildRow(filterName);
        if (replaceNode) {
          replaceNode.parentNode.replaceChild(rowNode, replaceNode);
        } else {
          document.querySelector('#mt-filters-elements').appendChild(rowNode);
        }
        this.criteria.push(filterName);
        this.maptable.render();
        if (this.container.style.display === 'none') {
          this.toggle();
        }
      }
    }, {
      key: 'remove',
      value: function remove(filterName) {
        var rowNode = document.querySelector('[data-mt-filter-name="' + filterName + '"]');
        if (rowNode) rowNode.parentNode.removeChild(rowNode);
        var filterIndex = this.criteria.indexOf(filterName);
        this.criteria.splice(filterIndex, 1);
        this.maptable.render();
      }
    }, {
      key: 'reset',
      value: function reset() {
        this.criteria = [];
        this.container.innerHTML = '';
        this.refresh();
        this.maptable.map.reset();
      }
    }, {
      key: 'getDescription',
      value: function getDescription() {
        var outputArray = [];

        var filtersChildren = document.querySelector('#mt-filters-elements').childNodes;

        for (var i = 0; i < filtersChildren.length; i++) {
          var element = filtersChildren[i];
          var filterName = element.querySelector('.mt-filter-name').value;

          var columnDetails = this.maptable.columnDetails[filterName];

          var line = '';

          if (columnDetails.filterMethod === 'compare') {
            var filterRangeSelect = element.querySelector('.mt-filter-range');
            if (filterRangeSelect.value !== 'any') {
              if (filterRangeSelect.value === 'BETWEEN') {
                var filterValueMin = element.querySelector('.mt-filter-value-min').value;
                var filterValueMax = element.querySelector('.mt-filter-value-max').value;
                if (filterValueMin === '' || filterValueMax === '') continue;
                line += columnDetails.title + ' is between ';
                line += '<tspan font-weight="bold">' + filterValueMin + '</tspan> and\n              <tspan font-weight="bold">' + filterValueMax + '</tspan>';
              } else {
                var filterValue = element.querySelector('.mt-filter-value-min').value;
                if (filterValue === '') continue;
                line += columnDetails.title + ' is ';
                line += filterRangeSelect.options[filterRangeSelect.selectedIndex].text;
                line += '<tspan font-weight="bold">' + filterValue + '</tspan>';
              }
            }
          } else if (columnDetails.filterMethod === 'field' || columnDetails.filterMethod === 'dropdown') {
            var _filterValue = element.querySelector('.mt-filter-value').value;
            if (_filterValue === '') continue;
            var separatorWord = columnDetails.filterMethod === 'field' ? 'contains' : 'is';
            line += columnDetails.title + ' ' + separatorWord + '\n          <tspan font-weight="bold">' + _filterValue + '</tspan>';
          }
          outputArray.push(line);
        }
        return outputArray.join(', ');
      }
    }, {
      key: 'buildRow',
      value: function buildRow(filterName) {
        var _this2 = this;

        var that = this;

        var possibleFilters = this.getPossibleFilters();

        var columnDetails = this.maptable.columnDetails[filterName];

        var rowNode = document.createElement('div');
        rowNode.setAttribute('class', 'mt-filter-row');
        rowNode.setAttribute('data-mt-filter-name', filterName);

        // Button to remove filter
        var minusButton = document.createElement('button');
        minusButton.setAttribute('class', 'btn btn-default pull-right');
        minusButton.setAttribute('data-mt-filter-btn-minus', 1);
        minusButton.innerText = '– Remove this filter';
        minusButton.addEventListener('click', function () {
          filterName = rowNode.querySelector('.mt-filter-name').value;
          _this2.remove(filterName);
        });
        rowNode.appendChild(minusButton);

        // Filters separator "AND"
        var filterSeparator = document.createElement('span');
        filterSeparator.setAttribute('class', 'mt-filters-and');
        filterSeparator.innerText = 'And ';
        rowNode.appendChild(filterSeparator);

        // Filter name select
        var filterNameSelect = document.createElement('select');
        filterNameSelect.setAttribute('class', 'mt-filter-name form-control form-control-inline');
        utils.appendOptions(filterNameSelect, possibleFilters.map(function (f) {
          return { text: f.title, value: f.key };
        }));
        filterNameSelect.value = filterName;

        filterNameSelect.addEventListener('change', function () {
          var oldFilterName = this.parentNode.getAttribute('data-mt-filter-name');
          var newFilterName = this.value;
          that.create(newFilterName, this.parentNode);
          that.remove(oldFilterName);
          that.refresh();
        });
        rowNode.appendChild(filterNameSelect);

        // Filter verb
        var filterVerb = document.createElement('span');
        filterVerb.innerText = columnDetails.filterMethod === 'field' ? ' contains ' : ' is ';
        rowNode.appendChild(filterVerb);

        // Filter range
        var filterRange = null;
        if (columnDetails.filterMethod !== 'field' && columnDetails.filterMethod !== 'dropdown') {
          filterRange = document.createElement('select');
          filterRange.setAttribute('class', 'mt-filter-range form-control form-control-inline');
          utils.appendOptions(filterRange, ['any', '=', '≠', '<', '>', '≤', '≥', 'BETWEEN'].map(function (v) {
            return { text: v, value: v };
          }));
          filterRange.addEventListener('change', function () {
            that.handleRangeChange(this);
          });
          rowNode.appendChild(filterRange);

          // Little space:
          rowNode.appendChild(document.createTextNode(' '));
        }

        // Filter value
        var filterValue = document.createElement('div');
        filterValue.style.display = 'inline-block';
        filterValue.setAttribute('class', 'mt-filter-value-container');

        if (columnDetails.filterMethod === 'compare') {
          ['min', 'max'].forEach(function (val, i) {
            var filterInput = document.createElement('input');
            filterInput.setAttribute('class', 'form-control form-control-inline mt-filter-value-' + val);
            filterInput.setAttribute('type', columnDetails.filterInputType);
            filterInput.addEventListener('keyup', _this2.maptable.render.bind(_this2.maptable));
            filterInput.addEventListener('change', _this2.maptable.render.bind(_this2.maptable));
            filterValue.appendChild(filterInput);
            if (i === 0) {
              // AND
              var filterValueAnd = document.createElement('span');
              filterValueAnd.setAttribute('class', 'mt-filter-value-and');
              filterValueAnd.innerText = ' and ';
              filterValue.appendChild(filterValueAnd);
            }
          });
        } else if (columnDetails.filterMethod === 'field') {
          var filterInput = document.createElement('input');
          filterInput.setAttribute('class', 'form-control form-control-inline mt-filter-value');
          filterInput.setAttribute('type', 'text');
          filterInput.addEventListener('keyup', this.maptable.render.bind(this.maptable));
          filterInput.addEventListener('change', this.maptable.render.bind(this.maptable));
          filterValue.appendChild(filterInput);
        } else if (columnDetails.filterMethod === 'dropdown') {
          var filterSelect = document.createElement('select');
          filterSelect.setAttribute('class', 'form-control form-control-inline mt-filter-value');

          var uniqueValues = d3.nest().key(function (d) {
            return d[filterName];
          }).sortKeys(d3.ascending).entries(this.maptable.rawData);

          utils.appendOptions(filterSelect, [{ text: 'Any', value: '' }].concat(uniqueValues.map(function (k) {
            return { text: k.key, value: k.key };
          })));

          filterSelect.addEventListener('change', this.maptable.render.bind(this.maptable));
          filterValue.appendChild(filterSelect);
        }

        rowNode.appendChild(filterValue);

        // We trigger it here to handle the value of the filter range
        if (filterRange) {
          this.handleRangeChange(filterRange);
        }

        return rowNode;
      }
    }, {
      key: 'handleRangeChange',
      value: function handleRangeChange(filterRange) {
        var rowNode = filterRange.parentNode;
        if (filterRange.value === 'any') {
          rowNode.querySelector('.mt-filter-value-container').style.display = 'none';
        } else {
          rowNode.querySelector('.mt-filter-value-container').style.display = 'inline-block';
          if (filterRange.value === 'BETWEEN') {
            rowNode.querySelector('.mt-filter-value-min').style.display = 'inline-block';
            rowNode.querySelector('.mt-filter-value-and').style.display = 'inline-block';
            rowNode.querySelector('.mt-filter-value-max').style.display = 'inline-block';
          } else {
            rowNode.querySelector('.mt-filter-value-min').style.display = 'inline-block';
            rowNode.querySelector('.mt-filter-value-and').style.display = 'none';
            rowNode.querySelector('.mt-filter-value-max').style.display = 'none';
          }
        }
      }
    }, {
      key: 'getPossibleFilters',
      value: function getPossibleFilters(except) {
        var _this3 = this;

        return Object.keys(this.maptable.columnDetails).map(function (k) {
          return utils.extendRecursive({ key: k }, _this3.maptable.columnDetails[k]);
        }).filter(function (v) {
          return _this3.activeColumns.indexOf(v.key) !== -1 && (except && except === v.key || _this3.criteria.indexOf(v.key) === -1 && v.filterMethod && !v.isVirtual);
        });
      }
    }, {
      key: 'filterData',
      value: function filterData() {
        var that = this;
        this.maptable.data = this.maptable.rawData.filter(function (d) {
          var rowNodes = document.querySelectorAll('.mt-filter-row');
          var matched = true;
          for (var i = 0; i < rowNodes.length && matched; i++) {
            var rowNode = rowNodes[i];
            var filterName = rowNode.getAttribute('data-mt-filter-name');
            var columnDetails = that.maptable.columnDetails[filterName];
            var fmt = columnDetails.dataParse; // shortcut

            if (columnDetails.filterMethod === 'dropdown') {
              var filterValue = rowNode.querySelector('.mt-filter-value').value;
              if (filterValue === '') continue;
              if (d[filterName] !== filterValue) matched = false;
            } else if (columnDetails.filterMethod === 'field') {
              var _filterValue2 = rowNode.querySelector('.mt-filter-value').value;
              if (_filterValue2 === '') continue;
              if (d[filterName].toLowerCase().indexOf(_filterValue2.toLowerCase()) === -1) {
                matched = false;
              }
            } else if (columnDetails.filterMethod === 'compare') {
              var filterRange = rowNode.querySelector('.mt-filter-range').value;
              if (filterRange === 'BETWEEN') {
                var filterValueMin = rowNode.querySelector('.mt-filter-value-min').value;
                var filterValueMax = rowNode.querySelector('.mt-filter-value-max').value;
                if (filterValueMin === '' || filterValueMax === '') continue;
                if (fmt && (fmt(d[filterName]) < fmt(filterValueMin) || fmt(d[filterName]) > fmt(filterValueMax))) {
                  matched = false;
                } else if (parseInt(d[filterName], 10) < parseInt(filterValueMin, 10) || parseInt(d[filterName], 10) > parseInt(filterValueMax, 10)) {
                  matched = false;
                }
              } else {
                var _filterValue3 = rowNode.querySelector('.mt-filter-value-min').value;
                if (_filterValue3 === '') continue;
                if (fmt && !utils.rangeToBool(fmt(d[filterName]), filterRange, fmt(_filterValue3))) {
                  matched = false;
                } else if (!fmt && !utils.rangeToBool(d[filterName], filterRange, _filterValue3)) {
                  matched = false;
                }
              }
            }
          }
          return matched;
        });
      }
    }, {
      key: 'refresh',
      value: function refresh() {
        // update dropdown
        var filterNameSelects = document.querySelectorAll('.mt-filter-name');
        for (var i = 0; i < filterNameSelects.length; i++) {
          var filterNameSelect = filterNameSelects[i];
          var filterName = filterNameSelect.value;
          var possibleFilters = this.getPossibleFilters(filterName);
          filterNameSelect.innerHTML = '';
          utils.appendOptions(filterNameSelect, possibleFilters.map(function (f) {
            return { text: f.title, value: f.key };
          }));
          filterNameSelect.value = filterName;
        }

        // Hide the first "And"
        if (document.querySelectorAll('.mt-filters-and').length > 0) {
          document.querySelectorAll('.mt-filters-and')[0].style.visibility = 'hidden';
        }

        // Check if we reached the maximum of allowed filters
        var disableNewFilter = !this.getPossibleFilters().length;
        document.querySelector('#mt-filters-new').style.visibility = disableNewFilter ? 'hidden' : 'visible';
      }
    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.container.style.display === 'none') {
          this.container.style.display = 'block';
          if (this.criteria.length === 0) {
            this.add();
          }
        } else {
          this.container.style.display = 'none';
        }
      }
    }]);
    return Filters;
  }();

  var Table = function () {
    function Table(maptable, options) {
      var _this = this;

      classCallCheck(this, Table);

      this.maptable = maptable;
      this.options = options;
      this.currentSorting = { key: Object.keys(this.maptable.data[0])[0], mode: 'desc' };

      this.node = document.querySelector('#mt-table');
      if (!this.node) {
        this.node = document.createElement('div');
        this.node.setAttribute('id', 'mt-table');
        this.maptable.node.appendChild(this.node);
      }

      this.node = d3.select(this.node).append('table').attr('class', this.options.className);

      this.header = this.node.append('thead');

      this.body = this.node.append('tbody');

      if (this.options.show) {
        var arrayDiff = this.options.show.filter(function (i) {
          return Object.keys(_this.maptable.columnDetails).indexOf(i) < 0;
        });
        if (arrayDiff.length > 0) {
          throw new Error('MapTable: invalid columns "' + arrayDiff.join(', ') + '"');
        }
        this.activeColumns = this.options.show;
      } else {
        this.activeColumns = Object.keys(this.maptable.columnDetails);
      }

      this.header.selectAll('tr').data([1]).enter().append('tr').selectAll('th').data(this.activeColumns.map(function (k) {
        return utils.extendRecursive({ key: k }, _this.maptable.columnDetails[k]);
      })).enter().append('th').attr('class', function (d) {
        var output = d.sorting ? 'mt-table-sortable' : '';
        output += d.nowrap ? ' nowrap' : '';
        return output;
      }).attr('style', function (d) {
        return d.nowrap ? 'white-space:nowrap;' : '';
      }).text(function (d) {
        return d.title;
      }).attr('id', function (d) {
        return 'column_header_' + utils.sanitizeKey(d.key);
      }).on('click', function (d) {
        if (d.sorting) {
          _this.sortColumn(d.key);
        }
      });

      if (this.options.defaultSorting) {
        this.sortColumn(this.options.defaultSorting.key, this.options.defaultSorting.mode);
      } else {
        this.render();
      }
    }

    createClass(Table, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        // Apply Sort
        this.applySort();

        // Enter
        this.body.selectAll('tr').data(this.maptable.data).enter().append('tr');

        // Exit
        this.body.selectAll('tr').data(this.maptable.data).exit().remove();

        // Update
        var uniqueCollapsedRows = [];
        this.body.selectAll('tr').data(this.maptable.data).attr('class', function (row) {
          if (_this2.options.rowClassName) {
            return 'line ' + _this2.options.rowClassName(row);
          }
          return 'line';
        }).html(function (row) {
          var tds = '';
          _this2.activeColumns.forEach(function (columnKey) {
            var column = _this2.maptable.columnDetails[columnKey];
            tds += '<td';
            if (column.nowrap) {
              tds += ' style="white-space:nowrap;"';
            }
            tds += '>';

            if (!(_this2.options.collapseRowsBy.indexOf(columnKey) !== -1 && uniqueCollapsedRows[columnKey] && uniqueCollapsedRows[columnKey] === row[columnKey])) {
              if (column.cellContent) {
                tds += column.cellContent(row);
              } else if (column.virtual) {
                tds += column.virtual(row);
              } else {
                if (row[columnKey] && row[columnKey] !== 'null') tds += row[columnKey];
              }
              if (_this2.options.collapseRowsBy.indexOf(columnKey) !== -1) {
                uniqueCollapsedRows[columnKey] = row[columnKey];
              }
            }
            tds += '</td>';
          });
          return tds;
        });
      }
    }, {
      key: 'applySort',
      value: function applySort() {
        var _this3 = this;

        var d3SortMode = this.currentSorting.mode === 'asc' ? d3.ascending : d3.descending;
        var columnDetails = this.maptable.columnDetails[this.currentSorting.key];
        this.maptable.data = this.maptable.data.sort(function (a, b) {
          var el1 = a[_this3.currentSorting.key];
          var el2 = b[_this3.currentSorting.key];
          if (columnDetails.dataParse) {
            el1 = columnDetails.dataParse(el1);
            el2 = columnDetails.dataParse(el2);
          } else if (columnDetails.virtual) {
            el2 = columnDetails.virtual(a);
            el2 = columnDetails.virtual(b);
          } else if (columnDetails.filterType === 'compare') {
            el1 = parseInt(el1, 10);
            el2 = parseInt(el2, 10);
          } else {
            el1 = el1.toLowerCase();
            el2 = el2.toLowerCase();
          }
          return d3SortMode(el1, el2);
        });
      }
    }, {
      key: 'sortColumn',
      value: function sortColumn(columnKey, columnMode) {
        this.currentSorting.key = columnKey;
        if (columnKey === this.currentSorting.key) {
          this.currentSorting.mode = this.currentSorting.mode === 'asc' ? 'desc' : 'asc';
        } else {
          this.currentSorting.mode = 'asc';
        }

        var sortableColums = document.querySelectorAll('.mt-table-sortable');
        for (var i = 0; i < sortableColums.length; i++) {
          sortableColums[i].setAttribute('class', 'mt-table-sortable');
        }
        document.getElementById('column_header_' + utils.sanitizeKey(columnKey)).setAttribute('class', 'mt-table-sortable sort_' + this.currentSorting.mode);

        this.render();
      }
    }]);
    return Table;
  }();

  var MapTable = function () {
    function MapTable(target, options) {
      classCallCheck(this, MapTable);

      this.options = options;

      this.node = document.querySelector(target);
      this.node.setAttribute('style', 'position:relative;');

      if (this.options.data.type === 'json') {
        d3.json(this.options.data.path, this.loadData.bind(this));
      } else if (this.options.data.type === 'csv') {
        d3.csv(this.options.data.path, this.loadData.bind(this));
      } else if (this.options.data.type === 'tsv') {
        d3.tsv(this.options.data.path, this.loadData.bind(this));
      }
    }

    createClass(MapTable, [{
      key: 'loadData',
      value: function loadData(err, data) {
        var _this = this;

        if (err) {
          throw err;
        }
        this.rawData = data;
        this.setColumnDetails();
        this.data = data.slice(); // we clone data, so that we can filter it
        // Map
        if (this.options.map) {
          // Map wrapper
          var mapWrapper = document.createElement('div');
          mapWrapper.setAttribute('class', 'mt-map-container');
          this.node.insertBefore(mapWrapper, this.node.firstChild);
          d3.json(this.options.map.path, function (errGeoMap, jsonWorld) {
            if (errGeoMap) {
              throw errGeoMap;
            }
            _this.map = new GeoMap(_this, _this.options.map, jsonWorld);
            _this.render();
          });
        }

        // Filters
        if (this.options.filters) {
          this.filters = new Filters(this, this.options.filters);
        }

        // Table
        if (this.options.table) {
          this.table = new Table(this, this.options.table);
        }
      }
    }, {
      key: 'render',
      value: function render() {
        if (this.filters) {
          this.filters.filterData();
          this.filters.refresh();
        }

        if (this.map) {
          this.map.render();
        }

        if (this.table) {
          this.table.render();
        }
      }
    }, {
      key: 'setColumnDetails',
      value: function setColumnDetails() {
        var that = this;
        if (that.rawData.length === 0) {
          return;
        }
        var defaultColumns = {};

        Object.keys(that.rawData[0]).forEach(function (k) {
          var patternNumber = /^\d+$/;
          var isNumber = patternNumber.test(that.rawData[0][k]);
          defaultColumns[k] = {
            title: utils.keyToTile(k),
            filterMethod: isNumber ? 'compare' : 'field',
            filterInputType: isNumber ? 'number' : 'text',
            sorting: true
          };
          if (isNumber) {
            defaultColumns[k].dataParse = function (val) {
              return parseInt(val, 10);
            };
          }
        });
        that.columnDetails = utils.extendRecursive(defaultColumns, this.options.columns);

        // add isVirtual to columns details
        Object.keys(that.columnDetails).forEach(function (k) {
          that.columnDetails[k].isVirtual = typeof that.columnDetails[k].virtual === 'function';
        });
      }
    }]);
    return MapTable;
  }();

  d3.maptable = function (target) {
    var maptableObject = void 0;
    var maptable = {};
    var options = {
      target: target,
      columns: {},
      data: {},
      map: null,
      filters: null,
      table: null
    };

    maptable.map = function () {
      var mapOptions = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      if (!topojson) {
        throw new Error('Maptable requires topojson.js');
      }
      if (typeof mapOptions.path !== 'string') {
        throw new Error('MapTable: map not provided');
      }
      options.map = mapOptions;
      return maptable;
    };

    maptable.json = function (jsonPath) {
      options.data.type = 'json';
      options.data.path = jsonPath;
      return maptable;
    };

    maptable.csv = function (csvPath) {
      options.data.type = 'csv';
      options.data.path = csvPath;
      return maptable;
    };

    maptable.tsv = function (tsvPath) {
      options.data.type = 'tsv';
      options.data.path = tsvPath;
      return maptable;
    };

    maptable.filters = function () {
      var filtersOptions = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options.filters = filtersOptions;
      return maptable;
    };

    maptable.table = function () {
      var tableOptions = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options.table = tableOptions;
      return maptable;
    };

    maptable.columns = function () {
      var columns = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      options.columns = columns;
      return maptable;
    };

    maptable.render = function () {
      if (typeof target !== 'string' || !document.querySelector(target)) {
        throw new Error('MapTable: target not found');
      }

      if (!options.data || !options.data.path) {
        throw new Error('MapTable: Please provide the path for your dataset json|csv|tsv');
      }

      var customOptions = utils.extendRecursive(defaultOptions, options);
      maptableObject = new MapTable(target, customOptions);
    };
    return maptable;
  };

  if (!d3) {
    throw new Error('Maptable requires d3.js');
  }

  var index = d3.maptable;

  return index;

}());
//# sourceMappingURL=maptable.js.map