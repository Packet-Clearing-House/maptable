String.prototype.var_replace = function(var_name, var_value) {
  if (typeof(var_name) == "object" && typeof(var_value) == "undefined") {
    output = this.toString();
    for (var k in var_name) {
      if (var_name.hasOwnProperty(k) && (typeof(var_name[k]) != "object" || typeof(var_name[k]) != "array")) {
        if(var_name[k] == null) var_name[k]= "";
        output = output.var_replace(k, var_name[k]);
      }
    }
    return output;
  } else {
    return this.toString().replace(new RegExp('\{\{' + var_name + '\}\}', 'g'), var_value);
  }
};

switchLanguage = function(selected_language){
  var d = new Date();
  d.setTime(d.getTime() + (360*24*60*60*1000));
  cookie_data  = "lang=" + selected_language + "; ";
  cookie_data += "expires=" + d.toUTCString()+ ";";
  cookie_data += "path=/";
  document.cookie = cookie_data;
  document.location.href = document.location.href;
};

showForm = function(target){
  // SHOW
  $(target).removeClass('hidden');

  // REQUIRED
  $(target).find('input[notrequired], select[notrequired]').each(function(){
    $(this).removeAttr('notrequired');
    $(this).attr('required', '');
  });
  // PATTERN
  $(target).find('input[tmp_pattern], select[tmp_pattern]').each(function(){
    tmp = $(this).attr('tmp_pattern');
    $(this).removeAttr('tmp_pattern');
    $(this).attr('pattern', tmp);
  });

};

hideForm = function(target){
  // HIDE
  $(target).addClass('hidden');

  // RESET VALUE
  $(target).find('input, select').each(function(){
    $(this).val('')
  });

  // REQUIRED
  $(target).find('input[required], select[required]').each(function(){
      $(this).removeAttr('required');
      $(this).attr('notrequired', '');
  });

  // PATTERN
  $(target).find('input[pattern], select[pattern]').each(function(){
      tmp = $(this).attr('pattern');
      $(this).removeAttr('required');
      $(this).attr('tmp_pattern', tmp);
  });
};

watchAddressChange = function(){
  if($('#zip').val() != "" || $('#country').val() == ""){
    watcher_email_change = window.setTimeout(function(){
      $.post(URL_ROOT + "api/address_validation", {
        addr1: $('#addr1').val(),
        addr2: $('#addr2').val(),
        city: $('#city').val(),
        state: $('#state').val(),
        country: $('#country').val(),
        country_name: $('#country option:selected').text(),
        zip: $('#zip').val()
      }).done(function( data ) {
        if(data.latitude != null && data.longitude != null){
          $('#map_preview').removeClass('hidden');
          $('#map_preview').find('img').attr('src', 'https://maps.googleapis.com/maps/api/staticmap?center=' + data.latitude + ',' + data.longitude +'&zoom=14&markers=color:red%7Clabel:%7C' + data.latitude + ',' + data.longitude +'&size=500x100');
          $('#map_preview').find('em').html(data.formatted_address);
          $('#longitude').val(data.longitude);
          $('#timezone').val(data.timezone);
          $('#latitude').val(data.latitude);
          $('#formatted_address').val(data.formatted_address);
        }
        if(data.city != null && $('#city').val() == ""){
          $('#city').val(data.city);
        }
        if(data.state != null && $('#state').val() == ""){
          $('#state').val(data.state);
        }
      }, "json");
    },100);
  }
  else{
    $('#map_preview').addClass('hidden');
  }
}

load_validation_style = function(){
  $("form[data-valid='true'] input, form[data-valid='true'] select").on("focus", function() {
    $("form[data-valid='true'] input, form[data-valid='true'] select").removeClass("focused");
    $(this).addClass("focused");
  });

  $("form[data-valid='true'] input, form[data-valid='true'] select").on("blur", function() {
    $(this).removeClass("focused");
  });
}
function update_nonce(){
  if (pch_nonce != undefined && pch_nonce.length > 1){
    $('#pch_nonce').val(pch_nonce);
  }
}

$(function() {
  // ADD SLIDEDOWN ANIMATION TO DROPDOWN //
  $('.dropdown').on('show.bs.dropdown', function(e) {
    $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
    $(this).find(".caret").addClass("caret-up");
  });
  // ADD SLIDEUP ANIMATION TO DROPDOWN //
  $('.dropdown').on('hide.bs.dropdown', function(e) {
    $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
    $(this).find(".caret").removeClass("caret-up");
  });

  $('.login_action').click(function(){
    Modal.init({
      id: "login",
      callback: update_nonce,
      primary_button_action: function(){
        $('form #loginform').submit();
      },
      url: URL_ROOT + "modal/login",
    }).open();
  });

  $(".dropdown-menu > li > a.trigger").on("click", function(e) {
    var current = $(this).next();
    var grandparent = $(this).parent().parent();
    if ($(this).hasClass('down-caret') || $(this).hasClass('right-caret'))
      $(this).toggleClass('right-caret down-caret');
    grandparent.find('.down-caret').not(this).toggleClass('right-caret down-caret');
    grandparent.find(".sub-menu:visible").not(current).hide();
    current.toggle();
    e.stopPropagation();
  });

  $(".dropdown-menu > li > a:not(.trigger)").on("click", function() {
    var root = $(this).closest('.dropdown');
    root.find('.down-caret').toggleClass('right-caret down-caret');
    root.find('.sub-menu:visible').hide();
  });

});

