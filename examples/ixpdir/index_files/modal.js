// **** MODAL ****
// @params options:
//           id: Modal id
//           title: Modal title
//           primary_button: Primary button text
//           primary_button_action(modal_object): Function on click
//           url: to perform ajax req 
//           callback(modal_object): Function to execture in the end with the current object

Modal = {
  node: null,

  options: {
    id: "random",
    primary_button_action: function(modal_object) {},
    url: null,
    template_modal: "#template-modal",
    callback: function(modal_object) {}
  },
  init: function(custom_options) {
    t = this;

    // Load options
    if (!custom_options) {
      custom_options = {};
    }
    
    $.extend( t.options, custom_options );



    modal = $('<div>')
      .addClass('modal')
      .addClass('fade')
      .attr('id', 'modal-' + t.options.id)
      .attr('tabindex', '-1')
      .attr('role', 'dialog')
      .attr('aria-hidden', 'true')
      .html(t.getBody(t.options.url));

    modal.find('.btn-primary').on("click", {
      t: t
    }, t.primaryButtonAction);

    t.node = modal;

    $("body").append(modal)
    $(modal).on('hidden.bs.modal', function(e) {
      modal.remove();
    });

    if (typeof(t.options.callback) == "function") {
      t.options.callback(t);
    }

    return t;
  },

  primaryButtonAction: function(event) {
    event.data.t.options.primary_button_action(event.data.t);
  },

  open: function() {
    t = this;
    $(t.node).modal();
    return t;
  },

  close: function() {
    $(this.node).modal('hide');
    return t;
  },

  getBody: function(_url) {
    var req = $.ajax({
      url: _url,
      async: false
    });
    return req.responseText;
  }
};