this.d3 = this.d3 || {};
this.d3.maptable = (function () {
    'use strict';

    var babelHelpers = {};
    babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
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

    /* eslint no-loop-func: 0 */
    function extendRecursive() {
      var dst = {};
      var src = void 0;
      var args = [].splice.call(arguments, 0);
      var toString = {}.toString;

      while (args.length > 0) {
        src = args.splice(0, 1)[0];
        if (toString.call(src) === '[object Object]') {
          Object.keys(src).forEach(function (p) {
            if (toString.call(src[p]) === '[object Object]') {
              dst[p] = extendRecursive(dst[p] || {}, src[p]);
            } else {
              dst[p] = src[p];
            }
          });
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

    function toNumber(str) {
      if (!str || str === '') return null;
      return Number(str.toString().replace(/[^0-9.]+|\s+/gmi, ''));
    }

    function quantile(array, percentile) {
      array.sort(function (a, b) {
        return a - b;
      });
      var index = percentile / 100.0 * (array.length - 1);
      var result = void 0;
      if (Math.floor(index) === index) {
        result = array[index];
      } else {
        var i = Math.floor(index);
        var fraction = index - i;
        result = array[i] + (array[i + 1] - array[i]) * fraction;
      }
      return result;
    }

    function uniqueValues(arr) {
      if (!arr) return arr;
      var a = [];
      for (var i = 0, l = arr.length; i < l; i += 1) {
        if (a.indexOf(arr[i]) === -1 && arr[i] !== '') {
          a.push(arr[i]);
        }
      }
      return a;
    }

    var utils = {
      rangeToBool: rangeToBool,
      appendOptions: appendOptions,
      extendRecursive: extendRecursive,
      sanitizeKey: sanitizeKey,
      toNumber: toNumber,
      keyToTile: keyToTile,
      quantile: quantile,
      uniqueValues: uniqueValues
    };

    var defaultOptions = {
      map: {
        longitudeKey: 'longitude',
        latitudeKey: 'latitude',
        countryIdentifierKey: 'country_code',
        countryIdentifierType: 'iso_a2',
        zoom: true,
        saveState: true,
        exportSvg: null,
        exportSvgClient: false,
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
        heatmap: {
          mask: true,
          weightByAttribute: null,
          weightByAttributeScale: 'linear',
          circles: {
            min: 1,
            max: 90,
            step: 4,
            color: '#FF0000',
            colorStrength: 1,
            blur: 4.0
          },
          borders: {
            stroke: 1,
            opacity: 0.1,
            color: '#000'
          }
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
      filters: {
        saveState: true
      },
      table: {
        className: 'table table-striped table-bordered',
        collapseRowsBy: []
      }
    };

    var Legend = function () {
      function Legend(map) {
        babelHelpers.classCallCheck(this, Legend);

        this.legendWidth = 220;
        this.map = map;
        // Create Legend
        this.node = this.map.svg.append('g').attr('id', 'mt-map-legend').attr('transform', 'translate(' + (this.map.getWidth() - 350) + ', ' + (this.map.getHeight() - 60) + ')');

        this.buildIndice();
      }

      babelHelpers.createClass(Legend, [{
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
          this.node.select('#mt-map-legend').style('opacity', domain[0] === domain[1] ? 0 : 1);
          if (this.node.selectAll('mt-map-legend-min').length) {
            this.node.select('#mt-map-legend-min').text(Math.round(domain[0]));
            this.node.select('#mt-map-legend-max').text(Math.round(domain[1]));

            // pass in the min and max (domain) to the legend
            this.buildScale(domain);
          }
        }
      }, {
        key: 'indiceChange',
        value: function indiceChange(val) {
          if (Number.isNaN(val)) {
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
        if (Number.isNaN(this.width)) {
          console.warn('Watermak width not found');
          return;
        }
        if (Number.isNaN(this.height)) {
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

    /* eslint-disable */

    /*
        StackBlur - a fast almost Gaussian Blur For Canvas
        Version:     0.5
        Author:        Mario Klingemann
        Contact:     mario@quasimondo.com
        Website:    http://www.quasimondo.com/StackBlurForCanvas
        Twitter:    @quasimondo
        In case you find this class useful - especially in commercial projects -
        I am not totally unhappy for a small donation to my PayPal account
        mario@quasimondo.de
        Or support me on flattr:
        https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript
        Copyright (c) 2010 Mario Klingemann
        Permission is hereby granted, free of charge, to any person
        obtaining a copy of this software and associated documentation
        files (the "Software"), to deal in the Software without
        restriction, including without limitation the rights to use,
        copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the
        Software is furnished to do so, subject to the following
        conditions:
        The above copyright notice and this permission notice shall be
        included in all copies or substantial portions of the Software.
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
        EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
        OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
        NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
        HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
        WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
        FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
        OTHER DEALINGS IN THE SOFTWARE.
        */

    var mul_table = [512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];

    var shg_table = [9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];

    function processImage(img, canvas, radius, blurAlphaChannel) {
        if (typeof img == 'string') {
            var img = document.getElementById(img);
        } else if (typeof HTMLImageElement !== 'undefined' && !img instanceof HTMLImageElement) {
            return;
        }
        var w = img.naturalWidth;
        var h = img.naturalHeight;

        if (typeof canvas == 'string') {
            var canvas = document.getElementById(canvas);
        } else if (typeof HTMLCanvasElement !== 'undefined' && !canvas instanceof HTMLCanvasElement) {
            return;
        }

        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = w;
        canvas.height = h;

        var context = canvas.getContext('2d');
        context.clearRect(0, 0, w, h);
        context.drawImage(img, 0, 0);

        if (Number.isNaN(radius) || radius < 1) return;

        if (blurAlphaChannel) processCanvasRGBA(canvas, 0, 0, w, h, radius);else processCanvasRGB(canvas, 0, 0, w, h, radius);
    }

    function getImageDataFromCanvas(canvas, top_x, top_y, width, height) {
        if (typeof canvas == 'string') var canvas = document.getElementById(canvas);else if (typeof HTMLCanvasElement !== 'undefined' && !canvas instanceof HTMLCanvasElement) return;

        var context = canvas.getContext('2d');
        var imageData;

        try {
            try {
                imageData = context.getImageData(top_x, top_y, width, height);
            } catch (e) {
                throw new Error("unable to access local image data: " + e);
                return;
            }
        } catch (e) {
            throw new Error("unable to access image data: " + e);
        }

        return imageData;
    }

    function processCanvasRGBA(canvas, top_x, top_y, width, height, radius) {
        if (Number.isNaN(radius) || radius < 1) return;
        radius |= 0;

        var imageData = getImageDataFromCanvas(canvas, top_x, top_y, width, height);

        imageData = processImageDataRGBA(imageData, top_x, top_y, width, height, radius);

        canvas.getContext('2d').putImageData(imageData, top_x, top_y);
    }

    function processImageDataRGBA(imageData, top_x, top_y, width, height, radius) {
        var pixels = imageData.data;

        var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, r_out_sum, g_out_sum, b_out_sum, a_out_sum, r_in_sum, g_in_sum, b_in_sum, a_in_sum, pr, pg, pb, pa, rbs;

        var div = radius + radius + 1;
        var w4 = width << 2;
        var widthMinus1 = width - 1;
        var heightMinus1 = height - 1;
        var radiusPlus1 = radius + 1;
        var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

        var stackStart = new BlurStack();
        var stack = stackStart;
        for (i = 1; i < div; i++) {
            stack = stack.next = new BlurStack();
            if (i == radiusPlus1) var stackEnd = stack;
        }
        stack.next = stackStart;
        var stackIn = null;
        var stackOut = null;

        yw = yi = 0;

        var mul_sum = mul_table[radius];
        var shg_sum = shg_table[radius];

        for (y = 0; y < height; y++) {
            r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

            r_out_sum = radiusPlus1 * (pr = pixels[yi]);
            g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
            b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
            a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);

            r_sum += sumFactor * pr;
            g_sum += sumFactor * pg;
            b_sum += sumFactor * pb;
            a_sum += sumFactor * pa;

            stack = stackStart;

            for (i = 0; i < radiusPlus1; i++) {
                stack.r = pr;
                stack.g = pg;
                stack.b = pb;
                stack.a = pa;
                stack = stack.next;
            }

            for (i = 1; i < radiusPlus1; i++) {
                p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
                r_sum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
                g_sum += (stack.g = pg = pixels[p + 1]) * rbs;
                b_sum += (stack.b = pb = pixels[p + 2]) * rbs;
                a_sum += (stack.a = pa = pixels[p + 3]) * rbs;

                r_in_sum += pr;
                g_in_sum += pg;
                b_in_sum += pb;
                a_in_sum += pa;

                stack = stack.next;
            }

            stackIn = stackStart;
            stackOut = stackEnd;
            for (x = 0; x < width; x++) {
                pixels[yi + 3] = pa = a_sum * mul_sum >> shg_sum;
                if (pa != 0) {
                    pa = 255 / pa;
                    pixels[yi] = (r_sum * mul_sum >> shg_sum) * pa;
                    pixels[yi + 1] = (g_sum * mul_sum >> shg_sum) * pa;
                    pixels[yi + 2] = (b_sum * mul_sum >> shg_sum) * pa;
                } else {
                    pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
                }

                r_sum -= r_out_sum;
                g_sum -= g_out_sum;
                b_sum -= b_out_sum;
                a_sum -= a_out_sum;

                r_out_sum -= stackIn.r;
                g_out_sum -= stackIn.g;
                b_out_sum -= stackIn.b;
                a_out_sum -= stackIn.a;

                p = yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1) << 2;

                r_in_sum += stackIn.r = pixels[p];
                g_in_sum += stackIn.g = pixels[p + 1];
                b_in_sum += stackIn.b = pixels[p + 2];
                a_in_sum += stackIn.a = pixels[p + 3];

                r_sum += r_in_sum;
                g_sum += g_in_sum;
                b_sum += b_in_sum;
                a_sum += a_in_sum;

                stackIn = stackIn.next;

                r_out_sum += pr = stackOut.r;
                g_out_sum += pg = stackOut.g;
                b_out_sum += pb = stackOut.b;
                a_out_sum += pa = stackOut.a;

                r_in_sum -= pr;
                g_in_sum -= pg;
                b_in_sum -= pb;
                a_in_sum -= pa;

                stackOut = stackOut.next;

                yi += 4;
            }
            yw += width;
        }

        for (x = 0; x < width; x++) {
            g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

            yi = x << 2;
            r_out_sum = radiusPlus1 * (pr = pixels[yi]);
            g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
            b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
            a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);

            r_sum += sumFactor * pr;
            g_sum += sumFactor * pg;
            b_sum += sumFactor * pb;
            a_sum += sumFactor * pa;

            stack = stackStart;

            for (i = 0; i < radiusPlus1; i++) {
                stack.r = pr;
                stack.g = pg;
                stack.b = pb;
                stack.a = pa;
                stack = stack.next;
            }

            yp = width;

            for (i = 1; i <= radius; i++) {
                yi = yp + x << 2;

                r_sum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
                g_sum += (stack.g = pg = pixels[yi + 1]) * rbs;
                b_sum += (stack.b = pb = pixels[yi + 2]) * rbs;
                a_sum += (stack.a = pa = pixels[yi + 3]) * rbs;

                r_in_sum += pr;
                g_in_sum += pg;
                b_in_sum += pb;
                a_in_sum += pa;

                stack = stack.next;

                if (i < heightMinus1) {
                    yp += width;
                }
            }

            yi = x;
            stackIn = stackStart;
            stackOut = stackEnd;
            for (y = 0; y < height; y++) {
                p = yi << 2;
                pixels[p + 3] = pa = a_sum * mul_sum >> shg_sum;
                if (pa > 0) {
                    pa = 255 / pa;
                    pixels[p] = (r_sum * mul_sum >> shg_sum) * pa;
                    pixels[p + 1] = (g_sum * mul_sum >> shg_sum) * pa;
                    pixels[p + 2] = (b_sum * mul_sum >> shg_sum) * pa;
                } else {
                    pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
                }

                r_sum -= r_out_sum;
                g_sum -= g_out_sum;
                b_sum -= b_out_sum;
                a_sum -= a_out_sum;

                r_out_sum -= stackIn.r;
                g_out_sum -= stackIn.g;
                b_out_sum -= stackIn.b;
                a_out_sum -= stackIn.a;

                p = x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width << 2;

                r_sum += r_in_sum += stackIn.r = pixels[p];
                g_sum += g_in_sum += stackIn.g = pixels[p + 1];
                b_sum += b_in_sum += stackIn.b = pixels[p + 2];
                a_sum += a_in_sum += stackIn.a = pixels[p + 3];

                stackIn = stackIn.next;

                r_out_sum += pr = stackOut.r;
                g_out_sum += pg = stackOut.g;
                b_out_sum += pb = stackOut.b;
                a_out_sum += pa = stackOut.a;

                r_in_sum -= pr;
                g_in_sum -= pg;
                b_in_sum -= pb;
                a_in_sum -= pa;

                stackOut = stackOut.next;

                yi += width;
            }
        }
        return imageData;
    }

    function processCanvasRGB(canvas, top_x, top_y, width, height, radius) {
        if (Number.isNaN(radius) || radius < 1) return;
        radius |= 0;

        var imageData = getImageDataFromCanvas(canvas, top_x, top_y, width, height);
        imageData = processImageDataRGB(imageData, top_x, top_y, width, height, radius);

        canvas.getContext('2d').putImageData(imageData, top_x, top_y);
    }

    function processImageDataRGB(imageData, top_x, top_y, width, height, radius) {
        var pixels = imageData.data;

        var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, r_out_sum, g_out_sum, b_out_sum, r_in_sum, g_in_sum, b_in_sum, pr, pg, pb, rbs;

        var div = radius + radius + 1;
        var w4 = width << 2;
        var widthMinus1 = width - 1;
        var heightMinus1 = height - 1;
        var radiusPlus1 = radius + 1;
        var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

        var stackStart = new BlurStack();
        var stack = stackStart;
        for (i = 1; i < div; i++) {
            stack = stack.next = new BlurStack();
            if (i == radiusPlus1) var stackEnd = stack;
        }
        stack.next = stackStart;
        var stackIn = null;
        var stackOut = null;

        yw = yi = 0;

        var mul_sum = mul_table[radius];
        var shg_sum = shg_table[radius];

        for (y = 0; y < height; y++) {
            r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;

            r_out_sum = radiusPlus1 * (pr = pixels[yi]);
            g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
            b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);

            r_sum += sumFactor * pr;
            g_sum += sumFactor * pg;
            b_sum += sumFactor * pb;

            stack = stackStart;

            for (i = 0; i < radiusPlus1; i++) {
                stack.r = pr;
                stack.g = pg;
                stack.b = pb;
                stack = stack.next;
            }

            for (i = 1; i < radiusPlus1; i++) {
                p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
                r_sum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
                g_sum += (stack.g = pg = pixels[p + 1]) * rbs;
                b_sum += (stack.b = pb = pixels[p + 2]) * rbs;

                r_in_sum += pr;
                g_in_sum += pg;
                b_in_sum += pb;

                stack = stack.next;
            }

            stackIn = stackStart;
            stackOut = stackEnd;
            for (x = 0; x < width; x++) {
                pixels[yi] = r_sum * mul_sum >> shg_sum;
                pixels[yi + 1] = g_sum * mul_sum >> shg_sum;
                pixels[yi + 2] = b_sum * mul_sum >> shg_sum;

                r_sum -= r_out_sum;
                g_sum -= g_out_sum;
                b_sum -= b_out_sum;

                r_out_sum -= stackIn.r;
                g_out_sum -= stackIn.g;
                b_out_sum -= stackIn.b;

                p = yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1) << 2;

                r_in_sum += stackIn.r = pixels[p];
                g_in_sum += stackIn.g = pixels[p + 1];
                b_in_sum += stackIn.b = pixels[p + 2];

                r_sum += r_in_sum;
                g_sum += g_in_sum;
                b_sum += b_in_sum;

                stackIn = stackIn.next;

                r_out_sum += pr = stackOut.r;
                g_out_sum += pg = stackOut.g;
                b_out_sum += pb = stackOut.b;

                r_in_sum -= pr;
                g_in_sum -= pg;
                b_in_sum -= pb;

                stackOut = stackOut.next;

                yi += 4;
            }
            yw += width;
        }

        for (x = 0; x < width; x++) {
            g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;

            yi = x << 2;
            r_out_sum = radiusPlus1 * (pr = pixels[yi]);
            g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
            b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);

            r_sum += sumFactor * pr;
            g_sum += sumFactor * pg;
            b_sum += sumFactor * pb;

            stack = stackStart;

            for (i = 0; i < radiusPlus1; i++) {
                stack.r = pr;
                stack.g = pg;
                stack.b = pb;
                stack = stack.next;
            }

            yp = width;

            for (i = 1; i <= radius; i++) {
                yi = yp + x << 2;

                r_sum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
                g_sum += (stack.g = pg = pixels[yi + 1]) * rbs;
                b_sum += (stack.b = pb = pixels[yi + 2]) * rbs;

                r_in_sum += pr;
                g_in_sum += pg;
                b_in_sum += pb;

                stack = stack.next;

                if (i < heightMinus1) {
                    yp += width;
                }
            }

            yi = x;
            stackIn = stackStart;
            stackOut = stackEnd;
            for (y = 0; y < height; y++) {
                p = yi << 2;
                pixels[p] = r_sum * mul_sum >> shg_sum;
                pixels[p + 1] = g_sum * mul_sum >> shg_sum;
                pixels[p + 2] = b_sum * mul_sum >> shg_sum;

                r_sum -= r_out_sum;
                g_sum -= g_out_sum;
                b_sum -= b_out_sum;

                r_out_sum -= stackIn.r;
                g_out_sum -= stackIn.g;
                b_out_sum -= stackIn.b;

                p = x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width << 2;

                r_sum += r_in_sum += stackIn.r = pixels[p];
                g_sum += g_in_sum += stackIn.g = pixels[p + 1];
                b_sum += b_in_sum += stackIn.b = pixels[p + 2];

                stackIn = stackIn.next;

                r_out_sum += pr = stackOut.r;
                g_out_sum += pg = stackOut.g;
                b_out_sum += pb = stackOut.b;

                r_in_sum -= pr;
                g_in_sum -= pg;
                b_in_sum -= pb;

                stackOut = stackOut.next;

                yi += width;
            }
        }

        return imageData;
    }

    function BlurStack() {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 0;
        this.next = null;
    }

    var StackBlur = {
        image: processImage,
        canvasRGBA: processCanvasRGBA,
        canvasRGB: processCanvasRGB,
        imageDataRGBA: processImageDataRGBA,
        imageDataRGB: processImageDataRGB
    };

    /**
     * Used the name GeoMap instead of Map to avoid collision with the native Map class of JS
     */

    var GeoMap = function () {
      /**
       * Geo Mapping class constructor that will initiate the map drawing
       * @param maptable: Maptable main Object
       * @param options: options communicated to map
       * @param jsonWorld: Object that contain TopoJSON dataset
       */
      function GeoMap(maptable, options, jsonWorld) {
        var _this = this;

        babelHelpers.classCallCheck(this, GeoMap);

        var self = this;
        this.maptable = maptable;
        this.scale = 1;
        this.transX = 0;
        this.transY = 0;

        this.options = options;

        this.jsonWorld = jsonWorld;

        this.containerSelector = maptable.options.target;
        this.container = document.querySelector(maptable.options.target);

        // Map wrapper
        var mapWrapper = this.container.querySelector('.mt-map-container');

        var existingMap = this.container.querySelector('#mt-map');
        if (existingMap) {
          // transform #mt-map to .mt-map-container'
          mapWrapper.parentNode.insertBefore(mapWrapper, existingMap);
          existingMap.parentNode.removeChild(existingMap);
        }

        // Map
        this.node = document.createElement('div');
        this.node.setAttribute('id', 'mt-map');
        mapWrapper.appendChild(this.node);

        this.svg = d3.select(this.node).append('svg').attr('id', 'mt-map-svg').attr('xmlns', 'http://www.w3.org/2000/svg').attr('xmlns:xlink', 'http://www.w3.org/1999/xlink').attr('viewBox', '0 0 ' + this.getWidth() + ' ' + this.getHeight()).attr('width', this.getWidth()).attr('height', this.getHeight());

        this.projection = d3.geo.equirectangular().translate([this.getWidth() / 2, this.getHeight() / (2 * this.options.scaleHeight)]).scale(this.getWidth() / 640 * 100).rotate([-12, 0]).precision(0.1);

        this.path = d3.geo.path().projection(this.projection);

        // Add coordinates to rawData
        this.maptable.rawData.forEach(function (d) {
          d.longitude = parseFloat(d[self.options.longitudeKey]);
          d.latitude = parseFloat(d[self.options.latitudeKey]);
          var coord = [0, 0];
          if (!Number.isNaN(d.longitude) && !Number.isNaN(d.latitude)) {
            coord = self.projection([d.longitude, d.latitude]);
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
        if (this.options.markers) {
          this.tooltipMarkersNode = d3.select(this.node).append('div').attr('id', 'mt-map-markers-tooltip').attr('class', 'mt-map-tooltip ' + this.options.markers.tooltipClassName).style('display', 'none');
        }

        if (this.options.countries) {
          this.tooltipCountriesNode = d3.select(this.node).append('div').attr('id', 'mt-map-countries-tooltip').attr('class', 'mt-map-tooltip ' + this.options.countries.tooltipClassName).style('display', 'none');
        }

        this.layerGlobal = this.svg.append('g').attr('class', 'mt-map-global');
        this.layerCountries = this.layerGlobal.append('g').attr('class', 'mt-map-countries');
        this.layerHeatmap = this.layerGlobal.append('g').attr('class', 'mt-map-heatmap');
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
        if (this.options.exportSvgClient || this.options.exportSvg) {
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

        // render is triggered by MapTable
        // this.render();
      }

      babelHelpers.createClass(GeoMap, [{
        key: 'scaleAttributes',
        value: function scaleAttributes() {
          return Math.pow(this.scale, 2 / 3); // eslint-disable-line
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

        /**
         * Load geometries and built the map components
         */

      }, {
        key: 'loadGeometries',
        value: function loadGeometries() {
          // We filter world data
          if (this.options.filterCountries) {
            this.jsonWorld.objects.countries.geometries = this.jsonWorld.objects.countries.geometries.filter(this.options.filterCountries);
          }

          // Build countries
          if (this.options.countries) this.buildCountries();

          // Build heatmap
          if (this.options.heatmap) this.buildHeatmap();
        }

        /**
         * Logic to build the heatmap elements (without the filling the heatmap image)
         */

      }, {
        key: 'buildHeatmap',
        value: function buildHeatmap() {
          // Build vectors
          var lands = topojson.merge(this.jsonWorld, this.jsonWorld.objects.countries.geometries);
          if (!this.options.heatmap.disableMask) {
            this.maskHeatmap = this.layerHeatmap.append('defs').append('clipPath').attr('id', 'mt-map-heatmap-mask');

            this.maskHeatmap.datum(lands).append('path').attr('class', 'mt-map-heatmap-mask-paths').attr('d', this.path);
          }

          this.imgHeatmap = this.layerHeatmap.append('image').attr('width', this.getWidth()).attr('height', this.getHeight()).attr('x', 0).attr('y', 0).attr('class', 'mt-map-heatmap-img');

          if (this.options.heatmap.mask) {
            this.imgHeatmap = this.imgHeatmap.attr('clip-path', 'url(#mt-map-heatmap-mask)');
          }

          if (this.options.heatmap.borders) {
            var borders = topojson.mesh(this.jsonWorld, this.jsonWorld.objects.countries, function (a, b) {
              return a !== b;
            });

            this.bordersHeatmap = this.layerHeatmap.append('g').attr('class', 'mt-map-heatmap-borders');

            this.bordersHeatmap.selectAll('path.mt-map-heatmap-borders-paths').data([lands, borders]).enter().append('path').attr('class', 'mt-map-heatmap-borders-paths').attr('fill', 'none').attr('stroke-width', this.options.heatmap.borders.stroke).attr('stroke', this.options.heatmap.borders.color).attr('style', 'opacity: ' + this.options.heatmap.borders.opacity).attr('d', this.path);
          }
        }

        /**
         * Get Scale for every circle magnitude
         * @param heatmapDataset: heatmap dataset that we use
         * @returns scale: function - Scale function that output a value [0 - 1]
         */

      }, {
        key: 'getMagnitudeScale',
        value: function getMagnitudeScale(heatmapDataset) {
          var opts = this.options.heatmap;
          var lengthDataset = heatmapDataset.length;
          if (!lengthDataset) return function () {
            return 0;
          };
          // const layersPerLocation = (opts.circles.max - opts.circles.min) / opts.circles.step;
          var maxOpacityScale = d3.scale.linear().domain([1, lengthDataset]).range([1, 0.25]);
          var centralCircleOpacity = maxOpacityScale(lengthDataset);

          var scale = d3.scale.linear().domain([opts.circles.min, 20]).range([centralCircleOpacity, 0]);
          return function (m) {
            return scale(m);
          };
        }

        /**
         * Get Scale for every data point (used for weighting)
         * @returns scale: function - Scale function that output a value [0 - 1]
         */

      }, {
        key: 'getDatumScale',
        value: function getDatumScale() {
          var _this2 = this;

          if (!this.options.heatmap.weightByAttribute) return function () {
            return 1;
          };
          var dataExtents = d3.extent(this.maptable.data, this.options.heatmap.weightByAttribute);
          var userScale = this.options.heatmap.weightByAttributeScale === 'log' ? d3.scale.log : d3.scale.linear;
          var scale = userScale().domain(dataExtents).range([0.5, 1]);
          return function (d) {
            var val = _this2.options.heatmap.weightByAttribute(d);
            if (!val) return 0;
            return scale(val);
          };
        }

        /**
         * Get the Data URL of the heatmap image
         * @returns {string} base64 image
         */

      }, {
        key: 'getHeatmapData',
        value: function getHeatmapData() {
          var _this3 = this;

          var canvasHeatmap = d3.select(this.node).append('canvas').attr('id', 'mt-map-heatmap-canvas').attr('width', this.getWidth()).attr('height', this.getHeight()).attr('style', 'display: none;');

          var ctx = canvasHeatmap.node().getContext('2d');
          ctx.globalCompositeOperation = 'multiply';
          var circles = d3.range(this.options.heatmap.circles.min, this.options.heatmap.circles.max, this.options.heatmap.circles.step);
          var datumScale = this.getDatumScale();
          var heatmapDataset = this.maptable.data.filter(function (d) {
            return datumScale(d) > 0.1;
          });
          var path = this.path.context(ctx);
          var magnitudeScale = this.getMagnitudeScale(heatmapDataset);
          var colorScale = d3.scale.linear().domain([1, 0]).range(['#000000', '#FFFFFF']);

          // Make a flat white background first
          ctx.beginPath();
          ctx.rect(0, 0, this.getWidth(), this.getHeight());
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.closePath();

          // color strenght factor
          var colorMultiplier = function colorMultiplier(x) {
            var a = _this3.options.heatmap.circles.colorStrength;
            var aa = 1 + (a - 1) / 100;
            if (a > 1) return (2 - aa) * x + aa - 1;
            return a * x;
          };

          // add condensed clouds
          heatmapDataset.forEach(function (point) {
            var scaleOpacityDatum = datumScale(point);
            circles.forEach(function (m) {
              var opacity = colorMultiplier(magnitudeScale(m) * scaleOpacityDatum);
              if (opacity > 0) {
                ctx.beginPath();
                path(d3.geo.circle().origin([point.longitude, point.latitude]).angle(m - 0.0001)());
                ctx.fillStyle = colorScale(opacity);
                ctx.fill();
                ctx.closePath();
              }
            });
          });

          StackBlur.canvasRGBA(canvasHeatmap.node(), 0, 0, this.getWidth(), this.getHeight(), this.options.heatmap.circles.blur);

          // Add color layer
          ctx.beginPath();
          ctx.globalCompositeOperation = 'screen';
          ctx.rect(0, 0, this.getWidth(), this.getHeight());
          ctx.fillStyle = this.options.heatmap.circles.color;
          ctx.fill();
          ctx.closePath();

          var dataUrl = canvasHeatmap.node().toDataURL();
          canvasHeatmap.remove();
          return dataUrl;
        }

        /**
         * Set the data URL to the heatmap image
         */

      }, {
        key: 'updateHeatmap',
        value: function updateHeatmap() {
          var dataUrl = this.getHeatmapData();
          this.imgHeatmap.attr('xlink:href', dataUrl);
        }

        /**
         * build the paths for the countries
         */

      }, {
        key: 'buildCountries',
        value: function buildCountries() {
          this.dataCountries = topojson.feature(this.jsonWorld, this.jsonWorld.objects.countries).features;

          // Build country paths
          this.layerCountries.selectAll('.mt-map-country').data(this.dataCountries).enter().insert('path').attr('class', 'mt-map-country').attr('d', this.path);

          // Build Country Legend
          this.legendCountry = {};

          if (this.shouldRenderLegend()) {
            this.legendCountry.fill = new Legend(this);
          }
        }
      }, {
        key: 'shouldRenderLegend',
        value: function shouldRenderLegend() {
          var f = this.options.countries.attr.fill;
          if (!f) return false;
          if (!f.legend || !f.min || !f.max) return false;
          if (f.aggregate && f.aggregate.scale) {
            var scale = typeof f.aggregate.scale === 'function' ? f.aggregate.scale.bind(this.maptable)() : f.aggregate.scale;
            if (scale !== 'linear') return false;
          }
          return true;
        }

        /**
         * Set the right color for every country
         */

      }, {
        key: 'updateCountries',
        value: function updateCountries() {
          var _this4 = this;

          // Data from user input
          var dataByCountry = d3.nest().key(function (d) {
            return d[_this4.options.countryIdentifierKey];
          }).entries(this.maptable.data);

          // We merge both data
          this.dataCountries.forEach(function (geoDatum) {
            geoDatum.key = geoDatum.properties[_this4.options.countryIdentifierType];
            var matchedCountry = dataByCountry.filter(function (uDatum) {
              return uDatum.key === geoDatum.key;
            });
            geoDatum.values = matchedCountry.length === 0 ? [] : matchedCountry[0].values;
            geoDatum.attr = {};
            geoDatum.rollupValue = {};
          });

          // We calculate attributes values
          Object.keys(this.options.countries.attr).forEach(function (k) {
            _this4.setAttrValues(k, _this4.options.countries.attr[k], _this4.dataCountries);
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
            var attrValue = _this4.options.countries.attr[attrKey];
            if ((typeof attrValue === 'undefined' ? 'undefined' : babelHelpers.typeof(attrValue)) === 'object' && attrValue.legend && _this4.legendCountry[attrKey] != undefined) {
              var scaleDomain = d3.extent(_this4.dataCountries, function (d) {
                return Number(d.attrProperties[attrKey].value);
              });
              _this4.legendCountry[attrKey].updateExtents(scaleDomain);

              // When we mouseover the legend, it should highlight the indice selected
              countryItem.on('mouseover', function (d) {
                _this4.legendCountry[attrKey].indiceChange(d.attrProperties[attrKey].value);
              }).on('mouseout', function () {
                _this4.legendCountry[attrKey].indiceChange(NaN);
              });
            }
          });

          // Update Tooltip
          if (this.options.countries && this.options.countries.tooltip) {
            this.activateTooltip(countryItem, this.tooltipCountriesNode, this.options.countries.tooltip, true);
          }
        }
      }, {
        key: 'updateMarkers',
        value: function updateMarkers() {
          var _this5 = this;

          var defaultGroupBy = function defaultGroupBy(a) {
            return a.longitude + ',' + a.latitude;
          };

          this.dataMarkers = d3.nest().key(defaultGroupBy).entries(this.maptable.data).filter(function (d) {
            return d.values[0].x !== 0;
          });

          // We merge both data
          this.dataMarkers.forEach(function (d) {
            d.attr = {};
            d.attrProperties = {};
          });

          // We calculate attributes values
          Object.keys(this.options.markers.attr).forEach(function (k) {
            _this5.setAttrValues(k, _this5.options.markers.attr[k], _this5.dataMarkers);
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

          d3.selectAll(this.containerSelector + ' .mt-map-marker').each(function (d) {
            var targetPath = this;
            Object.keys(d.attr).forEach(function (key) {
              d3.select(targetPath).attr(key, d.attr[key]);
            });
          });

          if (this.options.markers.tooltip) {
            this.activateTooltip(markerUpdate, this.tooltipMarkersNode, this.options.markers.tooltip, false);
          }

          this.rescale();
        }
      }, {
        key: 'fitContent',
        value: function fitContent() {
          if (this.maptable.data.length === 0) {
            this.transX = 0;
            this.transY = 0;
            this.scale = 1;
            this.zoomListener.translate([this.transX, this.transY]).scale(this.scale);
            return;
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

        /**
         * We encode a transaltion to be independent from the dimensions of the visualization
         * @param originalTranslation: Array - original translation value (from screen)
         * @returns encodedTranslation: Array - encoded translation
         */

      }, {
        key: 'encodeTranslation',
        value: function encodeTranslation(originalTranslation) {
          var newTx = originalTranslation[0] / (this.scale * this.getWidth());

          var newTy = originalTranslation[1] / (this.scale * this.getHeight());

          return [newTx, newTy];
        }

        /**
         * We decode a translation to adapt it to the dimensions of the visualization
         * @param encodedTranslation: Array - encoded translation
         * @returns originalTranslation: Array - original translation value (from screen)
         */

      }, {
        key: 'decodeTranslation',
        value: function decodeTranslation(encodedTranslation) {
          var newTx = encodedTranslation[0] * this.getWidth() * this.scale;

          var newTy = encodedTranslation[1] * this.getHeight() * this.scale;

          return [newTx, newTy];
        }

        /**
         * Restore state from the url hash
         */

      }, {
        key: 'restoreState',
        value: function restoreState(defaultZoom) {
          if (!defaultZoom || defaultZoom.length !== 3) return;
          this.scale = defaultZoom[0];
          var originalTranslation = this.decodeTranslation([defaultZoom[1], defaultZoom[2]]);
          this.transX = originalTranslation[0];
          this.transY = originalTranslation[1];
          this.zoomListener.scale(defaultZoom[0]).translate(originalTranslation).event(this.svg);
        }

        /**
         * Save state into the url hash
         */

      }, {
        key: 'saveState',
        value: function saveState() {
          var encodedTranslation = this.encodeTranslation([this.transX, this.transY]);
          var exportedData = [this.scale, encodedTranslation[0], encodedTranslation[1]];
          if (exportedData[0] !== 1 && exportedData[1] !== 0 && exportedData[2] !== 0) {
            this.maptable.saveState('zoom', exportedData);
          } else {
            this.maptable.removeState('zoom');
          }
        }
      }, {
        key: 'rescale',
        value: function rescale() {
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

          // Hide tooltip
          if (self.tooltipCountriesNode) self.tooltipCountriesNode.attr('style', 'display:none;');
          if (self.tooltipMarkersNode) self.tooltipMarkersNode.attr('style', 'display:none;');

          // Rescale markers size
          if (this.options.markers) {
            // markers
            d3.selectAll(this.containerSelector + ' .mt-map-marker').each(function (d) {
              // stroke
              if (d.attr['stroke-width']) {
                d3.select(this).attr('stroke-width', d.attr['stroke-width'] / self.scaleAttributes());
              }
              // radius
              if (d.attr.r) {
                d3.select(this).attr('r', d.attr.r / self.scaleAttributes());
              }
            });
          }

          // Rescale Country stroke-width
          if (this.options.countries) {
            d3.selectAll(this.containerSelector + ' .mt-map-country').style('stroke-width', this.options.countries.attr['stroke-width'] / this.scale);
          }

          // Rescale heatmap borders
          if (this.options.heatmap && this.options.heatmap.borders) {
            d3.selectAll(this.containerSelector + ' .mt-map-heatmap-borders-paths').style('stroke-width', this.options.heatmap.borders.stroke / this.scale);
          }

          // save state
          if (this.maptable.firstExecution && this.options.saveState) this.saveState();
        }
      }, {
        key: 'setAttrValues',
        value: function setAttrValues(attrKey, attrValue, dataset) {
          var _this6 = this;

          if (typeof attrValue === 'number' || typeof attrValue === 'string') {
            // Static value
            dataset.forEach(function (d) {
              d.attr[attrKey] = attrValue;
            });
          } else if (typeof attrValue === 'function') {
            // Dynamic value based on the dataset
            dataset.forEach(function (d) {
              d.attr[attrKey] = attrValue(d);
            });
          } else if ((typeof attrValue === 'undefined' ? 'undefined' : babelHelpers.typeof(attrValue)) === 'object') {
            var scale = 'linear';
            var key = null;
            var mode = 'count';
            var scaleToUse = d3.scale.linear();
            if (attrValue.aggregate) {
              key = typeof attrValue.aggregate.key === 'function' ? attrValue.aggregate.key.bind(this.maptable)() : attrValue.aggregate.key;

              mode = typeof attrValue.aggregate.mode === 'function' ? attrValue.aggregate.mode.bind(this.maptable)() : attrValue.aggregate.mode;

              if (typeof attrValue.aggregate.scale === 'function') {
                scale = attrValue.aggregate.scale.bind(this.maptable)();
              } else if (attrValue.aggregate.scale) {
                scale = attrValue.aggregate.scale;
              }

              if (!key || !mode) {
                throw new Error('MapTable: You should provide values \'key\' & \'mode\' for attr.' + attrKey + '.aggregate');
              }

              // Custom aggregate mode
              if (mode === 'sum') {
                attrValue.rollup = function (groupedData) {
                  return groupedData.map(function (d) {
                    return Number(d[key]);
                  }).reduce(function (a, c) {
                    return a + c;
                  }, 0);
                };
              } else if (mode === 'avg') {
                attrValue.rollup = function (groupedData) {
                  if (!groupedData.length) return 0;
                  var validData = groupedData.filter(function (d) {
                    return !Number.isNaN(Number(d[key]));
                  });
                  return validData.map(function (d) {
                    return Number(d[key]);
                  }).reduce(function (a, c) {
                    return a + c;
                  }, 0) / validData.length;
                };
              } else if (mode === 'count') {
                attrValue.rollup = function (groupedData) {
                  return groupedData.length;
                };
              } else if (mode === 'min') {
                attrValue.rollup = function (groupedData) {
                  if (!groupedData.length) return 0;
                  var groupedValues = groupedData.map(function (d) {
                    return Number(d[key]);
                  });
                  return groupedValues.reduce(function (min, p) {
                    return p < min ? p : min;
                  }, groupedValues[0]);
                };
              } else if (mode === 'max') {
                attrValue.rollup = function (groupedData) {
                  if (!groupedData.length) return 0;
                  var groupedValues = groupedData.map(function (d) {
                    return Number(d[key]);
                  });
                  return groupedValues.reduce(function (max, p) {
                    return p > max ? p : max;
                  }, groupedValues[0]);
                };
              } else if (mode.indexOf('percentile') !== -1) {
                var percentile = utils.toNumber(mode);
                attrValue.rollup = function (groupedData) {
                  if (!groupedData.length) return 0;
                  var groupedValues = groupedData.map(function (d) {
                    return Number(d[key]);
                  });
                  return utils.quantile(groupedValues, percentile);
                };
              } else if (typeof attrValue.rollup === 'function') {
                attrValue.rollup = attrValue.rollup.bind(this.maptable);
              }

              // Custom scale
              if (scale) {
                if (scale.indexOf('log') !== -1) {
                  scaleToUse = d3.scale.log().base(utils.toNumber(scale) || 10);
                } else if (scale.indexOf('pow') !== -1) {
                  scaleToUse = d3.scale.pow().exponent(utils.toNumber(scale) || 1);
                } else if (scale === 'sqrt') {
                  scaleToUse = d3.scale.sqrt();
                }
                // Rank scale neeed additional transformations
              }
            }

            // Dynamic value based on a scale
            if (!attrValue.rollup) {
              attrValue.rollup = function (d) {
                return d.length;
              };
            }
            if (!attrValue.min || !attrValue.max) {
              throw new Error('MapTable: You should provide values \'min\' & \'max\' for attr.' + attrKey);
            }

            dataset.forEach(function (d) {
              var aggregatedValue = attrValue.rollup(d.values);
              if (!d.attrProperties) d.attrProperties = {};
              if (!d.attrProperties[attrKey]) d.attrProperties[attrKey] = {};
              d.attrProperties[attrKey].value = aggregatedValue;
              if (key) {
                d.attrProperties[attrKey].key = key;
                d.attrProperties[attrKey].mode = mode;
                d.attrProperties[attrKey].scale = scale;
                var c = _this6.maptable.columnDetails[key];
                d.attrProperties[attrKey].columnDetails = c;
                var datum = {};
                datum[key] = aggregatedValue;
                d.attrProperties[attrKey].formatted = c && c.cellContent ? c.cellContent.bind(_this6.maptable)(datum) : aggregatedValue;
              }
            });
            if (scale === 'rank') {
              var positiveRanks = utils.uniqueValues([0].concat(dataset.map(function (d) {
                return Math.floor(d.attrProperties[attrKey].value * 100) / 100;
              }).filter(function (v) {
                return v > 0;
              })));
              var negativeRanks = utils.uniqueValues(dataset.map(function (d) {
                return Math.floor(d.attrProperties[attrKey].value * 100) / 100;
              }).filter(function (v) {
                return v < 0;
              }));

              positiveRanks.sort(function (a, b) {
                return a - b;
              });
              negativeRanks.sort(function (a, b) {
                return b - a;
              });

              dataset.forEach(function (d) {
                if (d.attrProperties[attrKey].value !== 0) {
                  var ranks = d.attrProperties[attrKey].value >= 0 ? positiveRanks : negativeRanks;
                  var pos = ranks.indexOf(Math.floor(d.attrProperties[attrKey].value * 100) / 100);
                  var _percentile = Math.round(pos / ranks.length * 100);
                  var newValue = d.attrProperties[attrKey].value < 0 ? _percentile - _percentile * 2 : _percentile;
                  d.attrProperties[attrKey].value = newValue;
                }
              });
            }

            var scaleDomain = d3.extent(dataset, function (d) {
              return Number(d.attrProperties[attrKey].value);
            });
            if (attrValue.transform) {
              scaleDomain[0] = attrValue.transform.bind(this.maptable)(scaleDomain[0], this.maptable.data);
              scaleDomain[1] = attrValue.transform.bind(this.maptable)(scaleDomain[1], this.maptable.data);
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
              scaleFunction = scaleToUse.copy().domain([0, scaleDomain[1]]).range([minValue, maxValue]);
              scaleNegativeFunction = scaleToUse.copy().domain([scaleDomain[0], 0]).range([attrValue.maxNegative, attrValue.minNegative]);
            } else {
              scaleFunction = scaleToUse.domain(scaleDomain).range([minValue, maxValue]);
            }

            dataset.forEach(function (d) {
              var scaledValue = void 0;
              if (!d.values.length || Number.isNaN(d.attrProperties[attrKey].value)) {
                if (typeof attrValue.empty === 'undefined') {
                  throw new Error('MapTable: no empty property found for attr.' + attrKey);
                }
                scaledValue = attrValue.empty;
              } else {
                var originalValueRaw = d.attrProperties[attrKey].value;
                var originalValue = attrValue.transform ? attrValue.transform.bind(_this6.maptable)(originalValueRaw, _this6.maptable.data) : originalValueRaw;

                if (useNegative && originalValue < 0) {
                  scaledValue = scaleNegativeFunction(originalValue);
                } else {
                  scaledValue = scaleFunction(originalValue);
                }
              }
              d.attr[attrKey] = scaledValue;
            });
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
          if (this.options.heatmap) this.updateHeatmap();
          if (this.options.autoFitContent) {
            this.fitContent();
            this.rescale();
          }
          // On render
          if (this.options.onRender && this.options.onRender.constructor === Function) {
            this.options.onRender.bind(this.maptable)();
          }
        }
      }, {
        key: 'updateTitle',
        value: function updateTitle() {
          var _this7 = this;

          if (this.options.title.content) {
            var showing = this.maptable.data.filter(function (d) {
              return d[_this7.options.latitudeKey] !== 0;
            }).length;
            var total = this.maptable.rawData.filter(function (d) {
              return d[_this7.options.latitudeKey] !== 0;
            }).length;

            var inlineFilters = '';
            if (this.maptable.filters) {
              inlineFilters = this.maptable.filters.getDescription();
            }

            this.container.querySelector('#mt-map-title').innerHTML = this.options.title.content.bind(this.maptable)(showing, total, inlineFilters, this.maptable.data, this.maptable.rawData, this.dataCountries);
          }
        }
      }, {
        key: 'activateTooltip',
        value: function activateTooltip(target, tooltipNode, tooltipContent, isCountry) {
          var self = this;
          target.on(isCountry ? 'mousemove' : 'mouseover', function (d) {
            var content = tooltipContent.bind(this.maptable)(d);
            if (!content) return;
            tooltipNode.html(content).attr('style', 'display:block;position:fixed;');

            var mouseLeft = void 0;
            var mouseTop = void 0;
            var tooltipDelta = tooltipNode.node().offsetWidth / 2;
            if (isCountry) {
              var mapRect = self.node.getBoundingClientRect();
              var mousePosition = d3.mouse(self.svg.node()).map(function (v) {
                return parseInt(v, 10);
              });

              mouseLeft = mapRect.left + mousePosition[0] - tooltipDelta;
              mouseTop = mapRect.top + mousePosition[1] + 10;
            } else {
              var targetRect = this.getBoundingClientRect();
              mouseLeft = targetRect.left + targetRect.width / 2 - tooltipDelta;
              mouseTop = targetRect.top + targetRect.height + 2; // +2 is for the border
            }

            tooltipNode.attr('style', 'top:' + mouseTop + 'px;left:' + mouseLeft + 'px;display:block;position:fixed;').on('mouseout', function () {
              tooltipNode.style('display', 'none');
            });
          }).on('mouseout', function () {
            tooltipNode.style('display', 'none');
          });
        }
      }, {
        key: 'exportSvg',
        value: function exportSvg() {
          // Get the d3js SVG element
          var svg = this.container.querySelector('#mt-map-svg');
          // Extract the data as SVG text string
          var svgXml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + new XMLSerializer().serializeToString(svg);

          if (this.options.exportSvgClient) {
            if (!window.saveAs) {
              throw new Error('MapTable: Missing FileSaver.js library');
            }
            var blob = new Blob([svgXml], { type: 'image/svg+xml' });
            window.saveAs(blob, 'visualization.svg');
          } else if (this.options.exportSvg) {
            var form = this.node.querySelector('#mt-map-svg-form');
            form.querySelector('[name="data"]').value = svgXml;
            form.submit();
          }
        }
      }, {
        key: 'addExportSvgCapability',
        value: function addExportSvgCapability() {
          var exportNode = document.createElement('div');
          exportNode.setAttribute('id', 'mt-map-export');
          this.container.querySelector('#mt-map').appendChild(exportNode);

          var exportButton = document.createElement('button');
          exportButton.setAttribute('class', 'btn btn-xs btn-default');
          exportButton.innerHTML = 'Download';
          exportButton.addEventListener('click', this.exportSvg.bind(this));
          exportNode.appendChild(exportButton);

          if (this.options.exportSvg) {
            var exportForm = document.createElement('div');
            exportForm.innerHTML = '<form id="mt-map-svg-form" method="post"\n  action="' + this.options.exportSvg + '"><input type="hidden" name="data"></form>';
            exportNode.appendChild(exportForm);
          }
        }
      }]);
      return GeoMap;
    }();

    var Filters = function () {
      function Filters(maptable, options) {
        var _this = this;

        babelHelpers.classCallCheck(this, Filters);

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

        this.containerSelector = maptable.options.target;
        this.container = document.querySelector(maptable.options.target);
        this.node = this.container.querySelector('#mt-filters');

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

      /**
       * Add a filter
       * @param evt: Window Event Object
       */


      babelHelpers.createClass(Filters, [{
        key: 'add',
        value: function add(evt) {
          if (evt) evt.preventDefault();
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
            this.node.querySelector('#mt-filters-elements').appendChild(rowNode);
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
          var rowNode = this.node.querySelector('[data-mt-filter-name="' + filterName + '"]');
          if (rowNode) rowNode.parentNode.removeChild(rowNode);
          var filterIndex = this.criteria.indexOf(filterName);
          this.criteria.splice(filterIndex, 1);
          this.maptable.render();
        }

        /**
         * Reset filters
         */

      }, {
        key: 'reset',
        value: function reset() {
          var rowNodes = this.node.querySelectorAll('[data-mt-filter-name]');
          for (var i = 0; i < rowNodes.length; i += 1) {
            rowNodes[i].parentNode.removeChild(rowNodes[i]);
          }
          this.criteria = [];
          this.maptable.render();
        }

        /**
         * Export the current filters to an object
         * @returns exportedFilters: Object - key => value that contain data about the current filters
         */

      }, {
        key: 'exportFilters',
        value: function exportFilters() {
          var output = {};
          var filtersChildren = this.node.querySelector('#mt-filters-elements').childNodes;

          for (var i = 0; i < filtersChildren.length; i += 1) {
            var element = filtersChildren[i];
            var filterName = element.querySelector('.mt-filter-name').value;
            var columnDetails = this.maptable.columnDetails[filterName];
            var filterOutput = [columnDetails.filterMethod];
            if (columnDetails.filterMethod === 'compare') {
              var filterRangeSelect = element.querySelector('.mt-filter-range');
              filterOutput[1] = filterRangeSelect.value;
              if (filterRangeSelect.value !== 'any') {
                if (filterRangeSelect.value === 'BETWEEN') {
                  var filterValueMin = element.querySelector('.mt-filter-value-min').value;
                  var filterValueMax = element.querySelector('.mt-filter-value-max').value;
                  if (filterValueMin !== '' && filterValueMax === '') {
                    filterOutput[2] = filterValueMin;
                    filterOutput[3] = filterValueMax;
                  }
                } else {
                  var filterValue = element.querySelector('.mt-filter-value-min').value;
                  filterOutput[2] = filterValue;
                }
              }
            } else if (columnDetails.filterMethod === 'field' || columnDetails.filterMethod === 'dropdown') {
              filterOutput[1] = '';
              var _filterValue = element.querySelector('.mt-filter-value').value;
              filterOutput[2] = _filterValue;
            }
            if (filterOutput[1] !== 'any' && filterOutput[2] && filterOutput[2] !== '') {
              output[filterName] = filterOutput;
            }
          }
          return output;
        }

        /**
         * Set the value for the current filters
         * @param criteria - Object - same format as the exportedFilters
         */

      }, {
        key: 'setFilters',
        value: function setFilters(criteria) {
          var _this2 = this;

          this.reset();
          Object.keys(criteria).forEach(function (filterName) {
            _this2.create(filterName);
            var criterion = criteria[filterName];
            var row = document.querySelector('#mt-filters-elements [data-mt-filter-name="' + filterName + '"]');
            if (row) {
              if (criterion[0] === 'compare') {
                row.querySelector('.mt-filter-range').value = criterion[1];
                if (criterion[1] !== 'any') {
                  if (criterion[1] === 'BETWEEN') {
                    row.querySelector('.mt-filter-value-min').value = criterion[2];
                    row.querySelector('.mt-filter-value-max').value = criterion[3];
                  } else {
                    row.querySelector('.mt-filter-value-min').value = criterion[2];
                  }
                }
              } else if (criterion[0] === 'field' || criterion[0] === 'dropdown') {
                row.querySelector('.mt-filter-value').value = decodeURIComponent(criterion[2]);
              }
            }
          });
          this.maptable.render();
        }

        /**
         * Restore state from the URL hash
         */

      }, {
        key: 'restoreState',
        value: function restoreState(defaultCriteria) {
          if (!defaultCriteria) return;
          this.setFilters(defaultCriteria);
        }

        /**
         *  Get a human readable description of the filters (used for the title)
         * @returns {string} Human readable description
         */

      }, {
        key: 'getDescription',
        value: function getDescription() {
          var outputArray = [];

          var filtersChildren = this.node.querySelector('#mt-filters-elements').childNodes;

          for (var i = 0; i < filtersChildren.length; i += 1) {
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
              var _filterValue2 = element.querySelector('.mt-filter-value').value;
              if (_filterValue2 === '') continue;
              var separatorWord = columnDetails.filterMethod === 'field' ? 'contains' : 'is';
              line += columnDetails.title + ' ' + separatorWord + '\n          <tspan font-weight="bold">' + _filterValue2 + '</tspan>';
            }
            outputArray.push(line);
          }
          return outputArray.join(', ');
        }
      }, {
        key: 'buildRow',
        value: function buildRow(filterName) {
          var _this3 = this;

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
            _this3.remove(filterName);
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
              filterInput.addEventListener('keyup', _this3.maptable.render.bind(_this3.maptable));
              filterInput.addEventListener('change', _this3.maptable.render.bind(_this3.maptable));
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
          var _this4 = this;

          return Object.keys(this.maptable.columnDetails).map(function (k) {
            return utils.extendRecursive({ key: k }, _this4.maptable.columnDetails[k]);
          }).filter(function (v) {
            return _this4.activeColumns.indexOf(v.key) !== -1 && (except && except === v.key || _this4.criteria.indexOf(v.key) === -1 && v.filterMethod && !v.isVirtual);
          });
        }
      }, {
        key: 'filterData',
        value: function filterData() {
          var _this5 = this;

          var that = this;
          this.maptable.data = this.maptable.rawData.filter(function (d) {
            var rowNodes = _this5.node.querySelectorAll('.mt-filter-row');
            var matched = true;
            for (var i = 0; i < rowNodes.length && matched; i += 1) {
              var rowNode = rowNodes[i];
              var filterName = rowNode.getAttribute('data-mt-filter-name');
              var columnDetails = that.maptable.columnDetails[filterName];
              var fmt = columnDetails.dataParse; // shortcut

              if (columnDetails.filterMethod === 'dropdown') {
                var filterValue = rowNode.querySelector('.mt-filter-value').value;
                if (filterValue === '') continue;
                if (d[filterName] !== filterValue) matched = false;
              } else if (columnDetails.filterMethod === 'field') {
                var _filterValue3 = rowNode.querySelector('.mt-filter-value').value;
                if (_filterValue3 === '') continue;
                if (d[filterName].toLowerCase().indexOf(_filterValue3.toLowerCase()) === -1) {
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
                  var _filterValue4 = rowNode.querySelector('.mt-filter-value-min').value;
                  if (_filterValue4 === '') continue;
                  if (fmt && !utils.rangeToBool(fmt(d[filterName]), filterRange, fmt(_filterValue4))) {
                    matched = false;
                  } else if (!fmt && !utils.rangeToBool(d[filterName], filterRange, _filterValue4)) {
                    matched = false;
                  }
                }
              }
            }
            return matched;
          });
          // save state
          if (this.options.saveState) this.maptable.saveState('filters', this.exportFilters());
        }
      }, {
        key: 'refresh',
        value: function refresh() {
          // update dropdown
          var filterNameSelects = this.node.querySelectorAll('.mt-filter-name');
          for (var i = 0; i < filterNameSelects.length; i += 1) {
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
          if (this.node.querySelectorAll('.mt-filters-and').length > 0) {
            this.node.querySelectorAll('.mt-filters-and')[0].style.visibility = 'hidden';
          }

          // Check if we reached the maximum of allowed filters
          var disableNewFilter = !this.getPossibleFilters().length;
          this.node.querySelector('#mt-filters-new').style.visibility = disableNewFilter ? 'hidden' : 'visible';
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
      /**
       * Table componenet constructor
       * @param maptable: Maptable main Object
       * @param options: options communicated to the table
       * @returns {string|*}
       */
      function Table(maptable, options) {
        var _this = this;

        babelHelpers.classCallCheck(this, Table);

        this.maptable = maptable;
        this.options = options;

        if (this.options.defaultSorting) {
          if (Array.isArray(this.options.defaultSorting) && this.options.defaultSorting.length === 2) {
            this.sorting = this.options.defaultSorting;
          } else {
            this.sorting = [this.options.defaultSorting];
          }
          this.sorting.forEach(function (s) {
            if (!s.mode) s.mode = 'asc';
          });
        } else {
          this.sorting = [{
            key: Object.keys(this.maptable.data[0])[0],
            mode: 'asc'
          }];
        }

        this.initialSorting = this.sorting.map(function (s) {
          return s.key + ',' + s.mode;
        }).join(';');
        this.isSorting = false;

        this.containerSelector = maptable.options.target;
        this.container = document.querySelector(maptable.options.target);

        this.node = this.container.querySelector('#mt-table');

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
        }).attr('data-key', function (d) {
          return utils.sanitizeKey(d.key);
        }).attr('onselectstart', 'return false;').attr('unselectable', 'on').attr('style', function (d) {
          return d.nowrap ? 'white-space:nowrap;' : '';
        }).on('click', function (d) {
          if (_this.isSorting) return;
          _this.isSorting = true;
          if (d.sorting) {
            _this.sortColumn(d.key);
          }
          _this.isSorting = false;
        }).text(function (d) {
          return d.title;
        }).attr('id', function (d) {
          return 'column_header_' + utils.sanitizeKey(d.key);
        });

        // render is triggered by MapTable
        // this.render();
      }

      /**
       * Restore state from the url hash
       */


      babelHelpers.createClass(Table, [{
        key: 'restoreState',
        value: function restoreState(sortingRaw) {
          if (!sortingRaw) return;
          var sortingList = sortingRaw.split(';');
          var defaultSorting = [];
          sortingList.forEach(function (s) {
            var sortingData = s.split(',');
            defaultSorting.push({
              key: sortingData[0],
              mode: sortingData[1] || 'asc'
            });
          });
          this.sorting = defaultSorting;
        }

        /**
         * Save state into the url hash
         */

      }, {
        key: 'saveState',
        value: function saveState() {
          var encodedSorting = this.sorting.map(function (s) {
            return s.key + ',' + s.mode;
          }).join(';');
          if (encodedSorting !== this.initialSorting) {
            this.maptable.saveState('sort', encodedSorting);
          }
        }
      }, {
        key: 'render',
        value: function render() {
          var _this2 = this;

          // Apply Sort
          this.applySort();

          var tableData = this.maptable.data;
          if (this.options.distinctBy) {
            tableData = d3.nest().key(function (d) {
              return d[_this2.options.distinctBy];
            }).entries(this.maptable.data).map(function (g) {
              return g.values[0];
            });
          }

          // Enter
          this.body.selectAll('tr').data(tableData).enter().append('tr');

          // Exit
          this.body.selectAll('tr').data(tableData).exit().remove();

          // Update
          var uniqueCollapsedRows = [];
          this.body.selectAll('tr').data(tableData).attr('class', function (row) {
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
                } else if (row[columnKey] && row[columnKey] !== 'null') tds += row[columnKey];
                if (_this2.options.collapseRowsBy.indexOf(columnKey) !== -1) {
                  uniqueCollapsedRows[columnKey] = row[columnKey];
                }
              }
              tds += '</td>';
            });
            return tds;
          });

          // On render
          if (this.options.onRender && this.options.onRender.constructor === Function) {
            this.options.onRender.bind(this.maptable)();
          }
        }
      }, {
        key: 'applySort',
        value: function applySort() {
          var _this3 = this;

          var sortableColums = this.container.querySelectorAll('.mt-table-sortable');
          for (var i = 0; i < sortableColums.length; i += 1) {
            sortableColums[i].setAttribute('class', 'mt-table-sortable');
          }
          this.sorting.forEach(function (column) {
            _this3.container.querySelector('#column_header_' + utils.sanitizeKey(column.key)).setAttribute('class', 'mt-table-sortable sort_' + column.mode);
          });
          this.maptable.data = this.maptable.data.sort(function (a, b) {
            var compareBool = false;
            _this3.sorting.forEach(function (column) {
              var d3SortMode = column.mode === 'asc' ? d3.ascending : d3.descending;
              var columnDetails = _this3.maptable.columnDetails[column.key];
              var el1 = a[column.key];
              var el2 = b[column.key];
              if (columnDetails.dataParse) {
                el1 = columnDetails.dataParse.bind(_this3.maptable)(el1);
                el2 = columnDetails.dataParse.bind(_this3.maptable)(el2);
              } else if (columnDetails.virtual) {
                el2 = columnDetails.virtual.bind(_this3.maptable)(a);
                el2 = columnDetails.virtual.bind(_this3.maptable)(b);
              } else if (columnDetails.filterType === 'compare') {
                el1 = Number(el1);
                el2 = Number(el2);
              } else if (el1 instanceof String && el2 instanceof String) {
                el1 = el1.toLowerCase();
                el2 = el2.toLowerCase();
              }
              compareBool = compareBool || d3SortMode(el1, el2);
            });
            return compareBool;
          });
        }

        /**
         * Sort Table by a column key
         * @param columnKey: String - column key
         */

      }, {
        key: 'sortColumn',
        value: function sortColumn(key) {
          var sortIndex = this.sorting.map(function (d) {
            return d.key;
          }).indexOf(key);
          var sortValue = { key: key };
          if (sortIndex === -1) {
            sortValue.mode = 'desc';
            if (d3.event && d3.event.shiftKey) {
              this.sorting[1] = sortValue;
            } else {
              this.sorting = [sortValue];
            }
          } else {
            if (this.sorting[sortIndex].mode === 'asc') {
              this.sorting[sortIndex].mode = 'desc';
            } else {
              this.sorting[sortIndex].mode = 'asc';
              // this.sorting.splice(sortIndex, 1); // to disable sorting
            }
            if (!d3.event.shiftKey) {
              this.sorting = [this.sorting[sortIndex]];
            }
          }

          this.saveState();
          this.render();
        }
      }]);
      return Table;
    }();

    var MapTable = function () {
      function MapTable(target, options) {
        babelHelpers.classCallCheck(this, MapTable);

        this.options = options;

        this.state = {};
        this.saveStateTimeout = {};
        this.removeStateTimeout = null;

        this.node = document.querySelector(target);
        this.node.setAttribute('style', 'position:relative;');

        if (this.options.data.type === 'json') {
          d3.json(this.options.data.path, this.loadData.bind(this));
        } else if (this.options.data.type === 'csv') {
          d3.csv(this.options.data.path, this.loadData.bind(this));
        } else if (this.options.data.type === 'tsv') {
          d3.tsv(this.options.data.path, this.loadData.bind(this));
        }

        if (this.options.map && this.options.map.heatmap) {
          delete this.options.map.countries;
        }
      }

      /**
       * Callback used when we pull the dataset
       * @param err: Error - error data if it happened
       * @param data: Object - dataset object
       */


      babelHelpers.createClass(MapTable, [{
        key: 'loadData',
        value: function loadData(err, data) {
          var _this = this;

          if (err) {
            throw err;
          }
          this.rawData = data;

          if (this.options.data.preFilter) {
            this.rawData = this.rawData.filter(this.options.data.preFilter);
          }

          this.setColumnDetails();
          this.data = this.rawData.slice(); // we clone data, so that we can filter it
          // Map
          if (this.options.map) {
            // Map wrapper
            var mapWrapper = document.createElement('div');
            mapWrapper.setAttribute('class', 'mt-map-container');
            var isIE = navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0;
            if (this.options.map.heatmap && isIE) {
              mapWrapper.innerHTML = '<div class="mt-loading">The heatmap feature is not supported with Internet Explorer.<br>Please use another modern browser to see this map.</div>';
              this.node.insertBefore(mapWrapper, this.node.firstChild);
              mapWrapper.querySelector('.mt-loading').style.display = 'block';
              this.options.map = false;
              this.buildComponenents();
              return;
            }
            mapWrapper.innerHTML = '<div class="mt-loading">Loading...</div>';
            this.node.insertBefore(mapWrapper, this.node.firstChild);
            mapWrapper.querySelector('.mt-loading').style.display = 'block';
            d3.json(this.options.map.path, function (errGeoMap, jsonWorld) {
              if (errGeoMap) {
                throw errGeoMap;
              }
              _this.map = new GeoMap(_this, _this.options.map, jsonWorld);

              mapWrapper.querySelector('.mt-loading').style.display = 'none';

              _this.buildComponenents();
            });
          } else {
            this.buildComponenents();
          }
        }
      }, {
        key: 'buildComponenents',
        value: function buildComponenents() {
          var _this2 = this;

          // Filters
          if (this.options.filters) {
            this.filters = new Filters(this, this.options.filters);
          }

          // Table
          if (this.options.table) {
            this.table = new Table(this, this.options.table);
          }

          // Restore state
          this.restoreState();
          window.addEventListener('hashchange', function () {
            _this2.restoreState();
          });

          // Render
          this.render();
        }

        /**
         * Load state from url
         * @param stateName: name of the state (either filters or zoom)
         * @param isJson: do we need to decode a json from the state?
         * @return loaded state
         */

      }, {
        key: 'loadState',
        value: function loadState(stateName, isJson) {
          // JSON state
          if (isJson) {
            var v = this.parseState(stateName);
            if (!v) return null;
            try {
              var parsedState = JSON.parse(v);
              this.state[stateName] = parsedState;
            } catch (e) {
              console.log('Maptable: Invalid URL State for mt-' + stateName + ' ' + e.message);
              return null;
            }
          } else {
            var _v = this.parseState(stateName);
            if (_v) this.state[stateName] = _v;
          }
          return this.state[stateName];
        }

        /**
         * Restore state for filters or/and map zooming and/or sorting
         */

      }, {
        key: 'restoreState',
        value: function restoreState() {
          if (this.map) {
            this.loadState('zoom', true);
            this.map.restoreState(this.state.zoom);
          }

          if (this.filters) {
            this.loadState('filters', true);
            this.filters.restoreState(this.state.filters);
          }

          if (this.table) {
            this.loadState('sort', false);
            this.table.restoreState(this.state.sort);
          }
        }

        /**
         * Extract state from the url
         * @param stateName: name of the state (either filters or zoom)
         */

      }, {
        key: 'parseState',
        value: function parseState(stateName) {
          var params = document.location.href.replace(/%21mt/g, '!mt').split('!mt-' + stateName + '=');
          return params[1] ? decodeURIComponent(params[1].split('!mt')[0]) : null;
        }

        /**
         * Remove state
         * @param stateName: name of the state (either filters or zoom)
         */

      }, {
        key: 'removeState',
        value: function removeState(stateName) {
          window.clearTimeout(this.saveStateTimeout[stateName]);
          delete this.state[stateName];
          this.updateState();
        }

        /**
         * Save the state in this.state
         * @param stateName: name of the state (either filters or zoom)
         * @param stateData: object, contain state information
         */

      }, {
        key: 'saveState',
        value: function saveState(stateName, stateData) {
          var _this3 = this;

          window.clearTimeout(this.saveStateTimeout[stateName]);
          this.saveStateTimeout[stateName] = window.setTimeout(function () {
            _this3.state[stateName] = stateData;
            _this3.updateState();
          }, 200);
        }

        /**
         * Update state into the URL hash
         */

      }, {
        key: 'updateState',
        value: function updateState() {
          var _this4 = this;

          var newUrl = document.location.href.split('#')[0];
          var stateHash = '';
          Object.keys(this.state).forEach(function (k) {
            if (!_this4.state[k]) return;
            var stateValue = _this4.state[k];
            if (babelHelpers.typeof(_this4.state[k]) === 'object') {
              if (!Object.keys(_this4.state[k]).length) return;
              stateValue = JSON.stringify(_this4.state[k]);
            }
            stateHash += '!mt-' + k + '=' + encodeURIComponent(stateValue);
          });
          if (stateHash !== '') stateHash = '#' + stateHash;
          if (document.location.href !== '' + newUrl + stateHash) {
            window.history.pushState(null, null, '' + newUrl + stateHash);
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
            // On complete
            if (!this.firstExecution && this.options.map.onComplete && this.options.map.onComplete.constructor === Function) {
              this.options.map.onComplete.bind(this)();
            }
          }

          if (this.table) {
            this.table.render();
            // On complete
            if (!this.firstExecution && this.options.table.onComplete && this.options.table.onComplete.constructor === Function) {
              this.options.table.onComplete.bind(this)();
            }
          }

          // On complete
          if (!this.firstExecution && this.options.onComplete && this.options.onComplete.constructor === Function) {
            this.options.onComplete.bind(this)();
          }
          this.firstExecution = true;
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
            var patternNumber = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
            var isNumber = patternNumber.test(that.rawData[0][k]);
            defaultColumns[k] = {
              title: utils.keyToTile(k),
              filterMethod: isNumber ? 'compare' : 'field',
              filterInputType: isNumber ? 'number' : 'text',
              sorting: true
            };
            if (isNumber) {
              defaultColumns[k].dataParse = function (val) {
                return parseFloat(val);
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
        var mapOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        if (!topojson) {
          throw new Error('Maptable requires topojson.js');
        }
        if (typeof mapOptions.path !== 'string') {
          throw new Error('MapTable: map not provided');
        }
        options.map = mapOptions;
        return maptable;
      };

      maptable.json = function (jsonPath, preFilter) {
        options.data.type = 'json';
        options.data.path = jsonPath;
        options.data.preFilter = preFilter;
        return maptable;
      };

      maptable.csv = function (csvPath, preFilter) {
        options.data.type = 'csv';
        options.data.path = csvPath;
        options.data.preFilter = preFilter;
        return maptable;
      };

      maptable.tsv = function (tsvPath, preFilter) {
        options.data.type = 'tsv';
        options.data.path = tsvPath;
        options.data.preFilter = preFilter;
        return maptable;
      };

      maptable.filters = function () {
        var filtersOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        options.filters = filtersOptions;
        return maptable;
      };

      maptable.table = function () {
        var tableOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        options.table = tableOptions;
        return maptable;
      };

      maptable.columns = function () {
        var columns = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        options.columns = columns;
        return maptable;
      };

      maptable.render = function (onComplete) {
        if (typeof target !== 'string' || !document.querySelector(target)) {
          throw new Error('MapTable: target not found');
        }

        if (!options.data || !options.data.path) {
          throw new Error('MapTable: Please provide the path for your dataset json|csv|tsv');
        }

        if (options.map && !options.map.heatmap) options.map.heatmap = null;

        if (options.map && options.map.markers === false) options.map.markers = null;

        if (options.map && options.map.countries === false) options.map.countries = null;

        if (!options.filters) options.filters = null;
        options.onComplete = onComplete;

        var customOptions = utils.extendRecursive(defaultOptions, options);
        maptableObject = new MapTable(target, customOptions);

        // public functions
        return {
          render: function render() {
            return maptableObject.render();
          },
          loadState: function loadState(stateName, isJson) {
            return maptableObject.loadState(stateName, isJson);
          },
          removeState: function removeState(stateName) {
            return maptableObject.removeState(stateName);
          },
          saveState: function saveState(stateName, stateData) {
            return maptableObject.saveState(stateName, stateData);
          }
        };
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