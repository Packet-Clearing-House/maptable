import Legend from './Legend';
import Watermark from './Watermark';
import StackBlur from './StackBlur';

// Used the name GeoMap instead of Map to avoid collision with the native Map class of JS
export default class GeoMap {
  constructor(maptable, options, jsonWorld) {
    const self = this;
    this.maptable = maptable;
    this.scale = 1;
    this.transX = 0;
    this.transY = 0;

    this.options = options;

    this.jsonWorld = jsonWorld;

    this.node = document.querySelector('#mt-map');
    if (!this.node) {
      // Map wrapper
      const mapWrapper = document.querySelector('.mt-map-container');

      // Map
      this.node = document.createElement('div');
      this.node.setAttribute('id', 'mt-map');
      mapWrapper.appendChild(this.node);
    }

    this.svg = d3.select(this.node)
      .append('svg')
      .attr('id', 'mt-map-svg')
      .attr('viewBox', `0 0 ${this.getWidth()} ${this.getHeight()}`)
      .attr('width', this.getWidth())
      .attr('height', this.getHeight());

    this.projection = d3.geo.equirectangular()
      .translate([this.getWidth() / 2, this.getHeight() / (2 * this.options.scaleHeight)])
      .scale((this.getWidth() / 640) * 100)
      .rotate([-12, 0])
      .precision(0.1);

    this.path = d3.geo.path().projection(this.projection);

    // Add coordinates to rawData
    this.maptable.rawData.forEach(d => {
      d.longitude = parseFloat(d[self.options.longitudeKey]);
      d.latitude = parseFloat(d[self.options.latitudeKey]);
      let coord = [0, 0];
      if (!isNaN(d.longitude) && !isNaN(d.latitude)) {
        coord = self.projection([d.longitude, d.latitude]);
      }
      d.x = coord[0];
      d.y = coord[1];
    });

    this.zoomListener = d3.behavior
      .zoom()
      .scaleExtent(this.options.scaleZoom)
      .on('zoom', this.rescale.bind(this));

    // Attach Zoom event to map
    if (this.options.zoom) {
      this.svg = this.svg.call(this.zoomListener.bind(this));
    }

    // Add tooltip
    this.tooltipMarkersNode = d3.select(this.node)
      .append('div')
      .attr('id', 'mt-map-markers-tooltip')
      .attr('class', `mt-map-tooltip ${this.options.markers.tooltipClassName}`)
      .style('display', 'none');

    if (this.options.countries) {
      this.tooltipCountriesNode = d3.select(this.node)
        .append('div')
        .attr('id', 'mt-map-countries-tooltip')
        .attr('class', `mt-map-tooltip ${this.options.countries.tooltipClassName}`)
        .style('display', 'none');
    }

    this.layerGlobal = this.svg.append('g').attr('class', 'mt-map-global');
    this.layerCountries = this.layerGlobal.append('g').attr('class', 'mt-map-countries');
    this.layerHeatmap = this.layerGlobal.append('g').attr('class', 'mt-map-heatmap');
    this.layerMarkers = this.layerGlobal.append('g').attr('class', 'mt-map-markers');

    // Add Watermark
    if (this.options.watermark) {
      this.watermark = new Watermark(this, this.options.watermark);
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
      window.addEventListener('resize', () => {
        this.svg.attr('width', this.getWidth());
        this.svg.attr('height', this.getHeight());
        this.rescale();
      });
    }

    // Let's build things
    this.loadGeometries();

    // On complete
    if (this.options.onComplete && this.options.onComplete.constructor === Function) {
      this.options.onComplete.bind(this.maptable)();
    }
  }

  scaleAttributes() {
    return Math.pow(this.scale, 2 / 3);
  }

  getWidth() {
    if (this.options.width) {
      return this.options.width;
    }
    return this.node.offsetWidth;
  }

  getHeight() {
    const deltaHeight = (this.options.title) ? 30 : 0;
    if (!this.options.height && this.options.ratioFromWidth) {
      return this.getWidth() * this.options.ratioFromWidth * this.options.scaleHeight + deltaHeight;
    }
    return this.options.height * this.options.scaleHeight + deltaHeight;
  }

