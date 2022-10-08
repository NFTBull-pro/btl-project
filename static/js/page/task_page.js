var conn = null;
var table = null;
function websocket_callback(event) {
  var data = JSON.parse(event.data);
  console.log("WebSocket: " + data.action);

  switch (data.action) {
    case "update_notification":
      set_notification(data);
      break;
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
    case "form_status":
      switch (data.status) {
        default:
          break;
      }
  }
}
$(document).ready(function () {
  conn = connect();
});
