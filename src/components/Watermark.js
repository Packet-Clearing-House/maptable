export default class Legend {
  constructor(map, options) {
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

  buildWatermark() {
    d3.xhr(this.src, res => {
      let mapWatermarkDelta = 0;
      if (this.map.options.title) mapWatermarkDelta = 30;
      let mime;
      let x;
      let y;
      if (this.src.indexOf('.svg') !== -1) {
        mime = 'image/svg+xml';
      } else if (this.src.indexOf('.jpg') !== -1 || this.src.indexOf('.jpeg') !== -1) {
        mime = 'image/jpeg';
      } else if (this.src.indexOf('.png') !== -1) {
        mime = 'image/png';
      } else {
        console.warn('invalid watermark mime type');
        return;
      }
      const dataUri = `data:${mime};base64,${window.btoa(res.responseText)}`;

      if (this.position) {
        const pos = this.position.split(' ');
        if (pos[0] === 'top') {
          y = this.padding;
        } else if (pos[0] === 'middle') {
          y = (this.map.getHeight() - this.height) / 2;
        } else if (pos[0] === 'bottom') {
          y = this.map.getHeight() - this.height - this.padding - mapWatermarkDelta;
        } else {
          console.warn('position should be (top|middle|bottom) (left|middle|right)');
        }

        if (pos[1] === 'left') {
          x = this.padding;
        } else if (pos[1] === 'middle') {
          x = (this.map.getWidth() - this.width) / 2;
        } else if (pos[1] === 'right') {
          x = this.map.getWidth() - this.width - this.padding;
        } else {
          console.warn('position should be (top|middle|bottom) (left|middle|right)');
        }
      }

      this.node = this.map.svg
        .append('image')
        .attr('xlink:href', dataUri)
        .attr('width', this.width)
        .attr('height', this.height);

      if (x && y) {
        this.node.attr('x', x).attr('y', y);
      }

      if (this.style) {
        this.node.attr('style', this.style);
      }
    });
  }
}