// see https://raw.githubusercontent.com/kvz/phpjs/master/functions/strings/htmlspecialchars_decode.js
function htmlspecialchars_decode(string, quote_style) {
  //       discuss at: http://phpjs.org/functions/htmlspecialchars_decode/
  //      original by: Mirek Slugen
  //      improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      bugfixed by: Mateusz "loonquawl" Zalega
  //      bugfixed by: Onno Marsman
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //         input by: ReverseSyntax
  //         input by: Slawomir Kaniecki
  //         input by: Scott Cariss
  //         input by: Francois
  //         input by: Ratheous
  //         input by: Mailfaker (http://www.weedem.fr/)
  //       revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  //        example 1: htmlspecialchars_decode("<p>this -&gt; &quot;</p>", 'ENT_NOQUOTES');
  //        returns 1: '<p>this -> &quot;</p>'
  //        example 2: htmlspecialchars_decode("&amp;quot;");
  //        returns 2: '&quot;'

  var optTemp = 0,
      i = 0,
      noquotes = false;
  if (typeof quote_style === 'undefined') {
    quote_style = 2;
  }
  string = string.toString()
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  var OPTS = {
    'ENT_NOQUOTES'          : 0,
    'ENT_HTML_QUOTE_SINGLE' : 1,
    'ENT_HTML_QUOTE_DOUBLE' : 2,
    'ENT_COMPAT'            : 2,
    'ENT_QUOTES'            : 3,
    'ENT_IGNORE'            : 4
  };
  if (quote_style === 0) {
    noquotes = true;
  }
  if (typeof quote_style !== 'number') {
    // Allow for a single string or an array of string flags
    quote_style = [].concat(quote_style);
    for (i = 0; i < quote_style.length; i++) {
      // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
      if (OPTS[quote_style[i]] === 0) {
        noquotes = true;
      } else if (OPTS[quote_style[i]]) {
        optTemp = optTemp | OPTS[quote_style[i]];
      }
    }
    quote_style = optTemp;
  }
  if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
    string = string.replace(/&#0*39;/g, "'"); // PHP doesn't currently escape if more than one 0, but it should
    // string = string.replace(/&apos;|&#x0*27;/g, "'"); // This would also be useful here, but not a part of PHP
  }
  if (!noquotes) {
    string = string.replace(/&quot;/g, '"');
  }
  // Put this in last place to avoid escape being double-decoded
  string = string.replace(/&amp;/g, '&');

  return string;
}

function getHumanSize(size){
  if (size == 0){
    return 0;
  }

  if (size != 'new' && size != ''){
    var plusMinus = size.charAt(0);
    if (plusMinus == '+' || plusMinus == '-'){
      size = size.substr(1);
    } else {
      plusMinus = '';
    }
  }

  // thanks http://stackoverflow.com/a/18650828
  // figure human size
  var k = 1000; // or 1024 for binary
  var bytes = (size * k);
  var sizes = ['B', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  var raw = bytes / Math.pow(k, i);

  // concat + or - with the raw rounded to three significant digits with the human scale value
  return plusMinus + threeSignificant(raw) + sizes[i];
}

/**
 * given a float like 1.3389 return 1.34  unless it's it's less than 0.01, in which case leave it as is.
 * WEB-485 & WEB-731 woody wants it to always be 3 numbers total:  111G, 11.1G, 1.11G.
 * @param float
 * @returns {*}
 */
function threeSignificant(float){
  float = parseFloat(float);
  if (float > 0.01){
    var period = Math.floor(float).toString().length;
    var dm = 1 + 1 || 3;
    if (period >= 3 || period === 0){
        dm = 0;
    } else if (period == 2){
        dm = 1;
    } else if (period == 1){
        dm = 2;
    }
    return parseFloat(float.toFixed(dm));
  } else {
    return float;
  }
}

function addCameraLinks() {
    $(".camera_link").click(function () {
        $('#kc_video').attr('src', $(this).attr('vimeo'));
        $('.camera_link').removeClass('active_camera');
        $(this).addClass('active_camera');
        return false;
    });
}