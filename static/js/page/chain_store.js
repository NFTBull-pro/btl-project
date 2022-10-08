var table = null;
var fire = true;

$(document).ready(function () {
  table = $("#hoverable-data-table").DataTable({
    aLengthMenu: [
      [20, 30, 50, 75, -1],
      [20, 30, 50, 75, "весь список"],
    ],
    pageLength: 20,
    language: {
      url: "http://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Russian.json",
    },
    dom: '<"row justify-content-between top-information"lf>rt<"row justify-content-between bottom-information"ip><"clear">',
  });
});

var conn = null;
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
      $("#btnSubmit").attr("disabled", false);
      switch (data.status) {
        case "successful":
          document.getElementById("addChainStore_form").reset();
          $("#exampleModalForm").modal("hide");
          $.toast({
            heading: "Успешно",
            text: data.text,
            showHideTransition: "fade",
            icon: "success",
            hideAfter: false,
            position: "bottom-right",
          });
          updateUI("add_to_table", data.object);
          break;
        case "error":
          document.getElementById("addChainStore_form").reset();
          $("#exampleModalForm").modal("hide");
          $.toast({
            heading: "Ошибка",
            text: data.text,
            showHideTransition: "fade",
            icon: "error",
            hideAfter: false,
            position: "bottom-right",
          });
          break;
      }
  }
}
function updateUI(status, obj) {
  switch (status) {
    case "add_to_table":
      table
        .row($("#hoverable-data-table").find(".dataTables_empty").parent("tr"))
        .remove()
        .draw();
      var tr = $(
        `<tr onclick="window.open(window.location.href+'/${obj._id}','_self')"><th>${obj.name}</th><th>${obj.store_count}</th><th>${obj.project_name}</th></tr>`
      );
      table.row
        .add(tr)
        .draw()
        .on("click", function () {
          window.open(window.location.href + "/" + obj._id, "_self");
        });
      break;
  }
}

$(document).ready(function () {
  conn = connect();

  $(document).on("submit", "#addChainStore_form", function (event) {
    $("#btnSubmit").attr("disabled", true);
    let form = event.target;
    let data = new FormData();

    $.each($(form).serializeArray(), function (key, input) {
      if (input.value) data.append(input.name, input.value);
    });

    if (data.has("contact") == false) {
      data.append("contact", "-");
    }
    //Ограничиваем кол-во запросов
    if (fire == true) {
      fire = false;
      $.ajax({
        method: "POST",
        data: data,
        cache: false,
        contentType: false,
        processData: false,
      });

      //Устанавливаем обратно тру
      setTimeout(function () {
        fire = true;
        $("#btnSubmit").attr("disabled", false);
      }, 3000);

      return false;
    }
    return true;
  });
});
