var conn = null;

function websocket_callback(event) {
  var data = JSON.parse(event.data);
  console.log("WebSocket: " + data.action);
  switch (data.action) {
    case "new_notification":
      $.toast({
        heading: "Новое уведомление",
        text: data.text,
        showHideTransition: "fade",
        icon: "info",
        position: "bottom-right",
      });
      $("#notification_badge").text(
        parseInt($("#notification_badge").text(), 10) + 1
      );
      $("#notification_badge").removeClass("d-none");
      break;
    case "update_notification":
      set_notification(data);
      break;
    case "form_status":
      switch (data.status) {
        case "successful":
          $.toast({
            heading: "Успешно",
            text: data.text,
            showHideTransition: "fade",
            icon: "success",
            position: "bottom-right",
          });

          setTimeout(reload, 2000);
          break;

        case "error":
          $.toast({
            heading: "Ошибка",
            text: data.text,
            showHideTransition: "fade",
            icon: "error",
            position: "bottom-right",
          });
          break;
      }
      break;
  }
}

$(document).ready(function () {
  conn = connect();
  $(document).on("submit", "#updateProfile_form", function (event) {
    let form = event.target;
    let data = new FormData();

    $.each($(form).serializeArray(), function (key, input) {
      if (input.value) data.append(input.name, input.value);
    });

    $.ajax({
      method: "POST",
      data: data,
      cache: false,
      contentType: false,
      processData: false,
    });

    return false;
  });
  $(document).on("submit", "#changePassword_form", function (event) {
    let form = event.target;
    let data = new FormData();

    $.each($(form).serializeArray(), function (key, input) {
      if (input.value) data.append(input.name, input.value);
    });

    $.ajax({
      method: "POST",
      data: data,
      cache: false,
      contentType: false,
      processData: false,
    });
    document.getElementById("changePassword_form").reset();
    return false;
  });
});
