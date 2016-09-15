export default class Legend {
  constructor(map) {
    this.map = map;
    // Create Legend
    this.node = this.map.svg
      .append('g')
      .attr('id', 'mt-map-legend')
      .attr('transform',
        `translate(${(this.map.getWidth() - 350)}, ${(this.map.getHeight() - 60)})`);

    this.buildScale();
    this.buildIndice();
  }

  buildScale() {
    const legendGradient = this.node
    .append('defs')
    .append('linearGradient')
      .attr('id', 'mt-map-legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    if (this.map.options.countries.attr.fill.minNegative &&
        this.map.options.countries.attr.fill.maxNegative) {
      legendGradient.append('stop')
          .attr('offset', '0%')
          .attr('style', `stop-color:${this.map.options.countries.attr.fill.maxNegative};stop-opacity:1`);

      legendGradient.append('stop')
          .attr('offset', '49%')
          .attr('style', `stop-color:${this.map.options.countries.attr.fill.minNegative};stop-opacity:1`);
      legendGradient.append('stop')
          .attr('offset', '50%')
          .attr('style', `stop-color:${this.map.options.countries.attr.fill.min};stop-opacity:1`);
    } else {
      legendGradient.append('stop')
          .attr('offset', '0%')
          .attr('style', `stop-color:${this.map.options.countries.attr.fill.min};stop-opacity:1`);
    }

    legendGradient.append('stop')
    .attr('offset', '100%')
    .attr('style', `stop-color:${this.map.options.countries.attr.fill.max};stop-opacity:1`);

    this.node.append('rect')
      .attr('x', 40)
      .attr('y', 0)
      .attr('width', 220)
      .attr('height', 15)
      .attr('fill', 'url(#mt-map-legend-gradient)');
  }

  buildIndice() {
    const indice = this.node.append('g')
    .attr('id', 'mt-map-legend-indice')
    .attr('style', 'display:none')
    .attr('transform', 'translate(36,15)');

    indice.append('polygon')
      .attr('points', '4.5 0 9 5 0 5')
      .attr('fill', '#222222');

    indice.append('text')
      .attr('x', 4)
      .attr('y', 13)
      .attr('width', 10)
      .attr('height', 10)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Arial')
      .attr('font-size', '9')
      .attr('stroke', '#FFFFF')
      .attr('stroke-width', '1')
      .attr('fill', '#222222')
      .text('0');

    this.node.append('text')
      .attr('id', 'mt-map-legend-min')
      .attr('x', 35)
      .attr('y', 13)
      .attr('width', 35)
      .attr('height', 15)
      .attr('text-anchor', 'end')
      .attr('font-family', 'Arial')
      .attr('font-size', '14')
      .attr('stroke', '#FFFFF')
      .attr('stroke-width', '3')
      .attr('fill', '#222222')
      .text('0');

    this.node.append('text')
      .attr('id', 'mt-map-legend-max')
      .attr('y', 13)
      .attr('x', 265)
      .attr('width', 40)
      .attr('height', 15)
      .attr('text-anchor', 'start')
      .attr('font-family', 'Arial')
      .attr('font-size', '14')
      .attr('stroke', '#FFFFF')
      .attr('stroke-width', '3')
      .attr('fill', '#222222')
      .text('1');
  }

  updateExtents(domain) {
    document.getElementById('mt-map-legend').style.opacity = (domain[0] === domain[1]) ? 0 : 1;
    if (document.getElementById('mt-map-legend-min')) {
      this.node.select('#mt-map-legend-min').text(Math.round(domain[0]));
      this.node.select('#mt-map-legend-max').text(Math.round(domain[1]));
    }
  }

  indiceChange(val) {
    if (isNaN(val)) {
      this.node.select('#mt-map-legend-indice')
        .attr('style', 'display:none');
    } else {
      const maxValue = parseInt(this.node.select('#mt-map-legend-max').text(), 10);
      const positionDelta = (val / maxValue) * 220;
      this.node.select('#mt-map-legend-indice text').text(Math.round(val));
      this.node.select('#mt-map-legend-indice')
        .attr('style', 'display:block')
        .attr('transform', `translate(${(36 + positionDelta)},15)`);
    }
  }
}
