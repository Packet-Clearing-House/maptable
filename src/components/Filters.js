import utils from '../utils';

export default class Filters {
  constructor(maptable, options) {
    this.maptable = maptable;
    this.options = options;
    this.criteria = [];

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

    this.container = document.createElement('div');
    this.maptable.node.appendChild(this.container);

    this.node = document.querySelector('#mt-filters');
    if (!this.node) {
      this.node = document.createElement('div');
      this.node.setAttribute('id', 'mt-filters');
      this.node.setAttribute('class', 'panel panel-default');
      this.maptable.node.appendChild(this.node);
    }

    // -- Filters Header

    const filtersHeaderNode = document.createElement('div');
    filtersHeaderNode.setAttribute('class', 'panel-heading');

    const filtersResetNode = document.createElement('button');
    filtersResetNode.setAttribute('id', 'mt-filters-reset');
    filtersResetNode.setAttribute('class', 'btn btn-default btn-xs pull-right');
    filtersResetNode.style.display = 'none';
    filtersResetNode.style.marginLeft = 5;
    filtersResetNode.innerText = '↺ Reset';
    filtersResetNode.addEventListener('click', this.reset);
    filtersHeaderNode.appendChild(filtersResetNode);

    const filtersTitleNode = document.createElement('h3');
    filtersTitleNode.setAttribute('class', 'panel-title');
    filtersTitleNode.appendChild(document.createTextNode('Filters'));
    filtersHeaderNode.appendChild(filtersTitleNode);

    this.node.appendChild(filtersHeaderNode);

    // -- Filters Content
    const filtersBodyNode = document.createElement('div');
    filtersBodyNode.setAttribute('id', 'mt-filters-content');
    filtersBodyNode.setAttribute('class', 'panel-body');

    const filtersElementsNode = document.createElement('div');
    filtersElementsNode.setAttribute('id', 'mt-filters-elements');
    filtersBodyNode.appendChild(filtersElementsNode);

    const filtersNewNode = document.createElement('a');
    filtersNewNode.setAttribute('id', 'mt-filters-new');
    filtersNewNode.setAttribute('href', '#');
    filtersNewNode.innerText = '+ New filter';
    filtersNewNode.addEventListener('click', this.add.bind(this));
    filtersBodyNode.appendChild(filtersNewNode);

    this.node.appendChild(filtersBodyNode);
  }

  add() {
    const possibleFilters = this.getPossibleFilters();

    if (possibleFilters.length === 0) {
      return;
    }
    const filterName = possibleFilters[0].key;
    this.create(filterName);
  }

  create(filterName, replaceNode) {
    const rowNode = this.buildRow(filterName);
    if (replaceNode) {
      replaceNode.parentNode.replaceChild(rowNode, replaceNode);
    } else {
      document.querySelector('#mt-filters-elements').appendChild(rowNode);
    }
    this.criteria.push(filterName);
    this.maptable.render();
    if (this.container.style.display === 'none') {
      this.toggle();
    }
  }

  remove(filterName) {
    const rowNode = document.querySelector(`[data-mt-filter-name="${filterName}"]`);
    if (rowNode) rowNode.parentNode.removeChild(rowNode);
    const filterIndex = this.criteria.indexOf(filterName);
    this.criteria.splice(filterIndex, 1);
    this.maptable.render();
  }

  reset() {
    this.criteria = [];
    this.container.innerHTML = '';
    this.refresh();
    this.maptable.map.reset();
  }

  getDescription() {
    const outputArray = [];

    const filtersChildren = document.querySelector('#mt-filters-elements').childNodes;

    for (let i = 0; i < filtersChildren.length; i++) {
      const element = filtersChildren[i];
      const filterName = element.querySelector('.mt-filter-name').value;

      const columnDetails = this.maptable.columnDetails[filterName];

      let line = '';

      if (columnDetails.filterMethod === 'compare') {
        const filterRangeSelect = element.querySelector('.mt-filter-range');
        if (filterRangeSelect.value !== 'any') {
          if (filterRangeSelect.value === 'BETWEEN') {
            const filterValueMin = element.querySelector('.mt-filter-value-min').value;
            const filterValueMax = element.querySelector('.mt-filter-value-max').value;
            if (filterValueMin === '' || filterValueMax === '') continue;
            line += `${columnDetails.title} is between `;
            line += `<tspan font-weight="bold">${filterValueMin}</tspan> and
              <tspan font-weight="bold">${filterValueMax}</tspan>`;
          } else {
            const filterValue = element.querySelector('.mt-filter-value-min').value;
            if (filterValue === '') continue;
            line += `${columnDetails.title} is `;
            line += filterRangeSelect.options[filterRangeSelect.selectedIndex].text;
            line += `<tspan font-weight="bold">${filterValue}</tspan>`;
          }
        }
      } else if (columnDetails.filterMethod === 'field' ||
        columnDetails.filterMethod === 'dropdown') {
        const filterValue = element.querySelector('.mt-filter-value').value;
        if (filterValue === '') continue;
        const separatorWord = (columnDetails.filterMethod === 'field') ? 'contains' : 'is';
        line += `${columnDetails.title} ${separatorWord}
          <tspan font-weight="bold">${filterValue}</tspan>`;
      }
      outputArray.push(line);
    }
    return outputArray.join(', ');
  }