  loadGeometries() {
    // We filter world data
    if (this.options.filterCountries) {
      this.jsonWorld.objects.countries.geometries = this.jsonWorld.objects.countries
        .geometries.filter(this.options.filterCountries);
    }

    // Build countries
    if (this.options.countries) this.buildCountries();

    // Build heatmap
    if (this.options.heatmap) this.buildHeatmap();
  }

  buildHeatmap() {
    // Build vectors
    const lands = topojson.merge(this.jsonWorld, this.jsonWorld.objects.countries.geometries);
    if (!this.options.heatmap.disableMask) {
      this.maskHeatmap = this.layerHeatmap.append('defs')
        .append('clipPath')
        .attr('id', 'mt-map-heatmap-mask');

      this.maskHeatmap
          .datum(lands)
          .append('path')
          .attr('class', 'mt-map-heatmap-mask-paths')
          .attr('d', this.path);
    }

    this.canvasHeatmap = d3.select(this.node)
      .append('canvas')
      .attr('id', 'mt-map-heatmap-canvas')
      .attr('width', this.getWidth())
      .attr('height', this.getHeight())
      .attr('style', 'display: none;');

    this.imgHeatmap = this.layerHeatmap
      .append('image')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('class', 'mt-map-heatmap-img');

    if (this.options.heatmap.mask) {
      this.imgHeatmap = this.imgHeatmap.attr('clip-path', 'url(#mt-map-heatmap-mask)');
    }

    if (this.options.heatmap.borders) {
      const borders = topojson.mesh(this.jsonWorld,
        this.jsonWorld.objects.countries, (a, b) => a !== b);

      this.bordersHeatmap = this.layerHeatmap
          .append('g')
          .attr('class', 'mt-map-heatmap-borders');

      this.bordersHeatmap.selectAll('path.mt-map-heatmap-borders-paths')
        .data([lands, borders])
        .enter()
        .append('path')
        .attr('class', 'mt-map-heatmap-borders-paths')
        .attr('fill', 'transparent')
        .attr('stroke-width', this.options.heatmap.borders.stroke)
        .attr('stroke', this.options.heatmap.borders.color)
        .attr('style', `opacity: ${this.options.heatmap.borders.opacity}`)
        .attr('d', this.path);
    }
  }

  getMagnitudeScale(heatmapDataset) {
    const opts = this.options.heatmap;
    const lengthDataset = heatmapDataset.length;
    if (!lengthDataset) return () => 0;
    const layersPerLocation = (opts.circles.max - opts.circles.min) / opts.circles.step;
    const maxOpacityScale = d3.scale.linear()
      .domain([1, lengthDataset * layersPerLocation])
      .range([1, 1 / 256]);
    const centralCircleOpacity = maxOpacityScale(lengthDataset) / lengthDataset;

    const scale = d3.scale.linear()
      .domain([opts.circles.min, opts.circles.max])
      .range([centralCircleOpacity, 0]);
    return (m) => scale(m);
  }

  getDatumScale() {
    if (!this.options.heatmap.weightByAttribute) return () => 1;
    const dataExtents = d3.extent(this.maptable.data, this.options.heatmap.weightByAttribute);
    let scale = d3.scale.linear().domain(dataExtents).range([0, 1]);
    if (this.options.heatmap.weightByAttributeScale === 'log') {
      if (!dataExtents[0]) dataExtents[0] = 0.01;
      scale = d3.scale.log()
        .domain(dataExtents)
        .range([0.01, 1.0]);
    }
    return (d) => {
      const val = this.options.heatmap.weightByAttribute(d);
      if (!val) return 0;
      return scale(val);
    };
  }

