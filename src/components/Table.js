import utils from '../utils';

export default class Table {
  constructor(maptable, options) {
    this.maptable = maptable;
    this.options = options;
    this.currentSorting = { key: Object.keys(this.maptable.data[0])[0], mode: 'desc' };

    this.node = document.querySelector('#mt-table');
    if (!this.node) {
      this.node = document.createElement('div');
      this.node.setAttribute('id', 'mt-table');
      this.maptable.node.appendChild(this.node);
    }

    this.node = d3.select(this.node)
      .append('table')
      .attr('class', this.options.className);

    this.header = this.node.append('thead');

    this.body = this.node.append('tbody');

    if (this.options.show) {
      const arrayDiff = this.options.show.filter(i => {
        return Object.keys(this.maptable.columnDetails).indexOf(i) < 0;
      });
      if (arrayDiff.length > 0) {
        throw new Error(`MapTable: invalid columns "${arrayDiff.join(', ')}"`);
      }
      this.activeColumns = this.options.show;
    } else {
      this.activeColumns = Object.keys(this.maptable.columnDetails);
    }

    this.header.selectAll('tr')
      .data([1])
      .enter()
      .append('tr')
      .selectAll('th')
      .data(this.activeColumns.map(k => Object.assign({ key: k }, this.maptable.columnDetails[k])))
      .enter()
      .append('th')
      .attr('class', d => {
        let output = (d.sorting) ? 'mt-table-sortable' : '';
        output += (d.nowrap) ? ' nowrap' : '';
        return output;
      })
      .attr('style', d => (d.nowrap) ? 'white-space:nowrap;' : '')
      .text(d => d.title)
      .attr('id', d => `column_header_${utils.sanitizeKey(d.key)}`)
      .on('click', d => {
        if (d.sorting) {
          this.sortColumn(d.key);
        }
      });

    if (this.options.defaultSorting) {
      this.sortColumn(this.options.defaultSorting.key, this.options.defaultSorting.mode);
    } else {
      this.render();
    }
  }


  render() {
    // Apply Sort
    this.applySort();

    // Enter
    this.body.selectAll('tr')
      .data(this.maptable.data)
      .enter()
      .append('tr');

    // Exit
    this.body.selectAll('tr')
      .data(this.maptable.data)
      .exit()
      .remove();

    // Update
    const uniqueCollapsedRows = [];
    this.body.selectAll('tr')
      .data(this.maptable.data)
      .attr('class', row => {
        if (this.options.rowClassName) {
          return `line ${this.options.rowClassName(row)}`;
        }
        return 'line';
      })
      .html(row => {
        let tds = '';
        this.activeColumns.forEach(columnKey => {
          const column = this.maptable.columnDetails[columnKey];
          tds += '<td';
          if (column.nowrap) {
            tds += ' style="white-space:nowrap;"';
          }
          tds += '>';

          if (!(
              this.options.collapseRowsBy.indexOf(columnKey) !== -1 &&
              uniqueCollapsedRows[columnKey] &&
              uniqueCollapsedRows[columnKey] === row[columnKey]
            )) {
            if (column.isVirtual) {
              tds += column.virtual(row);
            } else {
              if (row[columnKey] && row[columnKey] !== 'null') tds += row[columnKey];
            }
            if (this.options.collapseRowsBy.indexOf(columnKey) !== -1) {
              uniqueCollapsedRows[columnKey] = row[columnKey];
            }
          }
          tds += '</td>';
        });
        return tds;
      });
  }

  applySort() {
    const d3SortMode = (this.currentSorting.mode === 'asc') ? d3.ascending : d3.descending;
    const columnDetails = this.maptable.columnDetails[this.currentSorting.key];
    this.maptable.data = this.maptable.data.sort((a, b) => {
      let el1 = a[this.currentSorting.key];
      let el2 = b[this.currentSorting.key];
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

  sortColumn(columnKey, columnMode) {
    this.currentSorting.key = columnKey;
    if (columnKey === this.currentSorting.key) {
      this.currentSorting.mode = (this.currentSorting.mode === 'asc') ? 'desc' : 'asc';
    } else if (columnMode) {
      this.currentSorting.mode = columnMode;
    } else {
      this.currentSorting.mode = 'asc';
    }

    const sortableColums = document.querySelectorAll('.mt-table-sortable');
    for (let i = 0; i < sortableColums.length; i++) {
      sortableColums[i].setAttribute('class', 'mt-table-sortable');
    }
    document.getElementById(`column_header_${utils.sanitizeKey(columnKey)}`)
      .setAttribute('class', `mt-table-sortable sort_${this.currentSorting.mode}`);

    this.render();
  }
}