  buildRow(filterName) {
    const that = this;

    const possibleFilters = this.getPossibleFilters();

    const columnDetails = this.maptable.columnDetails[filterName];

    const rowNode = document.createElement('div');
    rowNode.setAttribute('class', 'mt-filter-row');
    rowNode.setAttribute('data-mt-filter-name', filterName);

    // Button to remove filter
    const minusButton = document.createElement('button');
    minusButton.setAttribute('class', 'btn btn-default pull-right');
    minusButton.setAttribute('data-mt-filter-btn-minus', 1);
    minusButton.innerText = '– Remove this filter';
    minusButton.addEventListener('click', () => {
      filterName = rowNode.querySelector('.mt-filter-name').value;
      this.remove(filterName);
    });
    rowNode.appendChild(minusButton);

    // Filters separator "AND"
    const filterSeparator = document.createElement('span');
    filterSeparator.setAttribute('class', 'mt-filters-and');
    filterSeparator.innerText = 'And ';
    rowNode.appendChild(filterSeparator);

    // Filter name select
    const filterNameSelect = document.createElement('select');
    filterNameSelect.setAttribute('class', 'mt-filter-name form-control form-control-inline');
    utils.appendOptions(filterNameSelect, possibleFilters.map(f => {
      return { text: f.title, value: f.key };
    }));
    filterNameSelect.value = filterName;

    filterNameSelect.addEventListener('change', function () {
      const oldFilterName = this.parentNode.getAttribute('data-mt-filter-name');
      const newFilterName = this.value;
      that.create(newFilterName, this.parentNode);
      that.remove(oldFilterName);
      that.refresh();
    });
    rowNode.appendChild(filterNameSelect);

    // Filter verb
    const filterVerb = document.createElement('span');
    filterVerb.innerText = (columnDetails.filterMethod === 'field') ? ' contains ' : ' is ';
    rowNode.appendChild(filterVerb);

    // Filter range
    let filterRange = null;
    if (columnDetails.filterMethod !== 'field' && columnDetails.filterMethod !== 'dropdown') {
      filterRange = document.createElement('select');
      filterRange.setAttribute('class', 'mt-filter-range form-control form-control-inline');
      utils.appendOptions(filterRange, ['any', '=', '≠', '<', '>', '≤', '≥', 'BETWEEN'].map(v => {
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
    const filterValue = document.createElement('div');
    filterValue.style.display = 'inline-block';
    filterValue.setAttribute('class', 'mt-filter-value-container');

    if (columnDetails.filterMethod === 'compare') {
      ['min', 'max'].forEach((val, i) => {
        const filterInput = document.createElement('input');
        filterInput.setAttribute('class',
          `form-control form-control-inline mt-filter-value-${val}`);
        filterInput.setAttribute('type', columnDetails.filterInputType);
        filterInput.addEventListener('keyup', this.maptable.render.bind(this.maptable));
        filterInput.addEventListener('change', this.maptable.render.bind(this.maptable));
        filterValue.appendChild(filterInput);
        if (i === 0) {
          // AND
          const filterValueAnd = document.createElement('span');
          filterValueAnd.setAttribute('class', 'mt-filter-value-and');
          filterValueAnd.innerText = ' and ';
          filterValue.appendChild(filterValueAnd);
        }
      });
    } else if (columnDetails.filterMethod === 'field') {
      const filterInput = document.createElement('input');
      filterInput.setAttribute('class', 'form-control form-control-inline mt-filter-value');
      filterInput.setAttribute('type', 'text');
      filterInput.addEventListener('keyup', this.maptable.render.bind(this.maptable));
      filterInput.addEventListener('change', this.maptable.render.bind(this.maptable));
      filterValue.appendChild(filterInput);
    } else if (columnDetails.filterMethod === 'dropdown') {
      const filterSelect = document.createElement('select');
      filterSelect.setAttribute('class', 'form-control form-control-inline mt-filter-value');

      const uniqueValues = d3.nest().key(d => d[filterName])
        .sortKeys(d3.ascending)
        .entries(this.maptable.rawData);

      utils.appendOptions(filterSelect, [{ text: 'Any', value: '' }].concat(uniqueValues.map(k => {
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

  handleRangeChange(filterRange) {
    const rowNode = filterRange.parentNode;
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

  getPossibleFilters(except) {
    return Object.keys(this.maptable.columnDetails)
      .map(k => utils.extendRecursive({ key: k }, this.maptable.columnDetails[k]))
      .filter(v => {
        return (this.activeColumns.indexOf(v.key) !== -1) &&
        (
          (except && except === v.key) ||
          (this.criteria.indexOf(v.key) === -1 && v.filterMethod && !v.isVirtual)
        );
      });
  }

  filterData() {
    const that = this;
    this.maptable.data = this.maptable.rawData.filter(d => {
          const rowNodes = document.querySelectorAll('.mt-filter-row');
    let matched = true;
    for (let i = 0; i < rowNodes.length && matched; i++) {
      const rowNode = rowNodes[i];
      const filterName = rowNode.getAttribute('data-mt-filter-name');
      const columnDetails = that.maptable.columnDetails[filterName];
      const fmt = columnDetails.dataParse; // shortcut

      if (columnDetails.filterMethod === 'dropdown') {
        const filterValue = rowNode.querySelector('.mt-filter-value').value;
        if (filterValue === '') continue;
        if (d[filterName] !== filterValue) matched = false;
      } else if (columnDetails.filterMethod === 'field') {
        const filterValue = rowNode.querySelector('.mt-filter-value').value;
        if (filterValue === '') continue;
        return (d[filterName].toLowerCase().indexOf(filterValue.toLowerCase()) !== -1);
      } else if (columnDetails.filterMethod === 'compare') {
        const filterRange = rowNode.querySelector('.mt-filter-range').value;
        if (filterRange === 'BETWEEN') {
          const filterValueMin = rowNode.querySelector('.mt-filter-value-min').value;
          const filterValueMax = rowNode.querySelector('.mt-filter-value-max').value;
          if (filterValueMin === '' || filterValueMax === '') continue;
          if (fmt &&
              (fmt(d[filterName]) < fmt(filterValueMin) ||
              fmt(d[filterName]) > fmt(filterValueMax))
          ) {
            matched = false;
          } else if (
              parseInt(d[filterName], 10) < parseInt(filterValueMin, 10) ||
              parseInt(d[filterName], 10) > parseInt(filterValueMax, 10)
          ) {
            matched = false;
          }
        } else {
          const filterValue = rowNode.querySelector('.mt-filter-value-min').value;
          if (filterValue === '') continue;
          if (fmt && !utils.rangeToBool(fmt(d[filterName]), filterRange, fmt(filterValue))) {
            matched = false;
          } else if (!fmt && !utils.rangeToBool(d[filterName], filterRange, filterValue)) {
            matched = false;
          }
        }
      }
    }
    if (d[filterName].toLowerCase().indexOf(filterValue.toLowerCase()) !== -1) {
      matched = false;
    }
  });
  }

  refresh() {
    // update dropdown
    const filterNameSelects = document.querySelectorAll('.mt-filter-name');
    for (let i = 0; i < filterNameSelects.length; i++) {
      const filterNameSelect = filterNameSelects[i];
      const filterName = filterNameSelect.value;
      const possibleFilters = this.getPossibleFilters(filterName);
      filterNameSelect.innerHTML = '';
      utils.appendOptions(filterNameSelect, possibleFilters.map(f => {
        return { text: f.title, value: f.key };
      }));
      filterNameSelect.value = filterName;
    }

    // Hide the first "And"
    if (document.querySelectorAll('.mt-filters-and').length > 0) {
      document.querySelectorAll('.mt-filters-and')[0].style.visibility = 'hidden';
    }

    // Check if we reached the maximum of allowed filters
    const disableNewFilter = (!this.getPossibleFilters().length);
    document.querySelector('#mt-filters-new').style.visibility = disableNewFilter ?
      'hidden' : 'visible';
  }

  toggle() {
    if (this.container.style.display === 'none') {
      this.container.style.display = 'block';
      if (this.criteria.length === 0) {
        this.add();
      }
    } else {
      this.container.style.display = 'none';
    }
  }
}