  getHeatmapData() {
    const ctx = this.canvasHeatmap.node().getContext('2d');
    ctx.globalCompositeOperation = 'multiply';
    const circles = d3.range(
      this.options.heatmap.circles.min,
      this.options.heatmap.circles.max,
      this.options.heatmap.circles.step
    );
    const datumScale = this.getDatumScale();
    const heatmapDataset = this.maptable.data.filter(d => {
      return datumScale(d) > 0.1;
    });
    const path = this.path.context(ctx);
    const magnitudeScale = this.getMagnitudeScale(heatmapDataset);
    const colorScale = d3.scale.linear()
      .domain([1, 0])
      .range([this.options.heatmap.circles.color, '#FFFFFF']);
    heatmapDataset.forEach((point) => {
      const scaleOpacityDatum = datumScale(point);
      circles.forEach(m => {
        const opacity = magnitudeScale(m) * scaleOpacityDatum;
        if (opacity > 0) {
          ctx.beginPath();
          path(d3.geo.circle().origin([point.longitude, point.latitude]).angle(m - 0.0001)());
          ctx.fillStyle = colorScale(opacity);
          ctx.fill();
          ctx.closePath();
        }
      });
    });
    StackBlur.canvasRGBA(this.canvasHeatmap.node(), 0, 0, this.getWidth(),
      this.getHeight(), this.options.heatmap.circles.blur);
    const dataUrl = this.canvasHeatmap.node().toDataURL();
    ctx.clearRect(0, 0, this.canvasHeatmap.width, this.canvasHeatmap.height);
    return dataUrl;
  }

  updateHeatmap() {
    const dataUrl = this.getHeatmapData();
    this.imgHeatmap.attr('xlink:href', dataUrl);
  }

  buildCountries() {
    this.dataCountries = topojson.feature(this.jsonWorld,
      this.jsonWorld.objects.countries).features;

    // Build country paths
    this.layerCountries
      .selectAll('.mt-map-country')
        .data(this.dataCountries)
        .enter()
        .insert('path')
        .attr('class', 'mt-map-country')
        .attr('d', this.path);

    // Build Country Legend
    this.legendCountry = {};

    if (this.options.countries.attr.fill &&
        this.options.countries.attr.fill.legend &&
        this.options.countries.attr.fill.min &&
        this.options.countries.attr.fill.max) {
      this.legendCountry.fill = new Legend(this);
    }
  }

  updateCountries() {
    // Data from user input
    const dataByCountry = d3.nest()
          .key(d => d[this.options.countryIdentifierKey])
          .entries(this.maptable.data);

    // We merge both data
    this.dataCountries.forEach(geoDatum => {
      geoDatum.key = geoDatum.properties[this.options.countryIdentifierType];
      const matchedCountry = dataByCountry.filter(uDatum => {
        return uDatum.key === geoDatum.key;
      });
      geoDatum.values = (matchedCountry.length === 0) ? [] : matchedCountry[0].values;
      geoDatum.attr = {};
      geoDatum.rollupValue = {};
    });

    // We calculate attributes values
    Object.keys(this.options.countries.attr).forEach(k => {
      this.setAttrValues(k, this.options.countries.attr[k], this.dataCountries);
    });

    // Update SVG
    const countryItem = d3.selectAll('.mt-map-country').each(function (d) {
      const targetPath = this;
      Object.keys(d.attr).forEach(key => {
        d3.select(targetPath).attr(key, d.attr[key]);
      });
    });

    // Update Legend
    Object.keys(this.options.countries.attr).forEach(attrKey => {
      const attrValue = this.options.countries.attr[attrKey];
      if (typeof (attrValue) === 'object' && attrValue.legend) {
        const scaleDomain = d3.extent(this.dataCountries, d => Number(d.rollupValue[attrKey]));
        this.legendCountry[attrKey].updateExtents(scaleDomain);

        // When we mouseover the legend, it should highlight the indice selected
        countryItem.on('mouseover', (d) => {
          this.legendCountry[attrKey].indiceChange(d.rollupValue[attrKey]);
        })
        .on('mouseout', () => {
          this.legendCountry[attrKey].indiceChange(NaN);
        });
      }
    });

    // Update Tooltip
    if (this.options.countries && this.options.countries.tooltip) {
      this.activateTooltip(countryItem, this.tooltipCountriesNode, this.options.countries.tooltip);
    }
  }

