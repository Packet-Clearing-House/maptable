export default {
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
        'stroke-width': 0.5,
      },
      tooltipClassName: 'mt-map-tooltip popover bottom',
    },
    heatmap: {
      maxMagnitude: 180,
      stepMagnitude: 30,
      bandingsColorRGB: '255, 0, 0',
      maxOpacity: (count) => 0.00403 * count + 0.3040,
      mask: true,
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
