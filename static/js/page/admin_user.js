var conn = null;
var table = null;

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
        default:
          break;
      }
  }
}

$(document).ready(function () {
  conn = connect();
  table = $("#hoverable-data-table").DataTable({
    aLengthMenu: [
      [20, 30, 50, 75, -1],
      [20, 30, 50, 75, "весь список"],
    ],
    pageLength: -1,
    language: {
      url: "http://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Russian.json",
    },
    dom: '<"row justify-content-between top-information"lf>rt<"row justify-content-between bottom-information"ip><"clear">',
  });
});
