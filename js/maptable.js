var MapTable = (function(d3) {

  // ****************************
  // ********* OPTIONS **********
  // ****************************

  var custom_options = {};

  var default_options = {
    data: {
      longitude_key: "longitude",
      latitude_key: "latitude",
      filters: {
        selector_container: "#filters_container",
        selector_content: "#filters_content",
        selector_new: "#filters_new_filter",
        selector_reset: "#filters_reset",
        range_values: [{
          value: "",
          text: "any"
        }, {
          value: "<",
          text: "less than"
        }, {
          value: "=",
          text: "exactly"
        }, {
          value: ">",
          text: "more than"
        }]
      }
    },
    map: {
      width: 900,
      height: 390,
      auto_width: true,
      ratio_from_width: 0.5,
      scale_height: 1,
      scale_zoom: [1, 10],
      animation_duration: 750,
      fit_content_margin: 10,
      auto_fit_content: false,
      title: {
        font_size: 12,
        font_family: "Helevetica, Arial, Sans-Serif"
      }
    },
    table: {
      selector: "#table",
      class: "table table-striped",
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
    column_details: function(column_name) {
      obj = null;
      options.data.columns.forEach(function(f) {
        if (f.id == column_name) {
          obj = f;
        }
        return;
      });
      return obj;
    },

    filters: {

      active: true,
      criteria: [],
      methods: null,
      init: function() {
        var user_filters = [];

        var methods = {
          newFilter: function() {
            row = buildRow();
            //d3.select(options.data.filters.selector_content).append(row.node);
            document.querySelector(options.data.filters.selector_content).appendChild(row.node);
            user_filters.push(row.name);

            updateFilterDropdowns();
            checkReachMaxFilters();
            if (document.querySelector(options.data.filters.selector_container).style.display == "none") {
              toogleFilters();
            }
          },
          reset: function() {
            user_filters = [];
            var li = document.getElementsByClassName('filter_element');

            while (li[0]) {
              li[0].parentNode.removeChild(li[0]);
            }
            checkReachMaxFilters();

            map.transX = 0;
            map.transY = 0;
            map.scale = 1;

            map.zoomListener.translate([map.transX, map.transY]).scale(map.scale);

            window.setTimeout(data.update_ui, options.map.animation_duration);
          },
          checkWithFilter: function(d) {
            filter_elements = document.getElementsByClassName("filter_element");
            for (i = 0; i < filter_elements.length; i++) {
              li = filter_elements[i];
              filter_name = li.querySelector(".dropdown_filter").value;
              filter_value = li.querySelector(".input_value").value;
              filter_options = data.column_details(filter_name);
              if (filter_value == "") continue;
              if (filter_options.type == "dropdown") {
                if (d[filter_name] != filter_value) return false;
              } else if (filter_options.type == "field") {
                if (d[filter_name].toLowerCase().indexOf(filter_value.toLowerCase()) === -1) return false;
              } else if (filter_options.type == "number") {
                filter_range = li.querySelector(".dropdown_range").value;
                if (!rangeToBool(d[filter_name], filter_range, filter_value)) return false;
              } else if (filter_options.type == "custom") {
                filter_range = li.querySelector(".dropdown_range").value;
                if (!rangeToBool(
                    filter_options.dataFormat(d[filter_name]),
                    filter_range,
                    filter_options.dataFormat(filter_value))) return false;
              } else if (filter_options.type == "date") {
                if (d[filter_name] == "") return false;
                filter_range = li.querySelector(".dropdown_range").value;
                if (typeof(filter_options.dateParse) !== "undefined") {
                  if (!rangeToBool(
                      filter_options.dateParse(d[filter_name]),
                      filter_range,
                      Date.parse(filter_value)
                    )) return false;
                } else {
                  if (!rangeToBool(
                      Date.parse(d[filter_name]),
                      filter_range,
                      Date.parse(filter_value)
                    )) return false;
                }
              }
            };
            return true;
          },
          inlineFilters: function() {
            var output_array = [];

            var filter_elements = document.getElementsByClassName("filter_element");

            for (i = 0; i < filter_elements.length; i++) {
              li = filter_elements[i];
              filter_name = li.querySelector(".dropdown_filter").value;
              filter_value = li.querySelector(".input_value").value;
              filter_options = data.column_details(filter_name);
              if (filter_value == "") continue;

              var out = filter_options.displayName + " ";

              if (filter_options.type == "field") {
                out += "contains ";
              } else {
                out += "is ";
              }

              if (filter_options.type == "number" || filter_options.type == "date") {
                filter_range_select = li.querySelector(".dropdown_range");
                if (filter_range_select.value != "") {
                  out += filter_range_select.options[filter_range_select.selectedIndex].text + " ";
                }
              }

              out += "<b>" + filter_value + "</b>";

              output_array.push(out);
            }
            return output_array;
          }
        };

        buildRow = function(filter_name) {
          var remaining_filters = getRemainingFilters();

          if (remaining_filters.length == 0) return {
            node: null,
            name: null
          };

          if (typeof(filter_name) !== "string") filter_name = remaining_filters[0].id;

          var filter_options = data.column_details(filter_name);

          var row = document.createElement("li");
          row.setAttribute("class", "filter_element");

          appendButtons(row, filter_name);

          // Filter verb
          var filter_and = document.createElement("span");
          filter_and.setAttribute("class", "text and_filter");
          filter_and.innerText = "And ";
          row.appendChild(filter_and);



          // Filter select
          var filter_select = document.createElement("select");
          filter_select.setAttribute("class", "dropdown_filter");
          filter_select.setAttribute("data-current", filter_name);
          filter_select = appendOptions(filter_select, remaining_filters);
          filter_select.value = filter_name;

          filter_select.addEventListener("change", function(select) {
            changeFilter(this);
          });
          filter_select.addEventListener("change", data.update_ui);
          row.appendChild(filter_select);

          // Filter verb
          var filter_verb = document.createElement("span");
          filter_verb.setAttribute("class", "text");
          if (filter_options.type == "field") {
            filter_verb.innerText = " contains ";
          } else {
            filter_verb.innerText = " is ";
          }
          row.appendChild(filter_verb);

          // Filter range
          if (filter_options.type != "field" && filter_options.type != "dropdown") {
            var filter_range = document.createElement("select");
            filter_range.setAttribute("class", "dropdown_range");
            options.data.filters.range_values.forEach(function(r) {
              option = document.createElement("option");
              option.value = r.value;
              option.innerText = r.text;
              filter_range.appendChild(option);
            });
            filter_range.addEventListener("change", function() {
              changeRange(this);
            });
            filter_range.addEventListener("change", function() {
              data.update_ui(true);
              map.fit_content(true);
            });
            row.appendChild(filter_range);

            // Little space:
            row.appendChild(document.createTextNode(" "));

          }

          // Filter value
          if (filter_options.type != "dropdown") {
            var filter_value = document.createElement("input");
            if (filter_options.type == "number") {
              filter_value.setAttribute("type", "number");
            } else if (filter_options.type == "date") {
              filter_value.setAttribute("type", "date");
            } else {
              filter_value.setAttribute("type", "text");
            }
            filter_value.addEventListener("keyup", function() {
              data.update_ui(true);
              map.fit_content(true);
            });
            filter_value.addEventListener("change", function() {
              data.update_ui(true);
              map.fit_content(true);
            });
          } else {
            var filter_value = document.createElement("select");

            unique_values = d3.nest()
              .key(function(d) {
                return d[filter_name]
              })
              .sortKeys(d3.ascending)
              .entries(data.filtered);

            option = document.createElement("option");
            option.value = "";
            option.innerText = "Any";
            filter_value.appendChild(option);

            unique_values.forEach(function(d) {
              option = document.createElement("option");
              option.value = d.key;
              option.innerText = d.key;
              filter_value.appendChild(option);
            });
            filter_value.addEventListener("change", function() {
              data.update_ui(true);
              map.fit_content(true);
            });


          }
          filter_value.setAttribute("class", "input_value");

          row.appendChild(filter_value);

          if (typeof(filter_range) != "undefined") {
            changeRange(filter_range);
          }


          return {
            node: row,
            name: filter_name
          };
        };

        changeRange = function(filter_range) {
          if (filter_range.value == "") {
            displayValue = "none";
          } else {
            displayValue = "inline-block";
          }
          filter_range.parentNode.querySelector(".input_value").style.display = displayValue;
        };

        changeFilter = function(select) {
          var li, new_filter_name, new_li, old_filter_index, old_filter_name;
          li = select.parentNode;
          old_filter_name = select.getAttribute("data-current");
          new_filter_name = select.value;

          old_filter_index = user_filters.indexOf(old_filter_name);
          user_filters.splice(old_filter_index, 1);

          row = buildRow(new_filter_name);
          new_li = row.node;

          user_filters.push(row.name);

          li.parentNode.replaceChild(new_li, li);

          updateFilterDropdowns();
        };

        updateFilterDropdowns = function() {
          dropdowns = document.querySelectorAll('.dropdown_filter');
          for (var i = 0; i < dropdowns.length; i++) {
            filter_select = dropdowns[i];
            filter_name = filter_select.value;
            remaining_filters = getRemainingFilters(filter_name);
            filter_select.innerHTML = "";
            filter_select = appendOptions(filter_select, remaining_filters);
            filter_select.value = filter_name;
          };
        };

        appendOptions = function(select, data, default_value) {
          data.forEach(function(f) {
            // Filter select
            option = document.createElement("option");
            option.setAttribute("value", f.id);
            option.innerText = f.displayName;
            select.appendChild(option);
          });
          select.value = default_value;
          return select;
        };

        getRemainingFilters = function(except) {
          return options.data.columns.filter(function(v) {
            return (except && except == v.id) || (
              user_filters.indexOf(v.id) === -1 && v.type && v.type !== "virtual"
            );
          });
        };

        appendButtons = function(li, filter_name) {
          btn_group = document.createElement("div");
          btn_group.setAttribute("class", "btn-group pull-right");


          btn_minus = document.createElement("button");
          btn_minus.setAttribute("class", "btn btn-default btn-xs btn-minus");
          btn_minus.innerText = "– Remove this filter";
          btn_minus.addEventListener("click", function() {
            minusFilter(li);
          });
          btn_group.appendChild(btn_minus);

          btn_plus = document.createElement("button");
          btn_plus.setAttribute("class", "btn btn-default btn-xs btn-plus pull-right");
          btn_plus.innerText = "+";
          btn_plus.addEventListener("click", function() {
            plusFilter(li);
          });
          btn_group.appendChild(btn_plus);

          li.appendChild(btn_group);
        }

        plusFilter = function(after_element) {
          var row;
          if (after_element == null) {
            after_element = '';
          }
          row = buildRow();
          if (after_element === '') {
            document.querySelector(options.data.filters.selector_content).appendChild(row.node);
          } else {
            after_element.parentNode.insertBefore(row.node, after_element.nextSibling);
          }
          user_filters.push(row.name);
          updateFilterDropdowns();
          checkReachMaxFilters();
        };

        minusFilter = function(li) {
          filter_name = li.querySelector(".dropdown_filter").value;
          li.remove();
          filter_index = user_filters.indexOf(filter_name);
          user_filters.splice(filter_index, 1);

          updateFilterDropdowns();
          checkReachMaxFilters();

          data.update_ui(true);
          map.fit_content(true);
        };

        checkReachMaxFilters = function() {
          if (getRemainingFilters().length == 0) {
            disableNewFilter = true;
          } else {
            disableNewFilter = false;
          }
          document.querySelector(options.data.filters.selector_new + " .btn").disabled = disableNewFilter;



          btns = document.querySelectorAll(".btn-plus");
          for (i = 0; i < btns.length; i++) {
            btns[i].disabled = disableNewFilter;
          };
        };

        appendNewFilter = function() {
          new_filter_btn = document.createElement("button");
          new_filter_btn.setAttribute("class", "btn btn-default btn-xs");
          new_filter_btn.innerText = "+ New filter";
          new_filter_btn.addEventListener("click", methods.newFilter);

          document.querySelector("#filters_new_filter").appendChild(new_filter_btn);

        };

        appendReset = function() {
          if (document.querySelector(options.data.filters.selector_reset)) {
            document.querySelector(options.data.filters.selector_reset).innerHTML = "";

            reset_btn = document.createElement("button");
            reset_btn.setAttribute("class", "btn btn-default btn-xs btn-reset");
            reset_btn.style.display = "none";
            reset_btn.innerText = "↺ Reset";
            reset_btn.addEventListener("click", methods.reset);

            document.querySelector(options.data.filters.selector_reset).appendChild(reset_btn);
          } else {
            console.warn("Selector : " + options.data.filters.selector_reset + " not found");
          }
        };

        toogleFilters = function() {
          if (document.querySelector('#filters_container').style.display == "none") {
            document.querySelector('#filters_container').style.display = "block";
            document.querySelector("#caret_filters").setAttribute("class", "arrow-down");
            if (user_filters.length == 0) {
              methods.newFilter();
            }
          } else {
            document.querySelector('#filters_container').style.display = "none";
            document.querySelector("#caret_filters").setAttribute("class", "arrow-right");
          }
        };

        document.querySelector(".filters_label a").addEventListener("click", toogleFilters);
        appendNewFilter();
        appendReset();
        toogleFilters();
        checkReachMaxFilters();

        data.filters.methods = methods;
      },

      range_to_bool: function(el1, range, el2) {
        if (range == "=") {
          return parseInt(el1) == parseInt(el2);
        } else if (range == ">") {
          return parseInt(el1) >= parseInt(el2);
        } else if (range == "<") {
          return parseInt(el1) <= parseInt(el2);
        } else {
          return true;
        }
      },

      constraint_to_boundaries: function() {
        if (map.active && options.map.zoom == true) {
          nw = [Math.abs(map.transX / map.scale), Math.abs(map.transY / map.scale)];
          se = [nw[0] + map.width() / map.scale, nw[1] + map.height() / map.scale];

          boundaries = {
            "nw": map.projection.invert(nw),
            "se": map.projection.invert(se)
          };
          before_count = data.filtered.length;
          filtered = data.filtered.filter(function(d) {
            if (map.scale == 1) return true;
            return (
              boundaries.nw[0] < d.longitude && boundaries.se[0] > d.longitude
            ) && (
              boundaries.nw[1] > d.latitude && boundaries.se[1] < d.latitude
            );
          });
          after_count = data.filtered.length;

          if (before_count != after_count) map.update_ui();
          return filtered;
        }
        return data.filtered;
      },

      apply: function() {
        return data.raw.filter(function(d) {
          filter_elements = document.getElementsByClassName("filter_element");
          for (i = 0; i < filter_elements.length; i++) {
            li = filter_elements[i];
            filter_name = li.querySelector(".dropdown_filter").value;
            filter_value = li.querySelector(".input_value").value;
            filter_options = data.column_details(filter_name);
            if (filter_value == "") continue;
            if (filter_options.type == "dropdown") {
              if (d[filter_name] != filter_value) return false;
            } else if (filter_options.type == "field") {
              if (d[filter_name].toLowerCase().indexOf(filter_value.toLowerCase()) === -1) return false;
            } else if (filter_options.type == "number") {
              filter_range = li.querySelector(".dropdown_range").value;
              if (!data.filters.range_to_bool(d[filter_name], filter_range, filter_value)) return false;
            } else if (filter_options.type == "custom") {
              filter_range = li.querySelector(".dropdown_range").value;
              if (!data.filters.range_to_bool(
                  filter_options.dataFormat(d[filter_name]),
                  filter_range,
                  filter_options.dataFormat(filter_value))) return false;
            } else if (filter_options.type == "date") {
              if (d[filter_name] == "") return false;
              filter_range = li.querySelector(".dropdown_range").value;
              if (typeof(filter_options.dateParse) !== "undefined") {
                if (!data.filters.range_to_bool(
                    filter_options.dateParse(d[filter_name]),
                    filter_range,
                    Date.parse(filter_value)
                  )) return false;
              } else {
                if (!data.filters.range_to_bool(
                    Date.parse(d[filter_name]),
                    filter_range,
                    Date.parse(filter_value)
                  )) return false;
              }
            }
          };
          return true;
        });
      }
    },

    load: function(error, _data) {
      if (map.active) {
        data.raw = _data.map(function(d) {
          d.longitude = Number(d[options.data.longitude_key]);
          d.latitude = Number(d[options.data.latitude_key]);
          coord = map.projection([d.longitude, d.latitude]);
          d.x = coord[0];
          d.y = coord[1];
          return d;
        });
        d3.json(options.map.path, map.load_geometries);
      } else {
        data.raw = _data;
      }
      data.filtered = data.raw;

      if (table.active) {
        table.render();
        if (options.table.default_sorting) {
          table.sorting.sort_column(options.table.default_sorting.id, options.table.default_sorting.mode);
        }
      }

    },
    update_ui: function() {
      // Refilter data
      data.filtered = data.filters.apply();

      // Markers
      map.update_markers();

      // Countries
      map.update_countries();

      // Rescale map
      map.rescale();

      // Auto Fit content
      if (options.map.auto_fit_content === true) {
        map.fit_content(true);
      }

      // Title
      if (document.getElementById('maptable_title')) {
        showing = data.filtered.length;
        total = data.raw.length;
        inline_filters = "";

        if (data.filters.criteria.length > 0) {
          inline_filters = data.filters.inline();
        }
        document.getElementById('maptable_title').innerHTML = options.map.title.content(showing, total, inline_filters);
      }

      // Reset button
      if (data.filters.active && document.querySelector(options.data.filters.selector_reset)) {
        document.querySelector(options.data.filters.selector_reset).style.display = (data.raw.length != data.filtered.length) ? "block" : "none";
      }
    }
  };


  // ****************************
  // *********** MAP ************
  // ****************************
  var map = {
    active: false,
    scale: 1,
    transX: 0,
    transY: 0,

    projection: null,

    g_global: null,
    g_markers: null,
    g_countries: null,

    zoomListener: null,

    scale_attributes: function() {
      return Math.pow(map.scale, 2 / 3);
    },

    width: function() {
      if (options.map.auto_width) {
        return document.querySelector(options.map.selector).offsetWidth;
      } else {
        return options.map.width;
      }
    },

    height: function() {
      if (options.map.auto_width && options.map.ratio_from_width) {
        return map.width() * options.map.ratio_from_width * options.map.scale_height;
      } else {
        return options.map.height * options.map.scale_height;
      }
    },

    load_geometries: function(error, world) {
      data_geometries = topojson.object(world, world.objects.countries).geometries;

      // If we have data concerning that affect countries
      if (options.map.countries.group_by != null) {
        data_countries = d3.nest()
          .key(options.map.countries.group_by)
          .entries(data.filtered);

        data_countries_assoc = {};
        for (var i = 0; i < data_countries.length; i++) {
          data_countries_assoc[data_countries[i].key] = data_countries.values;
        }
      } else {
        data_countries = [];
        data_countries_assoc = {};
      }

      // Put data_countries into data_geometries if available
      for (var i = 0; i < data_geometries.length; i++) {
        data_geometries[i].key = data_geometries[i].properties.name;
        data_geometries[i].values = [];
      }


      // Create countries
      u = map.g_countries.selectAll(".country")
        .data(data_geometries)
        .enter()
        .insert("path")
        .attr("class", "country")
        .attr("d", d3.geo.path().projection(map.projection));

      if (options.map.countries.tooltip != null) {
        map.tooltip.activate(u, options.map.countries.tooltip);
      }

      data.update_ui();

    },

    fit_content: function() {
      hor = d3.extent(data.filtered, function(d) {
        return d.x;
      });
      ver = d3.extent(data.filtered, function(d) {
        return d.y;
      });

      // center dots with the good ratio
      ratio = map.width() / map.height();

      // We add options.markers*2 to fit until the right/bottom part of the marker
      if (typeof(options.map.markers.attr['r']) != undefined) {
        if (options.map.markers.attr['r'] instanceof Array && typeof(options.map.markers.attr['r'][1]) == "number") {
          delta_marker = options.map.markers.attr['r'][1];
        } else if (typeof(options.map.markers.attr['r']) == "number") {
          delta_marker = options.map.markers.attr['r'];
        } else {
          delta_marker = 10;
        }
      }

      currentW = (hor[1] - hor[0]) + delta_marker * map.scale * 2;
      currentH = (ver[1] - ver[0]) + delta_marker * map.scale * 2;

      realH = currentW / ratio;
      realW = currentH * ratio;

      diff_margin_width = 0;
      diff_margin_height = 0;

      if (realW >= currentW) {
        diff_margin_width = (realW - currentW) / 2;
      } else {
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

      map.zoomListener.translate([map.transX, map.transY]).scale(map.scale);

      map.rescale(true);
    },
    rescale: function(withTransition) {

      if (d3.event != null && typeof(d3.event.translate) != "undefined") {
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
      } else if (map.transY < minTransY) {
        map.transY = minTransY;
      }

      if (map.transX > maxTransX) {
        map.transX = maxTransX;
      } else if (map.transX < minTransX) {
        map.transX = minTransX;
      }

      if (d3.event != null && typeof(d3.event.translate) != "undefined") {
        d3.event.translate[0] = map.transX;
        d3.event.translate[1] = map.transY;
      }

      g_temp = map.g_global;
      if (withTransition) {
        g_temp = map.g_global.transition().ease('cubic-inOut').duration(options.map.animation_duration);
      }
      g_temp.attr("transform", "translate(" + map.transX + ", " + map.transY + ")scale(" + map.scale + ")");


      // Contraint to boundaries
      data.filtered = data.filters.constraint_to_boundaries();

      // Rescale attributes
      if (options.map.markers != null) {
        // markers
        d3.selectAll(".marker").each(function(d) {
          // stroke
          if (d.prop['stroke-width'] != null) {
            d3.select(this).attr("stroke-width", d.prop['stroke-width'] / map.scale_attributes());
          }
          // radius
          if (d.prop['r'] != null) {
            d3.select(this).attr("r", d.prop['r'] / map.scale_attributes());
          }
        });
        // countries
        d3.selectAll(".country").each(function(d) {
          // stroke
          if (d.prop['stroke-width'] != null) {
            d3.select(this).attr("stroke-width", d.prop['stroke-width'] / map.scale_attributes());
          }
        });
      }
    },

    get_scaled_value: function(obj, key, d_one, d_all) {
      output = null;
      if (obj.rollup == null) {
        if (typeof(obj.attr[key]) == "object") {
          throw "Error - no rollup and property is an oject: " + key;
        } else {
          output = obj.attr[key];
        }
      } else {
        if (obj.attr[key] instanceof Array) {
          var domain = d3.extent(d_all, function(d) {
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
            if (typeof(range[2]) == "function") {
              range[0] = range[2](range[0]);
              range[1] = range[2](range[1]);
            } else if (typeof(range[2]) == "number") {
              range[0] = range[0] * range[2];
              range[1] = range[1] * range[2];
            }
            range.pop();
          }
          // Dynamic value
          var scale = d3.scale.linear()
            .domain(domain)
            .range(range);

          el = d_all.filter(function(d) {
            return d.key == d_one.key
          });

          if (el.length == 0) {
            if (obj.attr_empty != null && obj.attr_empty[key] != null) {
              output = obj.attr_empty[key];
            } else {
              throw "Error - attr_empty[" + key + "] not found";
            }
          } else {
            output = scale(obj.rollup(el[0].values));
          }
        } else if (typeof(obj.attr[key]) == "number" || typeof(obj.attr[key]) == "string") {
          // Static value
          output = obj.attr[key];
        } else {
          // Error value
          throw "Invalid value for " + key;
        }
      }
      return output;
    },

    update_markers: function() {
      if (options.map.markers != null) {

        data_markers = d3.nest()
          .key(options.map.markers.group_by)
          .entries(data.filtered);

        var markers = map.g_markers.selectAll(".marker")
          .data(data_markers);

        // Enter
        markers.enter()
          .append("svg:circle")
          .attr("class", "marker");

        // Exit
        markers.exit()
          .remove();

        // Update
        u = markers
          .attr("cx", function(d) {
            return d.values[0].x;
          })
          .attr("cy", function(d) {
            return d.values[0].y;
          });

        if (options.map.markers.attr != null) {
          for (var key in options.map.markers.attr) {
            u.attr(key, function(d_one) {
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

    update_countries: function() {
      if (options.map.countries.attr != null) {
        // If we have data concerning that affect countries
        if (options.map.countries.group_by != null) {
          data_countries = d3.nest()
            .key(options.map.countries.group_by)
            .entries(data.filtered);

          data_countries_assoc = {};
          for (var i = 0; i < data_countries.length; i++) {
            data_countries_assoc[data_countries[i].key] = data_countries.values;
          }
        } else {
          data_countries = [];
          data_countries_assoc = {};
        }
        d3.selectAll(".country").each(function(d_one) {
          for (var key in options.map.countries.attr) {
            d3.select(this).attr(key, function() {
              if (d_one.prop == null) d_one.prop = {};
              d_one.prop[key] = map.get_scaled_value(options.map.countries, key, d_one, data_countries);
              return d_one.prop[key];
            });
          }
        });
      }
    },

    tooltip: {
      element: null,
      position: function(mouse) {
        return "left:" + (mouse[0] + 5) + "px;top:" + (mouse[1] + 10) + "px";
      },
      activate: function(target, tooltip_content, cb) {
        target.on("mousemove", function(d, i) {
            mouse = d3.mouse(map.svg.node())
              .map(function(_d, _i) {
                return parseInt(_d);
              });

            map.tooltip.element.style("display", "block")
              .attr("style", map.tooltip.position(mouse))
              .html(tooltip_content(d));
          })
          .on("mouseout", function(d, i) {
            map.tooltip.element.style("display", "none");
          })
          .on("click", function(d, i) {
            if (cb) cb(d);
          });
      }
    }

  };


  // ****************************
  // ********** TABLE ***********
  // ****************************

  var table = {
    active: false,
    element: null,
    render: function() {

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
        .attr("class", function(row) {
          var output = "line ";
          if (typeof(options.table.rowClassName) !== "undefined") {
            output += options.table.rowClassName(row);
          }
          return output;
        })
        .html(function(row) {
          tds = "";
          options.data.columns.forEach(function(column) {
            if (column.use_it_only_in_filters !== true) {
              tds += "<td>";
              if (!(
                  options.table.collapse_rows_by.indexOf(column.id) !== -1 && prev[column.id] && (prev[column.id] == row[column.id])
                )) {
                if (typeof(column.cellContent) == "function") {
                  tds += column.cellContent(row);
                } else {
                  tds += row[column.id];
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
      sort_column: function(column_id, column_mode) {
        if (column_id == table.sorting.current.id && typeof(column_mode) == "undefined") {
          if (table.sorting.current.mode == "asc") {
            mode = "desc";
          } else {
            mode = "asc";
          }
        } else {
          mode = column_mode;
        }

        if (typeof(mode) == "undefined") mode = "desc";

        table.sorting.current = {
          id: column_id,
          mode: mode
        };

        column_headers = document.getElementsByClassName('column_sortable');
        for (var i = 0; i < column_headers.length; i++) {
          column_headers[i].setAttribute("class", "column_sortable");
        }
        document.getElementById('column_header_' + column_id).setAttribute("class", "column_sortable sort_" + mode);

        table.sorting.apply();
        data.update_ui();
        table.render();
      },
      apply: function() {
        mode = (table.sorting.current.mode == "asc") ? d3.ascending : d3.descending;
        filter_options = data.column_details(table.sorting.current.id);
        data.raw = data.raw.sort(function(a, b) {

          if (filter_options.type == "virtual" && typeof(filter_options.cellContent) !== "undefined") {
            el1 = filter_options.cellContent(a);
            el2 = filter_options.cellContent(b);
          } else {
            el1 = a[table.sorting.current.id];
            el2 = b[table.sorting.current.id];
          }

          if (filter_options.type == "number") {
            el1 = parseInt(el1);
            el2 = parseInt(el2);
          } else if (filter_options.type == "date") {
            if (typeof(filter_options.dateParse) !== "undefined") {
              el1 = filter_options.dateParse(el1);
              el2 = filter_options.dateParse(el2);
            } else {
              el1 = Date.parse(el1);
              el2 = Date.parse(el2);
            }
          } else if (filter_options.dataFormat) {
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

        } else {
          obj1[p] = obj2[p];

        }

      } catch (e) {
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
    init: function(custom_options) {

      // ********* OPTIONS **********

      // Load options
      if (!custom_options) {
        custom_options = {};
      }

      // Extends options
      options = extend_recursive(default_options, custom_options);

      // *********** MAP ************

      if (custom_options.map != null) {
        map.active = true;

        // D3 Projection
        map.projection = d3.geo.equirectangular()
          .translate([map.width() / 2, map.height() / 2])
          .scale((map.width() / 640) * 100)
          .rotate([-12, 0]).precision(0.1);


        // Create Tooltip
        map.tooltip.element = d3.select(options.map.selector)
          .append("div")
          .attr("class", "tooltip")
          .style("display", "none");

        // Create Svg
        map.svg = d3.select(options.map.selector)
          .append("svg")
          .attr("viewBox", "0 0 " + map.width() + " " + map.height())
          .attr("width", map.width())
          .attr("height", map.height());



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
        if (options.auto_width) {
          window.onresize = function() {
            map.svg.attr("width", map.width());
            map.svg.attr("height", map.height());
          };
        }

        // add filters
        if (options.map.svg_filters != null) {
          if (document.querySelector(options.map.svg_filters) && document.querySelector(options.map.svg_filters).getElementsByTagName('defs').length > 0) {
            map.svg.append("defs").attr("id", "filters_svg_map");
            document.getElementById('filters_svg_map').innerHTML = document.querySelector(options.map.svg_filters).getElementsByTagName('defs')[0].innerHTML;

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
            .attr("id", "maptable_title")
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
            d3.xhr(options.map.watermark.src, function(res) {
              map_watermak_delta = 0;
              if (custom_options.map.title != null) map_watermak_delta = 30;

              if (options.map.watermark.src.indexOf('.svg') != -1) {
                mime = "image/svg+xml";
              } else if (options.map.watermark.src.indexOf('.jpg') != -1 || options.map.watermark.src.indexOf('.jpeg') != -1) {
                mime = "image/jpeg";
              } else if (options.map.watermark.src.indexOf('.png') != -1) {
                mime = "image/png";
              } else {
                console.warn("invalid watermak mime type");
                return;
              }
              datauri = "data:" + mime + ";base64," + window.btoa(res.responseText);

              if (typeof(options.map.watermark.width) == "undefined") {
                console.warn("Watermak width not found");
                return;
              }
              if (typeof(options.map.watermark.height) == "undefined") {
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
                } else if (pos[0] == "middle") {
                  y = (map.height() - options.map.watermark.height) / 2;
                } else if (pos[0] == "bottom") {
                  y = map.height() - options.map.watermark.height - padding - map_watermak_delta;
                } else {
                  console.warn("position should be \"(top|middle|bottom) (left|middle|right)\"");
                }

                if (pos[1] == "left") {
                  x = padding;
                } else if (pos[1] == "middle") {
                  x = (map.width() - options.map.watermark.width) / 2;
                } else if (pos[1] == "right") {
                  x = map.width() - options.map.watermark.width - padding;
                } else {
                  console.warn("position should be \"(top|middle|bottom) (left|middle|right)\"");
                }
              }

              var watermark = map.svg
                .append("image")
                .attr("xlink:href", datauri)
                .attr("width", options.map.watermark.width)
                .attr("height", options.map.watermark.height);

              if (typeof(x) != "undefined" && typeof(y) != "undefined") {
                watermark.attr("x", x).attr("y", y);
              }

              if (options.map.watermark.style) {
                watermark.attr("style", options.map.watermark.style);
              }
            });
          } else {
            console.warn("btoa error");
          }
        }
      }

      // ********** FILTERS ***********
      data.filters.init();

      // ********** TABLE ***********

      if (custom_options.table != null) {
        table.active = true;
        table.element = d3.select(options.table.selector)
          .append("table")
          .attr("class", options.table.class);

        table_header = table.element.append("thead");

        table_body = table.element.append("tbody");

        table_header.selectAll("tr")
          .data([1])
          .enter()
          .append("tr")
          .selectAll("th")
          .data(options.data.columns.filter(function(d) {
            return d.use_it_only_in_filters !== true ? true : false;
          }))
          .enter()
          .append("th")
          .attr("class", function(d) {
            var output = "column_header "
            if (d.sorting !== false) {
              output += "column_sortable";
            }
            return output;
          })
          .text(function(d) {
            return d.displayName;
          })
          .attr("id", function(d) {
            return "column_header_" + d.id;
          })
          .on("click", function(d) {
            if (d.sorting !== false) {
              table.sorting.sort_column(d.id);
            }
          });
      }


      // ********** DATA ************
      if (custom_options.data == null || custom_options.data.path == null) {
        throw "data.path not found"
      } else {
        if (options.data.type == "json") {
          d3.json(options.data.path, data.load);
        } else if (options.data.type == "csv") {
          d3.csv(options.data.path, data.load);
        }
      }


    },

    addFilter: function() {
      filters.newFilter();
    }
  };

  return module;

}(d3));