  updateMarkers() {
    const defaultGroupBy = a => `${a.longitude},${a.latitude}`;

    this.dataMarkers = d3.nest()
      .key(defaultGroupBy)
      .entries(this.maptable.data)
      .filter(d => {
        return d.values[0].x !== 0;
      });

    // We merge both data
    this.dataMarkers.forEach(d => {
      d.attr = {};
      d.rollupValue = {};
    });

    // We calculate attributes values
    Object.keys(this.options.markers.attr).forEach(k => {
      this.setAttrValues(k, this.options.markers.attr[k], this.dataMarkers);
    });

    // Enter
    const markerItem = this.layerMarkers
      .selectAll('.mt-map-marker')
      .data(this.dataMarkers);
    let markerObject = markerItem.enter();
    if (this.options.markers.customTag) {
      markerObject = this.options.markers.customTag(markerObject);
    } else {
      markerObject = markerObject.append('svg:circle');
    }
    const markerClassName = (this.options.markers.className) ?
      this.options.markers.className : '';

    markerObject.attr('class', `mt-map-marker ${markerClassName}`);

    // Exit
    markerItem.exit().transition()
      .attr('r', 0)
      .attr('fill', '#eee')
      .style('opacity', 0)
      .remove();

    // Update
    const attrX = (this.options.markers.attrX) ? this.options.markers.attrX : 'cx';
    const attrY = (this.options.markers.attrY) ? this.options.markers.attrY : 'cy';

    const attrXDelta = (this.options.markers.attrXDelta) ? this.options.markers.attrXDelta : 0;
    const attrYDelta = (this.options.markers.attrYDelta) ? this.options.markers.attrYDelta : 0;

    const markerUpdate = markerItem
      .attr(attrX, d => d.values[0].x + attrXDelta)
      .attr(attrY, d => d.values[0].y + attrYDelta);

    d3.selectAll('.mt-map-marker').each(function (d) {
      const targetPath = this;
      Object.keys(d.attr).forEach(key => {
        d3.select(targetPath).attr(key, d.attr[key]);
      });
    });

    if (this.options.markers.tooltip) {
      this.activateTooltip(markerUpdate, this.tooltipMarkersNode, this.options.markers.tooltip);
    }
  }

  fitContent() {
    if (this.maptable.data.length === 0) {
      this.transX = 0;
      this.transY = 0;
      this.scale = 1;
      this.zoomListener.translate([this.transX, this.transY])
        .scale(this.scale);
      return;
    }
    const hor = d3.extent(this.maptable.data, d => d.x);
    const ver = d3.extent(this.maptable.data, d => d.y);

    // center dots with the good ratio
    const ratio = this.getWidth() / this.getHeight();
    const deltaMarker = 20 + ((this.options.title) ? 30 : 0);

    const currentWidth = (hor[1] - hor[0]) + deltaMarker;
    const currentHeight = (ver[1] - ver[0]) + deltaMarker;

    const realHeight = currentWidth / ratio;
    const realWidth = currentHeight * ratio;

    let diffMarginWidth = 0;
    let diffMarginHeight = 0;
    if (realWidth >= currentWidth) {
      diffMarginWidth = (realWidth - currentWidth) / 2;
    } else {
      diffMarginHeight = (realHeight - currentHeight) / 2;
    }

    // add layout margin
    hor[0] -= (this.options.fitContentMargin + diffMarginWidth);
    hor[1] += (this.options.fitContentMargin + diffMarginWidth);
    ver[0] -= (this.options.fitContentMargin + diffMarginHeight);
    ver[1] += (this.options.fitContentMargin + diffMarginHeight);

    this.scale = this.getWidth() / (hor[1] - hor[0]);
    this.transX = -1 * hor[0] * this.scale;
    this.transY = -1 * ver[0] * this.scale;

    this.zoomListener.translate([this.transX, this.transY]).scale(this.scale);
  }

