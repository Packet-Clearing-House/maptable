import utils from '../utils';

export default class Table {
  /**
   * Table componenet constructor
   * @param maptable: Maptable main Object
   * @param options: options communicated to the table
   * @returns {string|*}
   */
  constructor(maptable, options) {
    this.maptable = maptable;
    this.options = options;
    this.sorting = [
      {
        key: Object.keys(this.maptable.data[0])[0],
        mode: 'asc',
      },
    ];
    this.isSorting = false;

    this.containerSelector = maptable.options.target;
    this.container = document.querySelector(maptable.options.target);

    this.node = this.container.querySelector('#mt-table');

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
      const arrayDiff = this.options.show
        .filter(i => Object.keys(this.maptable.columnDetails).indexOf(i) < 0);
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
      .data(this.activeColumns
        .map(k => utils.extendRecursive({ key: k }, this.maptable.columnDetails[k])))
      .enter()
      .append('th')
      .attr('class', (d) => {
        let output = (d.sorting) ? 'mt-table-sortable' : '';
        output += (d.nowrap) ? ' nowrap' : '';
        return output;
      })
      .attr('onselectstart', 'return false;')
      .attr('unselectable', 'on')
      .attr('style', d => ((d.nowrap) ? 'white-space:nowrap;' : ''))
      .on('click', (d) => {
        if (this.isSorting) return;
        this.isSorting = true;
        if (d.sorting) {
          this.sortColumn(d.key);
        }
        this.isSorting = false;
      })
      .text(d => d.title)
      .attr('id', d => `column_header_${utils.sanitizeKey(d.key)}`);

    if (this.options.defaultSorting) {
      if (Array.isArray(this.options.defaultSorting) && this.options.defaultSorting.length === 2) {
        this.sorting = this.options.defaultSorting;
      } else {
        this.sorting = [this.options.defaultSorting];
      }
    }

    // render is triggered by MapTable
    // this.render();

    // On complete
    if (this.options.onComplete && this.options.onComplete.constructor === Function) {
      this.options.onComplete.bind(this.maptable)();
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
      .attr('class', (row) => {
        if (this.options.rowClassName) {
          return `line ${this.options.rowClassName(row)}`;
        }
        return 'line';
      })
      .html((row) => {
        let tds = '';
        this.activeColumns.forEach((columnKey) => {
          const column = this.maptable.columnDetails[columnKey];
          tds += '<td';
          if (column.nowrap) {
            tds += ' style="white-space:nowrap;"';
          }
          tds += '>';

          if (!(
            this.options.collapseRowsBy.indexOf(columnKey) !== -1
              && uniqueCollapsedRows[columnKey]
              && uniqueCollapsedRows[columnKey] === row[columnKey]
          )) {
            if (column.cellContent) {
              tds += column.cellContent(row);
            } else if (column.virtual) {
              tds += column.virtual(row);
            } else if (row[columnKey] && row[columnKey] !== 'null') tds += row[columnKey];
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
    const sortableColums = this.container.querySelectorAll('.mt-table-sortable');
    for (let i = 0; i < sortableColums.length; i += 1) {
      sortableColums[i].setAttribute('class', 'mt-table-sortable');
    }
    this.sorting.forEach((column) => {
      this.container.querySelector(`#column_header_${utils.sanitizeKey(column.key)}`)
        .setAttribute('class', `mt-table-sortable sort_${column.mode}`);
    });
    this.maptable.data = this.maptable.data.sort((a, b) => {
      let compareBool = false;
      this.sorting.forEach((column) => {
        const d3SortMode = (column.mode === 'asc') ? d3.ascending : d3.descending;
        const columnDetails = this.maptable.columnDetails[column.key];
        let el1 = a[column.key];
        let el2 = b[column.key];
        if (columnDetails.dataParse) {
          el1 = columnDetails.dataParse(el1);
          el2 = columnDetails.dataParse(el2);
        } else if (columnDetails.virtual) {
          el2 = columnDetails.virtual(a);
          el2 = columnDetails.virtual(b);
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
  sortColumn(key) {
    const sortIndex = this.sorting.map(d => d.key).indexOf(key);
    const sortValue = { key };
    if (sortIndex === -1) {
      sortValue.mode = 'asc';
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
    this.render();
  }
}
