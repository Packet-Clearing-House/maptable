this.d3 = this.d3 || {};
this.d3.maptable = (function () {
  'use strict';

  var babelHelpers = {};
  babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  babelHelpers.classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  babelHelpers.createClass = function () {
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

  babelHelpers;

  function appendOptions(select, options, defaultValue) {
    options.forEach(function (f) {
      // Filter select
      var option = document.createElement('option');
      option.setAttribute('value', f.key);
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

  function extendRecursive(obj1, obj2) {
    if (!obj1) obj1 = {};
    if (!obj2) obj2 = {};
    Object.keys(obj2).forEach(function (p) {
      try {
        // Property in destination object set; update its value.
        if (obj2[p].constructor === Object) {
          obj1[p] = extendRecursive(obj1[p], obj2[p]);
        } else {
          obj1[p] = obj2[p];
        }
      } catch (e) {
        // Property in destination object not set; create it and set its value.
        obj1[p] = obj2[p];
      }
    });

    return obj1;
  }

  function sanitizeKey(k) {
    return k.toLowerCase().replace(/ /g, '_').replace(/"/g, '').replace(/'/g, '');
  }

  var utils = {
    rangeToBool: rangeToBool,
    appendOptions: appendOptions,
    extendRecursive: extendRecursive,
    sanitizeKey: sanitizeKey
  };

  var defaultOptions = {
    map: {
      longitudeKey: 'longitude',
      latitudeKey: 'latitude',
      legend: false,
      ratioFromWidth: 0.5,
      scaleHeight: 1,
      scaleZoom: [1, 10],
      animationDuration: 750,
      fitContentMargin: 10,
      autoFitContent: true,
      showNullCoordinates: false,
      tooltipClass: 'popover bottom',
      title: {
        fontSize: 12,
        fontFamily: 'Helevetica, Arial, Sans-Serif'
      }
    },
    table: {
      class: 'table table-striped table-bordered',
      collapseRowsBy: []
    }
  };

  var Legend = function () {
    function Legend(map) {
      babelHelpers.classCallCheck(this, Legend);

      this.map = map;
      // Create Legend
      this.node = this.map.svg.append('g').attr('transform', 'translate(' + (this.map.getWidth() - 300) + ', ' + (this.map.getHeight() - 60) + ')');

      this.buildScale();
      this.buildIndice();
    }

    babelHelpers.createClass(Legend, [{
      key: 'buildScale',
      value: function buildScale() {
        var legendGradient = this.node.append('defs').append('linearGradient').attr('id', 'mt-map-legend-gradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');

        legendGradient.append('stop').attr('offset', '0%').attr('style', 'stop-color:' + this.map.options.countries.attr.fill[0] + ';stop-opacity:1');

        legendGradient.append('stop').attr('offset', '100%').attr('style', 'stop-color:' + this.map.options.countries.attr.fill[1] + ';stop-opacity:1');

        this.node.append('rect').attr('x', 40).attr('y', 0).attr('width', 220).attr('height', 15).attr('fill', 'url(#mt-map-legend-gradient)');
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
        if (document.getElementById('mt-map-legend-min')) {
          this.node.select('#mt-map-legend-min').text(domain[0]);
          this.node.select('#mt-map-legend-max').text(domain[1]);
        }
      }
    }, {
      key: 'indiceChange',
      value: function indiceChange(val) {
        if (isNaN(val)) {
          this.node.select('#mt-map-legend-indice').attr('style', 'display:none');
        } else {
          var maxValue = parseInt(this.node.select('#mt-map-legend-max').text(), 10);
          var positionDelta = val / maxValue * 220;
          this.node.select('#mt-map-legend-indice text').text(val);
          this.node.select('#mt-map-legend-indice').attr('style', 'display:block').attr('transform', 'translate(' + (36 + positionDelta) + ',15)');
        }
      }
    }]);
    return Legend;
  }();

  var Legend$1 = function () {
    function Legend(map, options) {
      babelHelpers.classCallCheck(this, Legend);

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

    babelHelpers.createClass(Legend, [{
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
      babelHelpers.classCallCheck(this, GeoMap);

      var that = this;
      this.maptable = maptable;
      this.scale = 1;
      this.transX = 0;
      this.transY = 0;

      this.options = options;

      this.jsonWorld = jsonWorld;

      this.node = document.querySelector('#mt-map');
      if (!this.node) {
        this.node = document.createElement('div');
        this.node.setAttribute('class', 'mt-map');
        this.maptable.node.insertBefore(this.node, this.maptable.node.firstChild);
      }

      this.svg = d3.select(this.node).append('svg').attr('viewBox', '0 0 ' + this.getWidth() + ' ' + this.getHeight()).attr('width', this.getWidth()).attr('height', this.getHeight());

      // Resize parent div
      d3.select(this.node).attr('style', 'height:' + this.getHeight() + 'px');

      this.projection = d3.geo.equirectangular().translate([this.getWidth() / 2, this.getHeight() / (2 * this.options.scaleHeight)]).scale(this.getWidth() / 640 * 100).rotate([-12, 0]).precision(0.1);

      // Add coordinates to rawData
      this.maptable.rawData.forEach(function (d) {
        d.longitude = parseFloat(d[that.options.longitudeKey]);
        d.latitude = parseFloat(d[that.options.latitudeKey]);
        var coord = that.projection([d.longitude, d.latitude]);
        d.x = coord[0];
        d.y = coord[1];
        return d;
      });

      this.zoomListener = d3.behavior.zoom().scaleExtent(this.options.scaleZoom).on('zoom', this.rescale.bind(this));

      // Attach Zoom event to map
      if (this.options.zoom) {
        this.svg = this.svg.call(this.zoomListener.bind(this));
      }

      // Add Watermark
      if (this.options.watermark) {
        this.watermark = new Legend$1(this, this.options.watermark);
      }

      // Add Title
      if (this.options.title) {
        this.title = this.buildTitle();
      }

      // Add tooltip
      this.tooltipNode = d3.select(this.node).append('div').attr('class', 'mt-map-tooltip ' + this.options.tooltipClass).style('display', 'none');

      this.layerGlobal = this.svg.append('g').attr('class', 'mt-map-global');
      this.layerCountries = this.layerGlobal.append('g').attr('class', 'mt-map-countries');
      this.layerMarkers = this.layerGlobal.append('g').attr('class', 'mt-map-markers');
      this.loadGeometries();
    }

    babelHelpers.createClass(GeoMap, [{
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
        var dataGeometries = topojson.feature(this.jsonWorld, this.jsonWorld.objects.countries).features;

        // If we have data concerning that affect countries
        var dataCountries = [];
        var dataCountriesAssoc = {};
        if (this.options.countries.groupBy) {
          dataCountries = d3.nest().key(this.options.countries.groupBy).entries(this.maptable.data);

          dataCountriesAssoc = {};
          dataCountries.forEach(function (val) {
            dataCountriesAssoc[val.key] = dataCountries.values;
          });
        }
        // Put dataCountries into dataGeometries if available
        for (var i = 0; i < dataGeometries.length; i++) {
          dataGeometries[i].key = dataGeometries[i].id;
          dataGeometries[i].values = [];
        }

        // Create countries
        this.layerCountries.selectAll('.mt-map-country').data(dataGeometries).enter().insert('path').attr('class', 'mt-map-country').attr('d', d3.geo.path().projection(this.projection));

        if (this.options.legend) {
          this.legendObject = new Legend(this);
        }
        // Countries
        this.updateCountries();

        // Markers
        this.updateMarkers();
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
        var deltaMarker = 20;

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
        var _this = this;

        var self = this;
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

        // Rescale attributes
        if (this.markers) {
          // markers
          d3.selectAll('.mt-map-marker').each(function (d) {
            // stroke
            if (d.prop['stroke-width']) {
              d3.select(this).attr('stroke-width', d.prop['stroke-width'] / self.scaleAttributes());
            }
            // radius
            if (d.prop.r) {
              d3.select(this).attr('r', d.prop.r / self.scaleAttributes());
            }
          });
          // countries
          d3.selectAll('.mt-map-country').each(function (d) {
            // stroke
            if (d.prop['stroke-width']) {
              d3.select(_this).attr('stroke-width', d.prop['stroke-width'] / self.scale_attributes());
            }
          });
        }
      }
    }, {
      key: 'getScaledValue',
      value: function getScaledValue(obj, key, datum, data) {
        if (!obj.rollup) {
          if (babelHelpers.typeof(obj.attr[key]) === 'object') {
            throw new Error('No rollup and property is an object: ' + key);
          }
          return obj.attr[key];
        }
        if (obj.attr[key] instanceof Array) {
          var domain = d3.extent(data, function (d) {
            return obj.rollup(d.values);
          });

          // We copy the variable instead of reference
          var range = obj.attr[key].slice(0);

          if (obj.attr[key][0] === 'min') {
            range[0] = domain[0];
          }
          if (obj.attr[key][1] === 'max') {
            range[1] = domain[1];
          }

          if (range.length === 3) {
            if (typeof range[2] === 'function') {
              range[0] = range[2](range[0]);
              range[1] = range[2](range[1]);
            } else if (typeof range[2] === 'number') {
              range[0] = range[0] * range[2];
              range[1] = range[1] * range[2];
            }
            range.pop();
          }
          // Dynamic value
          var scale = d3.scale.linear().domain(domain).range(range);

          var filteredData = data.filter(function (d) {
            return d.key === datum.key;
          });

          if (!filteredData.length) {
            if (obj.attrEmpty && obj.attrEmpty[key]) {
              datum.value = 0;
              return obj.attrEmpty[key];
            }
            throw new Error('attrEmpty[' + key + '] not found');
          }
          datum.value = obj.rollup(filteredData[0].values);
          return scale(datum.value);
        }
        if (typeof obj.attr[key] === 'number' || typeof obj.attr[key] === 'string') {
          // Static value
          return obj.attr[key];
        }
        throw new Error('Invalid value for ' + key);
      }
    }, {
      key: 'updateMarkers',
      value: function updateMarkers() {
        var _this2 = this;

        var defaultGroupBy = function defaultGroupBy(a) {
          return a.longitude + ',' + a.latitude;
        };
        var dataMarkers = d3.nest().key(this.options.markers.groupBy ? this.options.markers.groupBy : defaultGroupBy).entries(this.maptable.data).filter(function (d) {
          return d.values[0].latitude !== 0;
        });

        var markerItem = this.layerMarkers.selectAll('.mt-map-marker').data(dataMarkers);

        // Exit
        markerItem.exit().transition().attr('r', 0).attr('fill', '#eee').style('opacity', 0).remove();

        // Enter
        var markerObject = markerItem.enter();
        if (this.options.markers.customMarker) {
          markerObject = this.options.markers.customMarker(markerObject);
        } else {
          markerObject = markerObject.append('svg:circle');
        }
        var markerClassName = this.options.markers.className ? this.options.markers.className : '';

        markerObject.attr('class', 'mt-map-marker ' + markerClassName);

        var attrX = this.options.markers.attrX ? this.options.markers.attrX : 'cx';
        var attrY = this.options.markers.attrY ? this.options.markers.attrY : 'cy';

        var attrXDelta = this.options.markers.attrXDelta ? this.options.markers.attrXDelta : 0;
        var attrYDelta = this.options.markers.attrYDelta ? this.options.markers.attrYDelta : 0;

        // Update
        var markerUpdate = markerItem.attr(attrX, function (d) {
          return d.values[0].x + attrXDelta;
        }).attr(attrY, function (d) {
          return d.values[0].y + attrYDelta;
        });

        if (this.options.markers.attr) {
          Object.keys(this.options.markers.attr).forEach(function (key) {
            markerUpdate = markerUpdate.attr(key, function (datum) {
              if (!datum.prop) datum.prop = {};
              datum.prop[key] = _this2.getScaledValue(_this2.options.markers, key, datum, dataMarkers);
              return datum.prop[key];
            });
          });
        }

        if (this.options.markers.tooltip) {
          this.activateTooltip(markerUpdate, this.options.markers.tooltip);
        }
      }
    }, {
      key: 'updateCountries',
      value: function updateCountries() {
        var _this3 = this;

        var self = this;
        if (this.options.countries.attr) {
          (function () {
            var dataCountries = [];
            var dataCountriesAssoc = {};
            if (_this3.options.countries.groupBy) {
              dataCountries = d3.nest().key(_this3.options.countries.groupBy).entries(_this3.maptable.data);
              for (var i = 0; i < dataCountries.length; i++) {
                dataCountriesAssoc[dataCountries[i].key] = dataCountries[i].values;
              }
            }

            if (_this3.legendObject) {
              var domain = d3.extent(dataCountries, function (d) {
                return _this3.options.countries.rollup(d.values);
              });
              _this3.legendObject.updateExtents(domain);
            }

            var countryItem = d3.selectAll('.mt-map-country').each(function (datum) {
              var _this4 = this;

              Object.keys(self.options.countries.attr).forEach(function (key) {
                d3.select(_this4).attr(key, function () {
                  if (!datum.prop) datum.prop = {};
                  datum.prop[key] = self.getScaledValue(self.options.countries, key, datum, dataCountries);
                  return datum.prop[key];
                });
              });
            });

            if (_this3.legendObject) {
              countryItem.on('mouseover', function (datum) {
                return _this3.legendObject.indiceChange(datum.value);
              }).on('mouseout', function () {
                return _this3.legendObject.indiceChange(NaN);
              });
            }

            if (_this3.options.countries.tooltip) {
              _this3.activateTooltip(countryItem, _this3.options.countries.tooltip);
            }
          })();
        }
      }
    }, {
      key: 'activateTooltip',
      value: function activateTooltip(target, tooltipContent, cb) {
        var _this5 = this;

        target.on('mousemove', function (d) {
          var mousePosition = d3.mouse(_this5.svg.node()).map(function (v) {
            return parseInt(v, 10);
          });
          _this5.tooltipNode.attr('style', 'display:block;').html(tooltipContent(d));
          var tooltipDelta = _this5.tooltipNode.node().offsetWidth / 2;
          var mouseLeft = mousePosition[0] - tooltipDelta + document.getElementById('mt-map').offsetLeft;
          var mouseTop = mousePosition[1] + 10 + document.getElementById('mt-map').offsetTop;
          _this5.tooltipNode.attr('style', 'top:' + mouseTop + 'px;left:' + mouseLeft + 'px;display:block;').on('mouseout', function () {
            return _this5.tooltipNode.style('display', 'none');
          });

          if (cb) {
            _this5.tooltipNode.on('click', cb);
          }
        });
      }
    }]);
    return GeoMap;
  }();

  var Filters = function () {
    function Filters(maptable) {
      babelHelpers.classCallCheck(this, Filters);

      this.maptable = maptable;
      this.criteria = [];

      this.container = document.createElement('div');
      this.maptable.node.appendChild(this.container);

      this.node = document.querySelector('#mt-filters');
      if (!this.node) {
        this.node = document.createElement('div');
        this.node.setAttribute('class', 'mt-filters');
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

    babelHelpers.createClass(Filters, [{
      key: 'add',
      value: function add() {
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
        if (this.container.style.display === 'none') {
          this.toggle();
        }
      }
    }, {
      key: 'remove',
      value: function remove(filterName) {
        var rowNode = document.querySelector('[data-mt-filter-name="' + filterName + '"]');
        rowNode.remove();
        var filterIndex = this.criteria.indexOf(filterName);
        this.criteria.splice(filterIndex, 1);
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

        var filtersChildren = this.container.childNodes;

        for (var i = 0; i < filtersChildren.length; i++) {
          var element = filtersChildren[i];
          var filterName = element.querySelector('.mt-filter-name').value;

          var filterOptions = this.maptable.columnDetails[filterName];

          var line = '';

          if (filterOptions.type === 'number' || filterOptions.type === 'custom') {
            var filterRangeSelect = element.querySelector('.mt-filter-range');
            if (filterRangeSelect.value !== 'any') {
              if (filterRangeSelect.value === 'BETWEEN') {
                var filterValueMin = element.querySelector('.mt-filter-value-min').value;
                var filterValueMax = element.querySelector('.mt-filter-value-max').value;
                if (filterValueMin === '' || filterValueMax === '') continue;
                line += filterOptions.title + ' is between ';
                line += '<tspan font-weight="bold">' + filterValueMin + '</tspan> and\n              <tspan font-weight="bold">' + filterValueMax + '</tspan>';
              } else {
                var filterValue = element.querySelector('.mt-filter-value').value;
                if (filterValue === '') continue;
                line += filterOptions.title + ' is ';
                line += filterRangeSelect.options[filterRangeSelect.selectedIndex].text;
                line += '<tspan font-weight="bold">' + filterValue + '</tspan>';
              }
            }
          } else if (filterOptions.type === 'field' || filterOptions.type === 'dropdown') {
            var _filterValue = element.querySelector('.mt-filter-value').value;
            if (_filterValue === '') continue;
            var separatorWord = filterOptions.type === 'field' ? 'contains' : 'is';
            line += filterOptions.title + ' ' + separatorWord + '\n          <tspan font-weight="bold">' + _filterValue + '</tspan>';
          }
          outputArray.push(line);
        }
        return outputArray.join(', ');
      }
    }, {
      key: 'buildRow',
      value: function buildRow(filterName) {
        var _this = this;

        var self = this;

        var possibleFilters = this.getPossibleFilters();

        var filterOptions = this.maptable.columnDetails[filterName];

        var rowNode = document.createElement('div');
        rowNode.setAttribute('class', 'mt-filter-row');
        rowNode.setAttribute('data-mt-filter-name', filterName);

        // Button to remove filter
        var minusButton = document.createElement('button');
        minusButton.setAttribute('class', 'btn btn-default pull-right');
        minusButton.setAttribute('data-mt-filter-btn-minus', null);
        minusButton.innerText = '– Remove this filter';
        minusButton.addEventListener('click', function () {
          filterName = rowNode.querySelector('.mt-filters-dropdown').value;
          _this.remove(filterName);
        });
        rowNode.appendChild(minusButton);

        // Filters separator "AND"
        var filterSeparator = document.createElement('span');
        filterSeparator.setAttribute('class', 'mt-filter-and');
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
          self.create(newFilterName, this.parentNode);
          self.remove(oldFilterName);
          self.refresh();
        });
        rowNode.appendChild(filterNameSelect);

        // Filter verb
        var filterVerb = document.createElement('span');
        filterVerb.innerText = filterOptions.type === 'field' ? ' contains ' : ' is ';
        rowNode.appendChild(filterVerb);

        // Filter range
        var filterRange = null;
        if (filterOptions.type !== 'field' && filterOptions.type !== 'dropdown') {
          filterRange = document.createElement('select');
          filterRange.setAttribute('class', 'mt-filter-range form-control form-control-inline');
          utils.appendOptions(filterRange, ['any', '=', '≠', '<', '>', '≤', '≥', 'BETWEEN'].map(function (v) {
            return { text: v, value: v };
          }));
          filterRange.addEventListener('change', function () {
            self.handleRangeChange(this);
          });
          rowNode.appendChild(filterRange);

          // Little space:
          rowNode.appendChild(document.createTextNode(' '));
        }

        // Filter value
        var filterValue = document.createElement('div');
        filterValue.style.display = 'inline-block';
        filterValue.setAttribute('class', 'mt-filters-value');

        if (filterOptions.type === 'number' || filterOptions.type === 'custom') {
          ['min', 'max'].forEach(function (val, i) {
            var filterInput = document.createElement('input');
            filterInput.setAttribute('class', 'form-control form-control-inline mt-filter-value-' + val);
            if (filterOptions.type) {
              filterInput.setAttribute('type', filterOptions.type);
            } else {
              filterInput.setAttribute('type', 'text');
            }
            filterInput.addEventListener('keyup', _this.refresh.bind(_this));
            filterInput.addEventListener('change', _this.refresh.bind(_this));
            filterValue.appendChild(filterInput);
            if (i === 0) {
              // AND
              var filterValueAnd = document.createElement('span');
              filterValueAnd.setAttribute('class', 'mt-filter-value-and');
              filterValueAnd.innerText = ' and ';
              filterValue.appendChild(filterValueAnd);
            }
          });
        } else if (filterOptions.type === 'field') {
          var filterInput = document.createElement('input');
          filterInput.setAttribute('class', 'form-control form-control-inline mt-filter-value');
          filterInput.setAttribute('type', 'text');
          filterInput.addEventListener('keyup', this.refresh.bind(this));
          filterInput.addEventListener('change', this.refresh.bind(this));
          filterValue.appendChild(filterInput);
        } else if (filterOptions.type === 'dropdown') {
          var filterSelect = document.createElement('select');
          filterSelect.setAttribute('class', 'form-control form-control-inline mt-filter-value');

          var uniqueValues = d3.nest().key(function (d) {
            return d[filterName];
          }).sortKeys(d3.ascending).entries(this.maptable.rawData);

          // TODO map uniqueValues
          utils.appendOptions(filterSelect, [{ text: 'Any', value: '' }].concat(uniqueValues));

          filterSelect.addEventListener('change', this.refresh.bind(this));
          filterValue.appendChild(filterSelect);
        }

        rowNode.appendChild(filterValue);

        // We trigger it here to handle the value of the filter range
        if (filterRange) {
          this.changeRange(filterRange);
        }

        return rowNode;
      }
    }, {
      key: 'changeRange',
      value: function changeRange(filterRange) {
        var rowNode = filterRange.parentNode;
        if (filterRange.value === 'any') {
          rowNode.querySelector('.mt-filter-value').style.display = 'none';
        } else {
          rowNode.querySelector('.mt-filter-value').style.display = 'inline-block';
          if (filterRange.value === 'BETWEEN') {
            rowNode.querySelector('.mt-filter-value-min').style.display = 'inline-block';
            rowNode.querySelector('.mt-mt-filter-value-max').style.display = 'inline-block';
          } else {
            rowNode.querySelector('.mt-filters-value-max').style.display = 'none';
            rowNode.querySelector('.mt-filters-value-and').style.display = 'none';
          }
        }
      }
    }, {
      key: 'getPossibleFilters',
      value: function getPossibleFilters(except) {
        var _this2 = this;

        return Object.keys(this.maptable.columnDetails).map(function (k) {
          return Object.assign({ key: k }, _this2.maptable.columnDetails[k]);
        }).filter(function (v) {
          return except && except === v.key || _this2.criteria.indexOf(v.key) === -1 && v.type && v.type !== 'virtual';
        });
      }
    }, {
      key: 'filterData',
      value: function filterData() {
        var _this3 = this;

        this.data = this.maptable.rawData.filter(function (d) {
          var rowNodes = document.querySelectorAll('.mt-filters-row');
          for (var i = 0; i < rowNodes.length; i++) {
            var rowNode = rowNodes[i];
            var filterName = rowNode.getAttribute('data-mt-filter-name');
            var filterOptions = _this3.maptable.columnDetails[filterName];
            var fmt = filterOptions.dataFormat; // shortcut

            if (filterOptions.type === 'dropdown') {
              var filterValue = rowNode.querySelector('.mt-filters-value').value;
              if (filterValue === '') continue;
              if (d[filterName] !== filterValue) return false;
            } else if (filterOptions.type === 'field') {
              var _filterValue2 = rowNode.querySelector('.mt-filters-value').value;
              if (_filterValue2 === '') continue;
              return d[filterName].toLowerCase().indexOf(_filterValue2.toLowerCase()) !== -1;
            } else if (filterOptions.type === 'number' || filterOptions.type === 'custom') {
              var filterRange = rowNode.querySelector('.mt-filter-range').value;
              if (filterRange === 'BETWEEN') {
                var filterValueMin = rowNode.querySelector('.mt-filter-value-min').value;
                var filterValueMax = rowNode.querySelector('.mt-filters-value-max').value;
                if (filterValueMin === '' || filterValueMax === '') continue;

                if (filterOptions.type === 'custom' && fmt) {
                  if (fmt) {
                    if (fmt(d[filterName]) < fmt(filterValueMin) || fmt(d[filterName]) > fmt(filterValueMax)) {
                      return false;
                    }
                  }
                } else {
                  if (parseInt(d[filterName], 10) < parseInt(filterValueMin, 10) || parseInt(d[filterName], 10) > parseInt(filterValueMax, 10)) {
                    return false;
                  }
                }
              } else {
                var _filterValue3 = rowNode.querySelector('.mt-filters-value').value;
                if (_filterValue3 === '') continue;
                if (filterOptions.type === 'custom' && fmt) {
                  if (!utils.rangeToBool(fmt(d[filterName]), filterRange, fmt(_filterValue3))) {
                    return false;
                  }
                } else {
                  if (!utils.rangeToBool(d[filterName], filterRange, _filterValue3)) {
                    return false;
                  }
                }
              }
            }
          }
          return true;
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
        document.getElementById('mt-filters-new').disabled = disableNewFilter;

        var minusButtons = document.querySelectorAll('[data-mt-filter-btn-minus]');
        for (var _i = 0; _i < minusButtons.length; _i++) {
          minusButtons[_i].disabled = disableNewFilter;
        }
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

      babelHelpers.classCallCheck(this, Table);

      this.maptable = maptable;
      this.options = options;
      this.currentSorting = { key: null, mode: 'asc' };

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
        return Object.assign({ key: k }, _this.maptable.columnDetails[k]);
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

      this.render();
      if (this.options.defaultSorting) {
        this.sortColumn(this.options.defaultSorting.key, this.options.defaultSorting.mode);
      }
    }

    babelHelpers.createClass(Table, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var that = this;
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
          that.activeColumns.forEach(function (columnKey) {
            var column = that.maptable.columnDetails[columnKey];
            tds += '<td';
            if (column.nowrap) {
              tds += ' style="white-space:nowrap;"';
            }
            tds += '>';

            if (!(that.options.collapseRowsBy.indexOf(columnKey) !== -1 && uniqueCollapsedRows[columnKey] && uniqueCollapsedRows[columnKey] === row[columnKey])) {
              if (typeof column.cellContent === 'function') {
                tds += column.cellContent(row);
              } else {
                if (row[columnKey] && row[columnKey] !== 'null') tds += row[columnKey];
              }
              if (that.options.collapseRowsBy.indexOf(columnKey) !== -1) {
                uniqueCollapsedRows[columnKey] = row[columnKey];
              }
              tds += '</td>';
            }
          });
          return tds;
        });
      }
    }, {
      key: 'applySort',
      value: function applySort() {
        var _this3 = this;

        var d3SortMode = this.currentSorting.mode === 'asc' ? d3.ascending : d3.descending;
        var filterOptions = this.maptable.columnDetails[this.currentSorting.key];
        this.maptable.rawData = this.maptable.rawData.sort(function (a, b) {
          var el1 = a[_this3.currentSorting.key];
          var el2 = b[_this3.currentSorting.key];
          if (filterOptions.type === 'virtual' && filterOptions.cellContent) {
            el2 = filterOptions.cellContent(a);
            el2 = filterOptions.cellContent(b);
          } else if (filterOptions.type === 'number') {
            el1 = parseInt(el1, 10);
            el2 = parseInt(el2, 10);
          } else if (filterOptions.dataFormat) {
            el1 = filterOptions.dataFormat(el1);
            el2 = filterOptions.dataFormat(el2);
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
        } else if (columnMode) {
          this.currentSorting.mode = columnMode;
        } else {
          this.currentSorting.mode = 'asc';
        }

        var sortableColums = document.getElementsByClassName('mt-table-sortable');
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
      babelHelpers.classCallCheck(this, MapTable);

      this.options = options;

      this.node = document.querySelector(target);

      if (this.options.data.type === 'json') {
        d3.json(this.options.data.path, this.loadData.bind(this));
      } else if (this.options.data.type === 'csv') {
        d3.csv(this.options.data.path, this.loadData.bind(this));
      } else if (this.options.data.type === 'tsv') {
        d3.tsv(this.options.data.path, this.loadData.bind(this));
      }
    }

    babelHelpers.createClass(MapTable, [{
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
          d3.json(this.options.map.path, function (errGeoMap, jsonWorld) {
            if (errGeoMap) {
              throw errGeoMap;
            }
            _this.map = new GeoMap(_this, _this.options.map, jsonWorld);
          });
        }

        // Filters
        if (this.options.filters) {
          this.filters = new Filters(this);
        }

        // Table
        if (this.options.table) {
          this.table = new Table(this, this.options.table);
        }
      }
    }, {
      key: 'setColumnDetails',
      value: function setColumnDetails() {
        var _this2 = this;

        if (this.rawData.length === 0) {
          return;
        }
        var defaultColumns = {};

        Object.keys(this.rawData[0]).forEach(function (k) {
          var columnType = 'field';
          if (typeof _this2.rawData[0][k] === 'number') {
            columnType = 'number';
          }
          defaultColumns[k] = {
            title: k,
            type: columnType
          };
        });
        this.columnDetails = utils.extendRecursive(defaultColumns, this.options.columns);
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

    maptable.map = function (mapOptions) {
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

    maptable.table = function (tableOptions) {
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