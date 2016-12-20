export default {
  map: {
    longitudeKey: 'longitude',
    latitudeKey: 'latitude',
    countryIdentifierKey: 'country_code',
    countryIdentifierType: 'iso_a2',
    zoom: true,
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
        'stroke-width': 0.5,
      },
      tooltipClassName: 'mt-map-tooltip popover bottom',
    },
    heatmap: {
      mask: true,
      circles: {
        min: 1,
        max: 90,
        step: 4,
        color: '#FF0000',
        blur: 4.0,
        magnitudeScale: function () {
          const maxOpacityScale = d3.scale.linear()
            .domain([1, 100])
            .range([0.7, 1.05]);
          const lengthDataset = this.data.length;
          const centralCircleOpacity = maxOpacityScale(lengthDataset) / lengthDataset;

          const scale = d3.scale.linear()
            .domain([
              this.options.map.heatmap.circles.min,
              this.options.map.heatmap.circles.max,
            ])
            .range([centralCircleOpacity, 0]);
          return (m) => scale(m);
        },
      },
      borders: {
        stroke: 1,
        opacity: 0.1,
        color: '#000',
      },
    },
    markers: {
      attr: {
        r: 4,
        fill: 'blue',
        stroke: '#CCC',
        'stroke-width': 0.5,
      },
      tooltipClassName: 'mt-map-tooltip popover bottom',
    },
    title: {
      fontSize: 12,
      fontFamily: 'Helevetica, Arial, Sans-Serif',
    },
  },
  table: {
    className: 'table table-striped table-bordered',
    collapseRowsBy: [],
  },
};
