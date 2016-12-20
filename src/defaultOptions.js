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