  buildTitle() {
    const titleContainer = this.svg
      .append('svg')
      .attr('width', this.getWidth())
      .attr('x', 0)
      .attr('y', (this.getHeight() - 30))
      .attr('height', 30);

    if (this.options.title.bgColor) {
      titleContainer.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', this.getWidth())
        .attr('height', 30)
        .attr('fill', this.options.title.bgColor);
    }

    titleContainer.append('text')
      .attr('id', 'mt-map-title')
      .attr('x', 20)
      .attr('font-size', this.options.title.fontSize)
      .attr('font-family', this.options.title.fontFamily)
      .attr('y', 20);

    if (this.options.title.source) {
      titleContainer.append('text')
        .attr('y', 20)
        .attr('x', (this.getWidth() - 20))
        .attr('text-anchor', 'end')
        .attr('font-size', this.options.title.fontSize)
        .attr('font-family', this.options.title.fontFamily)
        .html(this.options.title.source());
    }
  }

  rescale() {
    const self = this;
    if (d3.event && d3.event.translate) {
      this.scale = d3.event.scale;
      this.transX = (this.scale === 1) ? 0 : d3.event.translate[0];
      this.transY = (this.scale === 1) ? 0 : d3.event.translate[1];
    }

    const maxTransX = 0;
    const maxTransY = 0;
    const minTransX = this.getWidth() * (1 - this.scale);
    const minTransY = this.getHeight() * (1 - this.scale);

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

    this.layerGlobal.attr('transform',
      `translate(${this.transX}, ${this.transY})scale(${this.scale})`);

    // Hide tooltip
    if (self.tooltipCountriesNode) self.tooltipCountriesNode.attr('style', 'display:none;');
    if (self.tooltipMarkersNode) self.tooltipMarkersNode.attr('style', 'display:none;');

    // Rescale markers size
    if (this.options.markers) {
      // markers
      d3.selectAll('.mt-map-marker').each(function (d) {
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
      d3.selectAll('.mt-map-country').style('stroke-width',
        this.options.countries.attr['stroke-width'] / this.scale);
    }

    // Rescale heatmap borders
    if (this.options.heatmap && this.options.heatmap.borders) {
      d3.selectAll('.mt-map-heatmap-borders-paths').style('stroke-width',
        this.options.heatmap.borders.stroke / this.scale);
    }
  }

  setAttrValues(attrKey, attrValue, dataset) {
    if (typeof (attrValue) === 'number' || typeof (attrValue) === 'string') {
      // Static value
      dataset.forEach(d => {
        d.attr[attrKey] = attrValue;
      });
    } else if (typeof (attrValue) === 'object') {
      // Dynamic value
      if (!attrValue.rollup) {
        attrValue.rollup = (d) => d.length;
      }
      if (!attrValue.min || !attrValue.max) {
        throw new Error(`MapTable: You should provide values 'min' & 'max' for attr.${attrKey}`);
      }

      dataset.forEach(d => {
        d.rollupValue[attrKey] = attrValue.rollup(d.values);
      });
      const scaleDomain = d3.extent(dataset, d => Number(d.rollupValue[attrKey]));
      if (attrValue.transform) {
        scaleDomain[0] = attrValue.transform(scaleDomain[0], this.maptable.data);
        scaleDomain[1] = attrValue.transform(scaleDomain[1], this.maptable.data);
      }

      let minValue = attrValue.min;
      let maxValue = attrValue.max;

      if (attrValue.min === 'minValue') {
        minValue = scaleDomain[0];
      }
      if (attrValue.max === 'maxValue') {
        maxValue = scaleDomain[1];
      }

      // check for negative color declarations
      if ((attrValue.maxNegative && !attrValue.minNegative) ||
          (!attrValue.maxNegative && attrValue.minNegative)) {
        throw new Error('MapTable: maxNegative or minNegative undefined. Please declare both.');
      }
      const useNegative = (attrValue.maxNegative && attrValue.minNegative);
      let scaleFunction;
      let scaleNegativeFunction;
      if (useNegative) {
        scaleFunction = d3.scale.linear()
            .domain([0, scaleDomain[1]])
            .range([minValue, maxValue]);

        scaleNegativeFunction = d3.scale.linear()
            .domain([scaleDomain[0], 0])
            .range([attrValue.maxNegative, attrValue.minNegative]);
      } else {
        scaleFunction = d3.scale.linear()
            .domain(scaleDomain)
            .range([minValue, maxValue]);
      }

      dataset.forEach(d => {
        let scaledValue;
        if (!d.values.length || isNaN(d.rollupValue[attrKey])) {
          if (typeof (attrValue.empty) === 'undefined') {
            throw new Error(`MapTable: no empty property found for attr.${attrKey}`);
          }
          scaledValue = attrValue.empty;
        } else {
          const originalValueRaw = d.rollupValue[attrKey];
          const originalValue = (attrValue.transform) ?
              attrValue.transform(originalValueRaw, this.maptable.data) : originalValueRaw;
          if (useNegative && originalValue < 0) {
            scaledValue = scaleNegativeFunction(originalValue);
          } else {
            scaledValue = scaleFunction(originalValue);
          }
        }
        d.attr[attrKey] = scaledValue;
      });
    } else {
      throw new Error(`Maptable: Invalid value for ${attrKey}`);
    }
  }

  render() {
    if (this.options.markers) this.updateMarkers();
    if (this.options.countries) this.updateCountries();
    if (this.options.title) this.updateTitle();
    if (this.options.heatmap) this.updateHeatmap();
    if (this.options.autoFitContent) {
      this.fitContent();
      this.rescale();
    }
  }

  updateTitle() {
    if (this.options.title.content) {
      const showing = this.maptable.data.filter(d => d[this.options.latitudeKey] !== 0).length;
      const total = this.maptable.rawData.filter(d => d[this.options.latitudeKey] !== 0).length;

      let inlineFilters = '';
      if (this.maptable.filters) {
        inlineFilters = this.maptable.filters.getDescription();
      }

      document.getElementById('mt-map-title').innerHTML = this.options.title
        .content(showing, total, inlineFilters);
    }
  }

  activateTooltip(target, tooltipNode, tooltipContent, cb) {
    target.on('mousemove', d => {
      const mousePosition = d3.mouse(this.svg.node()).map(v => parseInt(v, 10));

      const tooltipDelta = tooltipNode.node().offsetWidth / 2;
      const mouseLeft = (mousePosition[0] - tooltipDelta);
      const mouseTop = (mousePosition[1] + 10);

      tooltipNode.attr('style', `top:${mouseTop}px;left:${mouseLeft}px;display:block;`)
        .html(tooltipContent(d))
        .on('mouseout', () => tooltipNode.style('display', 'none'));

      if (cb) {
        tooltipNode.on('click', cb);
      }
    }).on('mouseout', () => tooltipNode.style('display', 'none'));
  }

  exportSvg() {
    // Get the d3js SVG element
    const svg = document.getElementById('mt-map-svg');
    // Extract the data as SVG text string
    const svgXml = (new XMLSerializer).serializeToString(svg);

    if (this.options.exportSvgClient) {
      if (!window.saveAs) {
        throw new Error('MapTable: Missing FileSaver.js library');
      }
      const blob = new Blob([svgXml], { type: 'image/svg+xml' });
      window.saveAs(blob, 'visualization.svg');
    } else if (this.options.exportSvg) {
      const form = document.getElementById('mt-map-svg-form');
      form.querySelector('[name="data"]').value = svgXml;
      form.submit();
    }
  }

  addExportSvgCapability() {
    const exportNode = document.createElement('div');
    exportNode.setAttribute('id', 'mt-map-export');
    document.getElementById('mt-map').appendChild(exportNode);

    const exportButton = document.createElement('button');
    exportButton.setAttribute('class', 'btn btn-xs btn-default');
    exportButton.innerHTML = 'Download';
    exportButton.addEventListener('click', this.exportSvg.bind(this));
    exportNode.appendChild(exportButton);

    if (this.options.exportSvg) {
      const exportForm = document.createElement('div');
      exportForm.innerHTML = `<form id="mt-map-svg-form" method="post"
  action="${this.options.exportSvg}"><input type="hidden" name="data"></form>`;
      exportNode.appendChild(exportForm);
    }
  }
}
