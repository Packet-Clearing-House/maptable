var timeout;

$.notification = function(options) {
  var icon_container, icon_div, icon_name, message_span, o, opts, time_wait, timeout, wrap_bar;
  $.notification.removebar();
  opts = $.extend({}, {
    type: "notice"
  }, options);
  o = opts;
  message_span = $("<span />").addClass("jbar-content").html(o.message);
  if (o.type == "notice" || o.type == "accept"){
      icon_name = "info-circle";
  } else {
      icon_name = "warning";
  }
  icon_div = $("<i />").addClass("fa fa-" + icon_name);
  icon_container = $("<div />").addClass("icon_container").append(icon_div);
  wrap_bar = $("<div />").addClass("jbar");
  if(o.type == "warning") wrap_bar.addClass('error_jbar');

  wrap_bar.append(message_span).hide().slideDown("fast");
  wrap_bar.append(icon_container);
  $("body").append(wrap_bar);

  // only auto close if it's not an "accept" type
  if (o.type != "accept"){
      time_wait = $(message_span).text().length * 35;
      if (time_wait < 3500) {
          time_wait = 3500;
      }
      timeout = setTimeout("$.notification.removebar()", time_wait);
  }
  // always clear the hash so reloads don't fire alert again
  window.location.hash = '';
  history.pushState('', document.title, window.location.pathname+window.location.search);
};

timeout =  0;

$.notification.removebar = function() {
  if ($(".jbar").length) {
    clearTimeout(timeout);
    $(".jbar").slideUp("fast", function() {
      $(this).remove();
    });
  }
};
/**
 * 		logout:
 success: "Log out successfully"
 login:
     empty_username: "Empty username"
     empty_password: "Empty password"
     failed: "Login failed"
     not_activated: "Account not activated"
     password_expired: "Password expired - reset to login"
     success: "Successfully logged in"
     already: "Already logged in"
 profile:
     title: "Edit profile"
 change_password:
     title: "Change password"
 change_password_action:
     error_confirmation: "Confirmation doesn't match"
     too_short: "Password too short. Minimum %s characters"
     success: "Password successfully changed"
     error: "Error while trying to change your password"
     wrong_old_password: "Your old password is incorrect"
     user_not_exist: "User doesn't exist"
 send_password_instructions:
     success: "Reset email sent"
     error: "Error while trying to send the email"
     email_subject: "Password reset for PCH"
 global:
     not_connected: "Not connected"
     invalid_format: "Invalid format"
     update_success: "Updated successfully"
     wrong_parameters: "Wrong parameters"
     empty_fields: "Please fill in all required fields"
     empty_field: "This field is required"
     primary: "Primary"
     add: "Add"
     edit: "Edit"
     remove: "Remove"
     close: "Close"
     next: "Next"
     previous: "Previous"
     more_details: "More details"
     username: "Username"
     password: "Password"
     cancel: "Cancel"
     confirm: "Confirm"
     name: "Name"
     caution: "Caution"
     url: "URL"
     other: "Other"
     save_changes: "Save Changes"
     primary_email: "Primary Email Address"
     alternate_email: "Alternate Email Address"
     homepage: "Homepage"
     home: "Home"
     registration: "Registration"
     profile: "Profile"
     organizations: "Organizations"
     confirmation: "Confirmation"
     password_dont_match: "Passwords Don't Match"
 change_username:
     title: "Change username"
     sames_as_old: "Username same as old one"
     already_taken: "Username already taken"
     error: "Error while tring to change the username"
     success: "Username changed successfully"
 password_reset:
     already_changed: "Password already changed"
     link_expired: "Link expired"
     title: "Reset password"
     reset_id_not_found: "Password reset ID not found"
 save_new_password:
     wrong_code: "Invalid verification code"
     success: "You successfully changed your password"
     error: "Error while tring to change the password"

 no_login_or_email_match: ""

 register:
     error: "Error while trying to register"
     wrong_user_type: "Incorrect user type"
     empty_role_name: "Empty role name"
     empty_first_name: "Empty first name"
     empty_last_name: "Empty last name"
     empty_name_order: "Empty name order"
     loading_organizations: "Loading Organizations..."
     wrong_login: "Invalid characters in username or username too long"
     already_login: "Login already taken"
     empty_language: "Empty preferred language"
     empty_email: "Empty email"
     already_email: "Email address already in use"
     wrong_email: "Incorrect email"
     invalid_email: "Please use a valid email address"
     empty_organization: "Please provide at least one organization"
     empty_organization_name: "Empty organization name"
     empty_organization_type: "Empty organization type"
     empty_organization_url: "Empty organization URL"
     empty_organization_relationship: "Please fill in your relationship within the organization"
     empty_password_confirmation: "Please retype your password"
     short_validity_warning: "Your password has a very short validity period!"
     short_validity_confirm: "Are you sure you want your password validity to be so short? We recommend having a password with more entropy so it will be valid longer!"
     activation_email_subject: "Account activation for PCH"
     request_org_approval_subject: "Approval of new PCH user account"

 activate:
     success: "Your account has been successfully activated"
     error: "Couldn't activate your account. The link may have expired"
 */
$( document ).ready(function() {
    var messages = new Object();
    var warnings = new Object();
    var type = 'notice';
    messages['#logout-success'] = 'Log out successful';
    messages['#login-success'] = 'Successfully logged in';
    messages['#login-already'] = 'Already logged in';
    messages['#not_activated'] = 'Account not activated';
    messages['#password_expired'] = 'Password expired - reset to login';
    messages['#login_success'] = 'Successfully logged in';
    messages['#not_connected'] = 'Not connected';
    messages['#wrong_parameters'] = 'Wrong parameters';
    messages['#empty_password'] = 'Empty password';
    messages['#error_confirmation'] = 'Confirmation doesn\'t match';
    messages['#too_short'] = 'Password too short. Minimum 1 characters';
    messages['#change_success'] = 'Password successfully changed';
    messages['#change_error'] = 'Error while trying to change your password';
    messages['#wrong_old_password'] = 'Your old password is incorrect';
    messages['#user_not_exist'] = 'User doesn\'t exist';
    messages['#empty_username'] = 'Empty username';
    messages['#send_success'] = 'Reset email sent';
    messages['#sames_as_old'] = 'Username same as old one';
    messages['#no_login_or_email_match'] = 'Password can not be the same as your email or your login';
    messages['#save_success'] = 'You successfully changed your password';
    messages['#save_error'] = 'Error while trying to change the password';
    messages['#register_error'] = 'Error while trying to register';
    messages['#activate_succes'] = 'Your account has been successfully activated';
    messages['#activate_error'] = 'Couldn\'t activate your account. The link may have expired';
    messages['#error_sending_reset_email'] = 'Error sending reset email.  Please try again or contact us if the problem persists';

    warnings['#register_error'] = true;
    warnings['#activate_error'] = true;
    warnings['#save_error'] = true;
    warnings['#not_activated'] = true;
    warnings['#error_sending_reset_email'] = true;

    var message_hash = window.location.hash;
    if (message_hash != undefined && messages[message_hash] != undefined) {
        var message = messages[message_hash];
        if (warnings[message_hash] != undefined){
            type = 'warning';
        }
        $.notification({message: message, type: type})
    }
});