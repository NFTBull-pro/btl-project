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
});

var mdis = document.querySelectorAll(".todo-single-item .mdi");
mdis.forEach(function (fa) {
  fa.addEventListener("click", function (e) {
    e.stopPropagation();
    e.target.parentElement.classList.toggle("finished");
    var elem = e.target.parentElement;
    $(elem).fadeOut(500, function () {
      $(elem).remove();
    });
    conn.send(
      JSON.stringify({ status: "del_notification", _id: elem.id.split("_")[1] })
    );
    $("#notification_badge").text(
      parseInt($("#notification_badge").text(), 10) - 1
    );
  });
});
