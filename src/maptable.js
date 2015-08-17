var MapTable = (function (d3) {

  // ****************************
  var maptable_node = null;

  // ****************************
  // ********* OPTIONS **********
  // ****************************

  var custom_options = {};

  var default_options = {
    data: {
      longitude_key: "longitude",
      latitude_key: "latitude",
      filters: {
        enabled: true
      }
    },
    map: {
      width: 900,
      height: 390,
      legend: false,
      auto_width: true,
      ratio_from_width: 0.5,
      scale_height: 1,
      scale_zoom: [1, 10],
      animation_duration: 750,
      fit_content_margin: 10,
      auto_fit_content: true,
      show_null_coordinates: false,
      tooltip_class: "popover bottom",
      title: {
        font_size: 12,
        font_family: "Helevetica, Arial, Sans-Serif"
      }
    },
    table: {
      class: "table table-striped table-bordered",
      collapse_rows_by: []
    }
  };

  var options = {};


  // ****************************
  // *********** DATA ***********
  // ****************************

  var data = {
    raw: [],
    filtered: [],
    map: {
      markers: [],
      countries: []
    },
    column_details: function (column_name) {
      obj = null;
      options.data.columns.forEach(function (f) {
        if (f.id == column_name) {
          obj = f;
        }
        return;
      });
      return obj;
    },

    filters: {
      node: null,
      criteria: [],
      add: function () {
        row = data.filters.build_row();
        document.getElementById("mt-filters-elements").appendChild(row.node);
        data.filters.criteria.push(row.name);

        data.filters.refresh();
        if (document.getElementById("mt-filters-elements").style.display == "none") {
          data.filters.toggle();
        }
      },
      reset: function () {
        data.filters.criteria = [];
        document.getElementById("mt-filters-elements").innerHTML = "";
        data.filters.refresh();
        if(map.enabled){
          map.transX = 0;
          map.transY = 0;
          map.scale = 1;
          map.zoomListener.translate([map.transX, map.transY])
            .scale(map.scale);
        }
        window.setTimeout(data.update_ui, options.map.animation_duration);
      },
      describe: function () {
        var output_array = [];

        var filter_elements = document.getElementById("mt-filters-elements").childNodes;

        for (i = 0; i < filter_elements.length; i++) {
          element = filter_elements[i];
          filter_name = element.querySelector(".mt-filters-dropdown").value;


          filter_options = data.column_details(filter_name);

          var output = "";



          if (filter_options.type == "number" || filter_options.type == "custom") {
            filter_range_select = element.querySelector(".mt-filters-range");
            if (filter_range_select.value != "any") {
              if(filter_range_select.value == "BETWEEN"){
                filter_value_min = element.querySelector(".mt-filters-input").value;
                filter_value_max = element.querySelector(".mt-filters-input1").value;
                if(filter_value_min == "" || filter_value_max == "") continue;
                output += filter_options.displayName + " is between ";
                output += '<tspan font-weight="bold">' + filter_value_min + '</tspan>' + " and "+ '<tspan font-weight="bold">' + filter_value_max + '</tspan>';
              }
              else{
                filter_value = element.querySelector(".mt-filters-input").value;
                if(filter_value == "") continue;
                output += filter_options.displayName;
                output += " is ";
                output += filter_range_select.options[filter_range_select.selectedIndex].text + " ";
                output += '<tspan font-weight="bold">' + filter_value + '</tspan>';
              }
            }
          }
          else if(filter_options.type == "field"){
            filter_value = element.querySelector(".mt-filters-input").value;
            if(filter_value == "") continue;
            output += filter_options.displayName;
            output += " contains ";
            output += '<tspan font-weight="bold">' + filter_value + '</tspan>';
          }
          else if(filter_options.type == "dropdown"){
            filter_value = element.querySelector(".mt-filters-select").value;
            if(filter_value == "") continue;
            output += filter_options.displayName;
            output += " is ";
            output += '<tspan font-weight="bold">' + filter_value + '</tspan>';
          }

          output_array.push(output);
        }
        return output_array.join(', ');
      },
      build_row : function (filter_name) {
        var remaining_filters = data.filters.get_remaining_filters();

        if (remaining_filters.length == 0) return {
          node: null,
          name: null
        };

        if (typeof (filter_name) !== "string") filter_name = remaining_filters[0].id;

        var filter_options = data.column_details(filter_name);

        // Filter node
        var row = document.createElement("div");
        row.setAttribute("class", "mt-filters-element");

        // Button to remove filter
        btn_minus = document.createElement("button");
        btn_minus.setAttribute("class", "btn btn-default btn-minus pull-right");
        btn_minus.innerText = "– Remove this filter";
        btn_minus.addEventListener("click", function () {
          filter_name = row.querySelector(".mt-filters-dropdown").value;
          row.remove();
          filter_index = data.filters.criteria.indexOf(filter_name);
          data.filters.criteria.splice(filter_index, 1);

          data.filters.refresh();

          data.update_ui();
        });
        row.appendChild(btn_minus);

        // Filter verb
        var filter_and = document.createElement("span");
        filter_and.setAttribute("class", "mt-filters-and");
        filter_and.innerText = "And ";
        row.appendChild(filter_and);

        // Filter name select
        var filter_select = document.createElement("select");
        filter_select.setAttribute("class", "mt-filters-dropdown form-control form-control-inline");
        filter_select.setAttribute("data-current", filter_name);
        filter_select = data.filters.append_options(filter_select, remaining_filters);
        filter_select.value = filter_name;

        filter_select.addEventListener("change", function() {
          var li, new_filter_name, new_li, old_filter_index, old_filter_name;
          li = this.parentNode;
          old_filter_name = this.getAttribute("data-current");
          new_filter_name = this.value;

          old_filter_index = data.filters.criteria.indexOf(old_filter_name);
          data.filters.criteria.splice(old_filter_index, 1);

          row = data.filters.build_row(new_filter_name);
          new_li = row.node;

          data.filters.criteria.push(row.name);

          li.parentNode.replaceChild(new_li, li);

          data.filters.refresh();
          data.update_ui();
        });
        row.appendChild(filter_select);

        // Filter verb
        var filter_verb = document.createElement("span");
        if (filter_options.type == "field") {
          filter_verb.innerText = " contains ";
        }
        else {
          filter_verb.innerText = " is ";
        }
        row.appendChild(filter_verb);

        // Filter range
        if (filter_options.type != "field" && filter_options.type != "dropdown") {
          var filter_range = document.createElement("select");
          filter_range.setAttribute("class", "mt-filters-range form-control form-control-inline");
          ["any","=","≠","<",">","≤","≥","BETWEEN"].forEach(function (r) {
            option = document.createElement("option");
            option.value = r;
            option.innerText = r;
            filter_range.appendChild(option);
          });
          filter_range.addEventListener("change", function () {
            data.filters.change_range(this);
            data.update_ui();
          });
          row.appendChild(filter_range);

          // Little space:
          row.appendChild(document.createTextNode(" "));

        }

        // Filter value
        var filter_value = document.createElement("div");
        filter_value.style.display = "inline-block";
        filter_value.setAttribute("class", "mt-filters-value");

        if (filter_options.type == "number" || filter_options.type == "custom") {
          var filter_input = new Array();
          for(var i = 0; i < 2 ; i++){
            filter_input[i] = document.createElement("input");
            filter_input[i].setAttribute("class", "form-control form-control-inline mt-filters-input" + ((i==0) ? "" : i) );
            if(filter_options.input_type){
              filter_input[i].setAttribute("type", filter_options.input_type);
            }
            else{
              filter_input[i].setAttribute("type", "text");
            }
            filter_input[i].addEventListener("keyup", data.update_ui);
            filter_input[i].addEventListener("change", data.update_ui);
            filter_value.appendChild(filter_input[i]);
            if(i==0){
              // AND
              var filter_value_and = document.createElement("span");
              filter_value_and.setAttribute("class", "mt-filters-and-input");
              filter_value_and.innerText = " and ";
              filter_value.appendChild(filter_value_and);
            }
          }
        }
        else if(filter_options.type == "field"){
          filter_input = document.createElement("input");
          filter_input.setAttribute("class", "form-control form-control-inline mt-filters-input");
          filter_input.setAttribute("type", "text");
          filter_input.addEventListener("keyup", data.update_ui);
          filter_input.addEventListener("change", data.update_ui);
          filter_value.appendChild(filter_input);
        }
        else if(filter_options.type == "dropdown"){
          var filter_select = document.createElement("select");
          filter_select.setAttribute("class", "form-control form-control-inline mt-filters-select");
          unique_values = d3.nest()
            .key(function (d) {
              return d[filter_name]
            })
            .sortKeys(d3.ascending)
            .entries(data.raw);

          option = document.createElement("option");
          option.value = "";
          option.innerText = "Any";
          filter_select.appendChild(option);

          unique_values.forEach(function (d) {
            option = document.createElement("option");
            option.value = d.key;
            option.innerText = d.key;
            filter_select.appendChild(option);
          });
          filter_select.addEventListener("change", data.update_ui);
          filter_value.appendChild(filter_select);
        }

        row.appendChild(filter_value);

        if (typeof (filter_range) != "undefined") {
          data.filters.change_range(filter_range);
        }

        return {
          node: row,
          name: filter_name
        };
      },
      change_range: function (filter_range) {
        if(filter_range.value == "any"){
          filter_range.parentNode.querySelector(".mt-filters-value").style.display = "none";
        }
        else{
          filter_range.parentNode.querySelector(".mt-filters-value").style.display = "inline-block";
          if(filter_range.value == "BETWEEN"){
            filter_range.parentNode.querySelector(".mt-filters-input1").style.display = "inline-block";
            filter_range.parentNode.querySelector(".mt-filters-and-input").style.display = "inline-block";
          }
          else{
            filter_range.parentNode.querySelector(".mt-filters-input1").style.display = "none";
            filter_range.parentNode.querySelector(".mt-filters-and-input").style.display = "none";
          }
        }
      },
      refresh: function () {
        // update dropdown
        dropdowns = document.querySelectorAll('.mt-filters-dropdown');
        for (var i = 0; i < dropdowns.length; i++) {
          filter_select = dropdowns[i];
          filter_name = filter_select.value;
          remaining_filters = data.filters.get_remaining_filters(filter_name);
          filter_select.innerHTML = "";
          filter_select = data.filters.append_options(filter_select, remaining_filters);
          filter_select.value = filter_name;
        };

        // Hide the first "And"
        if(document.querySelectorAll(".mt-filters-and").length > 0)
          document.querySelectorAll(".mt-filters-and")[0].style.visibility = "hidden";

        // Check if we reached the maximum of allowed filters
        disableNewFilter = (data.filters.get_remaining_filters().length == 0);
        document.getElementById("mt-filters-new").disabled = disableNewFilter;

        btns = document.querySelectorAll(".btn-minus");
        for (i = 0; i < btns.length; i++) {
          btns[i].disabled = disableNewFilter;
        };
      },
      append_options: function (select, options, default_value) {
        options.forEach(function (f) {
          // Filter select
          option = document.createElement("option");
          option.setAttribute("value", f.id);
          option.innerText = f.displayName;
          select.appendChild(option);
        });
        select.value = default_value;
        return select;
      },
      get_remaining_filters: function (except) {
        return options.data.columns.filter(function (v) {
          return (except && except == v.id) || (
            data.filters.criteria.indexOf(v.id) === -1 && v.type && v.type !== "virtual"
          );
        });
      },
      toggle: function () {
        if (document.getElementById("mt-filters-elements").style.display == "none") {
          document.getElementById("mt-filters-elements").style.display = "block";
          if (data.filters.criteria.length == 0) {
            data.filters.add();
          }
        }
        else {
          document.getElementById("mt-filters-elements").style.display = "none";
        }
      },
      range_to_bool: function (el1, range, el2) {
        if (range == "=") {
          return parseInt(el1) == parseInt(el2);
        }
        else if (range == "≠") {
          return parseInt(el1) != parseInt(el2) && el1!= "" && el2 != "";
        }
        else if (range == ">") {
          return parseInt(el1) > parseInt(el2) && el1!= "" && el2 != "";
        }
        else if (range == "<") {
          return parseInt(el1) < parseInt(el2) && el1!= "" && el2 != "";
        }
        else if (range == "≥") {
          return parseInt(el1) >= parseInt(el2) && el1!= "" && el2 != "";
        }
        else if (range == "≤") {
          return parseInt(el1) <= parseInt(el2) && el1!= "" && el2 != "";
        }
        else {
          return true;
        }
      },

      apply: function () {
        data.filtered = data.raw.filter(function (d) {
          filter_elements = document.getElementsByClassName("mt-filters-element");
          for (i = 0; i < filter_elements.length; i++) {
            li = filter_elements[i];
            filter_name = li.querySelector(".mt-filters-dropdown")
              .value;
            filter_options = data.column_details(filter_name);

            if (filter_options.type == "dropdown") {
              filter_value = li.querySelector(".mt-filters-select").value;
              if(filter_value == "") continue;
              if (d[filter_name] != filter_value) return false;
            }
            else if (filter_options.type == "field") {
              filter_value = li.querySelector(".mt-filters-input").value;
              if(filter_value == "") continue;
              if (d[filter_name].toLowerCase()
                .indexOf(filter_value.toLowerCase()) === -1) return false;
            }
            else if (filter_options.type == "number" || filter_options.type == "custom" ) {
              filter_range = li.querySelector(".mt-filters-range").value;
              if(filter_range == "BETWEEN"){
                filter_value_min = li.querySelector(".mt-filters-input").value;
                filter_value_max = li.querySelector(".mt-filters-input1").value;
                if(filter_value_min == "" || filter_value_max == "") continue;

                if (filter_options.type == "custom") {
                  if(filter_options.dataFormat(d[filter_name]) < filter_options.dataFormat(filter_value_min) || filter_options.dataFormat(d[filter_name]) > filter_options.dataFormat(filter_value_max)) return false;
                }
                else{
                  if(parseInt(d[filter_name]) < parseInt(filter_value_min) || parseInt(d[filter_name]) > parseInt(filter_value_max)) return false;
                }
              }
              else{
                filter_value = li.querySelector(".mt-filters-input").value;
                if(filter_value == "") continue;
                if (filter_options.type == "custom") {
                  if (!data.filters.range_to_bool(filter_options.dataFormat(d[filter_name]), filter_range, filter_options.dataFormat(filter_value))) return false;
                }
                else{
                  if (!data.filters.range_to_bool(d[filter_name], filter_range, filter_value)) return false;
                }
              }
            }
          };
          return true;
        });

      }
    },

    load: function (error, _data) {
      if (map.enabled) {
        data.raw = _data.map(function (d) {
          d.longitude = Number(d[options.data.longitude_key]);
          d.latitude = Number(d[options.data.latitude_key]);
          coord = map.projection([d.longitude, d.latitude]);
          d.x = coord[0];
          d.y = coord[1];
          return d;
        });
        d3.json(options.map.path, map.load_geometries);
      }
      else {
        data.raw = _data;
      }
      data.filtered = data.raw;

      if (table.enabled) {
        table.render();
        if (options.table.default_sorting) {
          table.sorting.sort_column(options.table.default_sorting.id, options.table.default_sorting.mode);
        }
      }

    },
    update_ui: function () {
      // Refilter data
      data.filters.apply();

      if(map.enabled){

        // Auto Fit content
        rescale_with_animation = false
        if (options.map.auto_fit_content === true && data.filtered.length != data.raw.length) {
          rescale_with_animation = true;
          map.fit_content();
        }

        // Markers
        map.update_markers();

        // Countries
        map.update_countries();

        // Rescale map
        map.rescale(rescale_with_animation);

        // Title
        if (document.getElementById('mt-map-title')) {
          showing = data.filtered.filter(function (d) {
              return d[options.data.latitude_key] == 0 && !options.map.show_null_coordinates ? false : true;
            })
            .length;
          total = data.raw.filter(function (d) {
              return d[options.data.latitude_key] == 0 && !options.map.show_null_coordinates ? false : true;
            })
            .length;
          inline_filters = "";

          if (data.filters.criteria.length > 0) {
            inline_filters = data.filters.describe();
          }
          document.getElementById('mt-map-title').innerHTML = options.map.title.content(showing, total, inline_filters);
        }
      }

      // Reset button
      if(data.filters.enabled) document.getElementById("mt-filters-reset").style.display = (data.raw.length != data.filtered.length) ? "block" : "none";

      // Render table
      if (table.enabled) {
        table.render();
        table.sorting.apply();
      }
    }
  };

  // ****************************
  // *********** MAP ************
  // ****************************
  var map = {
    node: null,
    node_legend: null,
    enabled: false,
    scale: 1,
    transX: 0,
    transY: 0,

    projection: null,

    g_global: null,
    g_markers: null,
    g_countries: null,

    zoomListener: null,

    scale_attributes: function () {
      return Math.pow(map.scale, 2 / 3);
    },

    width: function () {
      if (options.map.auto_width) {
        return map.node.offsetWidth;
      }
      else {
        return options.map.width;
      }
    },

    height: function () {
      delta_height = (options.map.title != null) ? 30 : 0;
      if (options.map.auto_width && options.map.ratio_from_width) {
        return map.width() * options.map.ratio_from_width * options.map.scale_height + delta_height;
      }
      else {
        return options.map.height * options.map.scale_height + delta_height;
      }
    },

    load_geometries: function (error, world) {
      data_geometries = topojson.object(world, world.objects.countries)
        .geometries;

      // If we have data concerning that affect countries
      if (options.map.countries.group_by != null) {
        data_countries = d3.nest()
          .key(options.map.countries.group_by)
          .entries(data.filtered);

        data_countries_assoc = {};
        for (var i = 0; i < data_countries.length; i++) {
          data_countries_assoc[data_countries[i].key] = data_countries.values;
        }
      }
      else {
        data_countries = [];
        data_countries_assoc = {};
      }

      // Put data_countries into data_geometries if available
      for (var i = 0; i < data_geometries.length; i++) {
        data_geometries[i].key = data_geometries[i].id;
        data_geometries[i].values = [];
      }

      // Create countries
      u = map.g_countries.selectAll(".mt-map-country")
        .data(data_geometries)
        .enter()
        .insert("path")
        .attr("class", "mt-map-country")
        .attr("d", d3.geo.path().projection(map.projection));

      if(options.map.legend){
        // Create Legend
        map.node_legend = map.svg
          .append("g")
          .attr("transform", "translate(" + (map.width() - 300) + ", " + (map.height() - 60) + ")");

        map_legend_gradient = map.node_legend
        .append("defs")
        .append("linearGradient")
        .attr("id", "mt-map-legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");



        map_legend_gradient.append("stop")
        .attr("offset", "0%")
        .attr("style", "stop-color:" + options.map.countries.attr.fill[0] + ";stop-opacity:1");

        map_legend_gradient.append("stop")
        .attr("offset", "100%")
        .attr("style", "stop-color:" + options.map.countries.attr.fill[1] + ";stop-opacity:1");

        map.node_legend.append("rect")
          .attr("x", 40)
          .attr("y", 0)
          .attr("width", 220)
          .attr("height", 15)
          .attr("fill", "url(#mt-map-legend-gradient)");


        map_legend_indice = map.node_legend.append("g")
        .attr("id", "mt-map-legend-indice")
        .attr("style", "display:none")
        .attr("transform", "translate(36,15)");

        map_legend_indice.append("polygon")
          .attr("points", "4.5 0 9 5 0 5")
          .attr("fill", "#222222");

        map_legend_indice.append("text")
          .attr("x", 4)
          .attr("y", 13)
          .attr("width", 10)
          .attr("height", 10)
          .attr("text-anchor", "middle")
          .attr("font-family", "Arial")
          .attr("font-size", "9")
          .attr("stroke", "#FFFFF")
          .attr("stroke-width", "1")
          .attr("fill", "#222222")
          .text("0");

        map.node_legend.append("text")
          .attr("id", "mt-map-legend-min")
          .attr("x", 35)
          .attr("y", 13)
          .attr("width", 35)
          .attr("height", 15)
          .attr("text-anchor", "end")
          .attr("font-family", "Arial")
          .attr("font-size", "14")
          .attr("stroke", "#FFFFF")
          .attr("stroke-width", "3")
          .attr("fill", "#222222")
          .text("0");

        map.node_legend.append("text")
          .attr("id", "mt-map-legend-max")
          .attr("y", 13)
          .attr("x", 265)
          .attr("width", 40)
          .attr("height", 15)
          .attr("text-anchor", "start")
          .attr("font-family", "Arial")
          .attr("font-size", "14")
          .attr("stroke", "#FFFFF")
          .attr("stroke-width", "3")
          .attr("fill", "#222222")
          .text("1");
      }

      data.update_ui();

      if(options.map.complete != null)
        options.map.complete();

    },

    fit_content: function () {
      if(data.filtered.length == 0){
        if(map.enabled){
          map.transX = 0;
          map.transY = 0;
          map.scale = 1;
          map.zoomListener.translate([map.transX, map.transY])
            .scale(map.scale);
        }
        return true;
      }
      hor = d3.extent(data.filtered, function (d) {
        return d.x;
      });
      ver = d3.extent(data.filtered, function (d) {
        return d.y;
      });

      // center dots with the good ratio
      ratio = map.width() / map.height();

      delta_marker = 20;

      currentW = (hor[1] - hor[0]) + delta_marker;
      currentH = (ver[1] - ver[0]) + delta_marker;

      realH = currentW / ratio;
      realW = currentH * ratio;

      diff_margin_width = 0;
      diff_margin_height = 0;

      if (realW >= currentW) {
        diff_margin_width = (realW - currentW) / 2;
      }
      else {
        diff_margin_height = (realH - currentH) / 2;
      }

      // add layout margin
      hor[0] -= (options.map.fit_content_margin + diff_margin_width);
      hor[1] += (options.map.fit_content_margin + diff_margin_width);
      ver[0] -= (options.map.fit_content_margin + diff_margin_height);
      ver[1] += (options.map.fit_content_margin + diff_margin_height);

      map.scale = map.width() / (hor[1] - hor[0]);
      map.transX = -1 * hor[0] * map.scale;
      map.transY = -1 * ver[0] * map.scale;

      map.zoomListener.translate([map.transX, map.transY])
        .scale(map.scale);
    },
    rescale: function (withTransition) {
      if (d3.event != null && typeof (d3.event.translate) != "undefined") {
        map.scale = d3.event.scale;
        map.transX = (map.scale == 1) ? 0 : d3.event.translate[0];
        map.transY = (map.scale == 1) ? 0 : d3.event.translate[1];
      }

      var maxTransX = 0,
        maxTransY = 0,
        minTransX = map.width() * (1 - map.scale),
        minTransY = map.height() * (1 - map.scale);

      if (map.transY > maxTransY) {
        map.transY = maxTransY;
      }
      else if (map.transY < minTransY) {
        map.transY = minTransY;
      }

      if (map.transX > maxTransX) {
        map.transX = maxTransX;
      }
      else if (map.transX < minTransX) {
        map.transX = minTransX;
      }

      if (d3.event != null && typeof (d3.event.translate) != "undefined") {
        d3.event.translate[0] = map.transX;
        d3.event.translate[1] = map.transY;
      }

      g_temp = map.g_global;
      // if (withTransition) {
      //   g_temp = map.g_global.transition()
      //     .ease('cubic-inOut')
      //     .duration(options.map.animation_duration);
      // }
      g_temp.attr("transform", "translate(" + map.transX + ", " + map.transY + ")scale(" + map.scale + ")");

      // Rescale attributes
      if (options.map.markers != null) {
        // markers
        d3.selectAll(".mt-map-marker")
          .each(function (d) {
            // stroke
            if (d.prop['stroke-width'] != null) {
              d3.select(this)
                .attr("stroke-width", d.prop['stroke-width'] / map.scale_attributes());
            }
            // radius
            if (d.prop['r'] != null) {
              d3.select(this)
                .attr("r", d.prop['r'] / map.scale_attributes());
            }
          });
        // countries
        d3.selectAll(".mt-map-country")
          .each(function (d) {
            // stroke
            if (d.prop['stroke-width'] != null) {
              d3.select(this)
                .attr("stroke-width", d.prop['stroke-width'] / map.scale_attributes());
            }
          });
      }
    },

    get_scaled_value: function (obj, key, d_one, d_all) {
      output = null;
      if (obj.rollup == null) {
        if (typeof (obj.attr[key]) == "object") {
          throw "Error - no rollup and property is an oject: " + key;
        }
        else {
          output = obj.attr[key];
        }
      }
      else {
        if (obj.attr[key] instanceof Array) {
          var domain = d3.extent(d_all, function (d) {
            return obj.rollup(d.values);
          });

          var range = obj.attr[key].slice(0); // We copy the variable instead of reference

          if (obj.attr[key][0] == "min") {
            range[0] = domain[0];
          }
          if (obj.attr[key][1] == "max") {
            range[1] = domain[1];
          }

          if (range.length == 3) {
            if (typeof (range[2]) == "function") {
              range[0] = range[2](range[0]);
              range[1] = range[2](range[1]);
            }
            else if (typeof (range[2]) == "number") {
              range[0] = range[0] * range[2];
              range[1] = range[1] * range[2];
            }
            range.pop();
          }
          // Dynamic value
          var scale = d3.scale.linear()
            .domain(domain)
            .range(range);

          el = d_all.filter(function (d) {
            return d.key == d_one.key
          });

          if (el.length == 0) {
            if (obj.attr_empty != null && obj.attr_empty[key] != null) {
              output = obj.attr_empty[key];
            }
            else {
              throw "Error - attr_empty[" + key + "] not found";
            }
            d_one.value = 0;
          }
          else {
            d_one.value = obj.rollup(el[0].values);
            output = scale(d_one.value);
          }
        }
        else if (typeof (obj.attr[key]) == "number" || typeof (obj.attr[key]) == "string") {
          // Static value
          output = obj.attr[key];
        }
        else {
          // Error value
          throw "Invalid value for " + key;
        }
      }
      return output;
    },

    update_markers: function () {
      if (options.map.markers != null) {

        if (options.map.markers.group_by != null) {
          data_markers = d3.nest()
            .key(options.map.markers.group_by)
            .entries(data.filtered)
            .filter(function (d) {
              return d.values[0].latitude == 0 && !options.map.show_null_coordinates ? false : true;
            });
        }
        else {
          data_markers = d3.nest()
            .key(function(a){
              return a.longitude + "," + a.latitude;
            })
            .entries(data.filtered)
            .filter(function (d) {
              return d.values[0].latitude == 0 && !options.map.show_null_coordinates ? false : true;
            });
        }



        var markers = map.g_markers.selectAll(".mt-map-marker")
          .data(data_markers);

        // Enter
        markers_obj = markers.enter()
        if(options.map.markers.custom_marker != null){
          markers_obj = options.map.markers.custom_marker(markers_obj);
        }
        else{
          markers_obj = markers_obj.append("svg:circle");
        }
        class_name = (options.map.markers.class_name != null) ? options.map.markers.class_name : "";

        markers_obj.attr("class", "mt-map-marker " + class_name);

        // Exit
        markers.exit()
          .remove();

        attr_x = (options.map.markers.attr_x != null) ? options.map.markers.attr_x : "cx";
        attr_y = (options.map.markers.attr_y != null) ? options.map.markers.attr_y : "cy";

        attr_x_delta = (options.map.markers.attr_x_delta != null) ? options.map.markers.attr_x_delta : 0;
        attr_y_delta = (options.map.markers.attr_y_delta != null) ? options.map.markers.attr_y_delta : 0;

        // Update
        u = markers
          .attr(attr_x, function (d) {
            return d.values[0].x + attr_x_delta;
          })
          .attr(attr_y, function (d) {
            return d.values[0].y + attr_y_delta;
          });

        if (options.map.markers.attr != null) {
          for (var key in options.map.markers.attr) {
            u.attr(key, function (d_one) {
              if (d_one.prop == null) d_one.prop = {};
              d_one.prop[key] = map.get_scaled_value(options.map.markers, key, d_one, data_markers);
              return d_one.prop[key];
            });
          }
        }

        if (options.map.markers.tooltip != null) {
          map.tooltip.activate(u, options.map.markers.tooltip);
        }
      }
    },

    update_countries: function () {
      if (options.map.countries.attr != null) {
        if (options.map.countries.group_by != null) {
          data_countries = d3.nest()
            .key(options.map.countries.group_by)
            .entries(data.filtered);

          data_countries_assoc = {};
          for (var i = 0; i < data_countries.length; i++) {
            data_countries_assoc[data_countries[i].key] = data_countries[i].values;
          }
        }
        else {
          data_countries = [];
          data_countries_assoc = {};
        }

        if(options.map.legend && document.getElementById('mt-map-legend-min')){
          var domain = d3.extent(data_countries, function (d) {
            return options.map.countries.rollup(d.values);
          });
          map.node_legend.select("#mt-map-legend-min").text(domain[0]);
          map.node_legend.select("#mt-map-legend-max").text(domain[1]);
        }


        one_country = d3.selectAll(".mt-map-country")
          .each(function (d_one) {
            for (var key in options.map.countries.attr) {
              d3.select(this)
                .attr(key, function () {
                  if (d_one.prop == null) d_one.prop = {};
                  d_one.prop[key] = map.get_scaled_value(options.map.countries, key, d_one, data_countries);
                  return d_one.prop[key];
                });
            }
          })

        if(options.map.legend){
          one_country.on("mouseover", function (d_one) {
              position_delta = (d_one.value / parseInt(map.node_legend.select("#mt-map-legend-max").text())) * 220;
              map.node_legend.select("#mt-map-legend-indice text").text(d_one.value);
              map.node_legend.select("#mt-map-legend-indice")
              .attr("style", "display:block")
              .attr("transform", "translate(" + (36 + position_delta) + ",15)");
          }).on("mouseout", function(){
              map.node_legend.select("#mt-map-legend-indice")
              .attr("style", "display:none");
          });
        }

        if (options.map.countries.tooltip != null) {
          map.tooltip.activate(u, options.map.countries.tooltip);
        }
      }
    },

    tooltip: {
      element: null,

      activate: function (target, tooltip_content, cb) {
        target.on("mousemove", function (d, i) {
            mouse = d3.mouse(map.svg.node())
              .map(function (_d, _i) {
                return parseInt(_d);
              });
            map.tooltip.element.attr("style", "display:block;").html(tooltip_content(d));
            tooltip_delta = map.tooltip.element.node().offsetWidth / 2;
            mouse_left = (mouse[0] - tooltip_delta + document.getElementById('mt-map').offsetLeft)
            mouse_top = (mouse[1] + 10 + document.getElementById('mt-map').offsetTop);
            map.tooltip.element.attr("style", "top:" + mouse_top + "px;left:" + mouse_left + "px;display:block;");
          })
          .on("mouseout", function (d, i) {
            map.tooltip.element.style("display", "none");
          })
          .on("click", function (d, i) {
            if (cb) cb(d);
          });
      }
    }

  };

  // ****************************
  // ********** TABLE ***********
  // ****************************

  var table = {
    node: null,
    enabled: false,
    element: null,
    render: function () {

      data_table = data.filtered;

      // Enter
      table_body.selectAll("tr")
        .data(data_table)
        .enter()
        .append("tr");

      // Exit
      table_body.selectAll("tr")
        .data(data_table)
        .exit()
        .remove();

      // Update
      prev = [];
      table_body.selectAll("tr")
        .data(data_table)
        .attr("class", function (row) {
          var output = "line ";
          if (typeof (options.table.rowClassName) !== "undefined") {
            output += options.table.rowClassName(row);
          }
          return output;
        })
        .html(function (row) {
          tds = "";
          options.data.columns.forEach(function (column) {
            if (column.use_it_only_in_filters !== true) {
              tds += "<td";
              if (column.wrap == false) {
                tds += " style='white-space:nowrap;'";
              }
              tds += ">";

              if (!(
                  options.table.collapse_rows_by.indexOf(column.id) !== -1 && prev[column.id] && (prev[column.id] == row[column.id])
                )) {
                if (typeof (column.cellContent) == "function") {
                  tds += column.cellContent(row);
                }
                else {
                  if (row[column.id] != null && row[column.id] != "null") tds += row[column.id];
                }

                if (options.table.collapse_rows_by.indexOf(column.id) !== -1) prev[column.id] = row[column.id]
              }
              tds += "</td>";
            }
          });
          return tds;
        });
    },
    sorting: {
      current: {},
      sort_column: function (column_id, column_mode) {
        if (column_id == table.sorting.current.id && typeof (column_mode) == "undefined") {
          if (table.sorting.current.mode == "asc") {
            mode = "desc";
          }
          else {
            mode = "asc";
          }
        }
        else {
          mode = column_mode;
        }

        if (typeof (mode) == "undefined") mode = "desc";

        table.sorting.current = {
          id: column_id,
          mode: mode
        };

        column_headers = document.getElementsByClassName('mt-table-sortable');
        for (var i = 0; i < column_headers.length; i++) {
          column_headers[i].setAttribute("class", "mt-table-sortable");
        }
        document.getElementById('column_header_' + column_id)
          .setAttribute("class", "mt-table-sortable sort_" + mode);

        data.update_ui();
      },
      apply: function () {
        mode = (table.sorting.current.mode == "asc") ? d3.ascending : d3.descending;
        filter_options = data.column_details(table.sorting.current.id);
        data.raw = data.raw.sort(function (a, b) {

          if (filter_options.type == "virtual" && typeof (filter_options.cellContent) !== "undefined") {
            el1 = filter_options.cellContent(a);
            el2 = filter_options.cellContent(b);
          }
          else {
            el1 = a[table.sorting.current.id];
            el2 = b[table.sorting.current.id];
          }

          if (filter_options.type == "number") {
            el1 = parseInt(el1);
            el2 = parseInt(el2);
          }
          else if (filter_options.dataFormat) {
            el1 = filter_options.dataFormat(el1);
            el2 = filter_options.dataFormat(el2);
          }

          return mode(el1, el2);
        });
      }
    },
  };

  // ****************************
  // ***** Useful functions *****
  // ****************************
  function extend_recursive(obj1, obj2) {
    for (var p in obj2) {
      try {
        // Property in destination object set; update its value.
        if (obj2[p].constructor == Object) {
          obj1[p] = extend_recursive(obj1[p], obj2[p]);

        }
        else {
          obj1[p] = obj2[p];

        }

      }
      catch (e) {
        // Property in destination object not set; create it and set its value.
        obj1[p] = obj2[p];

      }
    }

    return obj1;
  }

  // •••••••••••••••••••••••••••••
  // •••••••••• Module •••••••••••
  // •••••••••••••••••••••••••••••
  var module = {
    init: function (target, custom_options) {

      if(typeof(target) != "string" || !document.querySelector(target)){
        throw "MapTable: target not found";
      }
      maptable_node = document.querySelector(target);

      // ********* OPTIONS **********

      // Load options
      if (!custom_options) {
        custom_options = {};
      }

      // Extends options
      options = extend_recursive(default_options, custom_options);

      // *********** MAP ************

      if (custom_options.map != null) {
        // DOM node
        map.node = maptable_node.appendChild(document.createElement('div'));
        map.node.setAttribute("id", "mt-map");

        map.enabled = true;

        // D3 Projection
        map.projection = d3.geo.equirectangular()
          .translate([map.width() / 2, map.height() / (2 * options.map.scale_height)])
          .scale((map.width() / 640) * 100)
          .rotate([-12, 0])
          .precision(0.1);

        // Create Tooltip
        map.tooltip.element = d3.select(map.node)
          .append("div")
          .attr("class", "mt-map-tooltip " + options.map.tooltip_class)
          .style("display", "none");

        // Create Svg
        map.svg = d3.select(map.node)
          .append("svg")
          .attr("viewBox", "0 0 " + map.width() + " " + map.height())
          .attr("width", map.width())
          .attr("height", map.height());

        // Resize parent div
        d3.select(map.node)
          .attr("style", "height:" + map.height() + "px");

        // Define zoom listerner
        map.zoomListener = d3.behavior
          .zoom()
          .scaleExtent(options.map.scale_zoom)
          .on("zoom", map.rescale);

        // Attach Zoom event to map
        if (options.map.zoom === true) {

          map.svg = map.svg.call(map.zoomListener);
        }

        //Resize
        if (options.map.auto_width) {
          window.onresize = function () {
            map.svg.attr("width", map.width());
            map.svg.attr("height", map.height());
            map.rescale();
          };
        }

        // add filters
        if (options.map.svg_filters != null) {
          if (document.querySelector(options.map.svg_filters) && document.querySelector(options.map.svg_filters)
            .getElementsByTagName('defs')
            .length > 0) {
            map.svg.append("defs")
              .attr("id", "filters_svg_map");
            document.getElementById('filters_svg_map')
              .innerHTML = document.querySelector(options.map.svg_filters)
              .getElementsByTagName('defs')[0].innerHTML;

          }
        }

        // Create Groups
        map.g_global = map.svg.append("g");
        map.g_countries = map.g_global.append("g");
        map.g_markers = map.g_global.append("g");

        // Add title
        if (custom_options.map.title != null) {
          map_title_container = map.svg
            .append("svg")
            .attr("width", map.width())
            .attr("x", 0)
            .attr("y", (map.height() - 30))
            .attr("height", 30);

          if (options.map.title.bgcolor) {
            map_title_rect = map_title_container.append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", map.width())
              .attr("height", 30)
              .attr("fill", options.map.title.bgcolor);
          }

          var map_title_text = map_title_container.append("text")
            .attr("id", "mt-map-title")
            .attr("x", 20)
            .attr("font-size", options.map.title.font_size)
            .attr("font-family", options.map.title.font_family)
            .attr("y", 20);

          if (options.map.title.source != null) {

            map_title_source = map_title_container.append("text")
              .attr("y", 20)
              .attr("x", (map.width() - 20))
              .attr("text-anchor", "end")
              .attr("font-size", options.map.title.font_size)
              .attr("font-family", options.map.title.font_family)
              .html(options.map.title.source());
          }
        }

        // Add watermark
        if (options.map.watermark && options.map.watermark.src) {
          if (window.btoa) {
            d3.xhr(options.map.watermark.src, function (res) {
              map_watermark_delta = 0;
              if (custom_options.map.title != null) map_watermark_delta = 30;

              if (options.map.watermark.src.indexOf('.svg') != -1) {
                mime = "image/svg+xml";
              }
              else if (options.map.watermark.src.indexOf('.jpg') != -1 || options.map.watermark.src.indexOf('.jpeg') != -1) {
                mime = "image/jpeg";
              }
              else if (options.map.watermark.src.indexOf('.png') != -1) {
                mime = "image/png";
              }
              else {
                console.warn("invalid watermark mime type");
                return;
              }
              datauri = "data:" + mime + ";base64," + window.btoa(res.responseText);

              if (typeof (options.map.watermark.width) == "undefined") {
                console.warn("Watermak width not found");
                return;
              }
              if (typeof (options.map.watermark.height) == "undefined") {
                console.warn("Watermak height not found");
                return;
              }
              options.map.watermark.width = parseInt(options.map.watermark.width);
              options.map.watermark.height = parseInt(options.map.watermark.height);

              if (options.map.watermark.position) {
                pos = options.map.watermark.position.split(' ');
                padding = 10;
                if (pos[0] == "top") {
                  y = padding;
                }
                else if (pos[0] == "middle") {
                  y = (map.height() - options.map.watermark.height) / 2;
                }
                else if (pos[0] == "bottom") {
                  y = map.height() - options.map.watermark.height - padding - map_watermark_delta;
                }
                else {
                  console.warn("position should be \"(top|middle|bottom) (left|middle|right)\"");
                }

                if (pos[1] == "left") {
                  x = padding;
                }
                else if (pos[1] == "middle") {
                  x = (map.width() - options.map.watermark.width) / 2;
                }
                else if (pos[1] == "right") {
                  x = map.width() - options.map.watermark.width - padding;
                }
                else {
                  console.warn("position should be \"(top|middle|bottom) (left|middle|right)\"");
                }
              }

              var watermark = map.svg
                .append("image")
                .attr("xlink:href", datauri)
                .attr("width", options.map.watermark.width)
                .attr("height", options.map.watermark.height);

              if (typeof (x) != "undefined" && typeof (y) != "undefined") {
                watermark.attr("x", x)
                  .attr("y", y);
              }

              if (options.map.watermark.style) {
                watermark.attr("style", options.map.watermark.style);
              }
            });
          }
          else {
            console.warn("Watermark not rendered: btoa error");
          }
        }
      }

      // ********** FILTERS ***********
      if(options.data.filters.enabled){
        data.filters.node = document.createElement('div');
        data.filters.node.setAttribute("id", "mt-filters");
        data.filters.node.setAttribute('class', 'panel panel-default');

        // -- Filters Header

        filters_header_node = document.createElement('div');
        filters_header_node.setAttribute('class', 'panel-heading');

        filters_reset_node = document.createElement("button");
        filters_reset_node.setAttribute("id", "mt-filters-reset");
        filters_reset_node.setAttribute("class", "btn btn-default btn-xs pull-right");
        filters_reset_node.style.display = "none";
        filters_reset_node.style.marginLeft = 5;
        filters_reset_node.innerText = "↺ Reset";
        filters_reset_node.addEventListener("click", data.filters.reset);
        filters_header_node.appendChild(filters_reset_node);

        filters_title_node = document.createElement('h3');
        filters_title_node.setAttribute('class', 'panel-title');
        filters_title_node.appendChild(document.createTextNode("Filters"));
        filters_header_node.appendChild(filters_title_node);

        data.filters.node.appendChild(filters_header_node);

        // -- Filters Content
        filters_body_node = document.createElement('div');
        filters_body_node.setAttribute("id", "mt-filters-content");
        filters_body_node.setAttribute('class', 'panel-body');

        filters_elements_node = document.createElement('div');
        filters_elements_node.setAttribute("id", "mt-filters-elements");
        filters_body_node.appendChild(filters_elements_node);

        filters_new_node = document.createElement("a");
        filters_new_node.setAttribute("id", "mt-filters-new");
        filters_new_node.setAttribute("href", "javascript:;");
        filters_new_node.innerText = "+ New filter";
        filters_new_node.addEventListener("click", data.filters.add);
        filters_body_node.appendChild(filters_new_node);

        data.filters.node.appendChild(filters_body_node);

        // -- Appending to main node
        maptable_node.appendChild(data.filters.node);

      }

      // ********** TABLE ***********

      if (custom_options.table != null) {
        table.node = maptable_node.appendChild(document.createElement('div'));
        table.node.setAttribute("id", "mt-table");

        table.enabled = true;
        table.element = d3.select(table.node)
          .append("table")
          .attr("class", options.table.class);

        table_header = table.element.append("thead");

        table_body = table.element.append("tbody");

        table_header.selectAll("tr")
          .data([1])
          .enter()
          .append("tr")
          .selectAll("th")
          .data(options.data.columns.filter(function (d) {
            return d.use_it_only_in_filters !== true ? true : false;
          }))
          .enter()
          .append("th")
          .attr("class", function (d) {
            var output = ""
            if (d.sorting !== false) {
              output += "mt-table-sortable";
            }
            if (d.wrap == false) {
              output += " nowrap";
            }
            return output;
          })
          .attr("style", function (d) {
            if (d.wrap == false) {
              return "white-space:nowrap;";
            }
            return "";
          })
          .text(function (d) {
            return d.displayName;
          })
          .attr("id", function (d) {
            return "column_header_" + d.id;
          })
          .on("click", function (d) {
            if (d.sorting !== false) {
              table.sorting.sort_column(d.id);
            }
          });
      }

      // ********** DATA ************
      if (custom_options.data == null || custom_options.data.path == null) {
        throw "data.path not found";
      }
      else {
        if (options.data.type == "json") {
          d3.json(options.data.path, data.load);
        }
        else if (options.data.type == "csv") {
          d3.csv(options.data.path, data.load);
        }
      }
    }
  };

  return module;

}(d3));
