var table = null;
var fire = true;
var conn = null;

$(document).ready(function () {
  table = $("#hoverable-data-table").DataTable({
    aLengthMenu: [
      [20, 30, 50, 75, -1],
      [20, 30, 50, 75, "весь список"],
    ],
    pageLength: 200,
    order: [],
    columnDefs: [
      {
        targets: [0, 1, 2, 3, 4, 5],
        orderable: true,
      },
      {
        targets: "_all",
        orderable: false,
      },
    ],
    language: {
      url: "http://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Russian.json",
    },
    dom: '<"row justify-content-between top-information"lf>rt<"row justify-content-between bottom-information"ip><"clear">',
  });

  conn = connect();

  $("#addTGUser_form").unbind("submit");

  $(document).on("submit", "#addTGUser_form", function (event) {
    $("#btnSubmit").attr("disabled", true);

    let form = event.target;
    let data = new FormData();

    $.each($(form).serializeArray(), function (key, input) {
      if (input.value) data.append(input.name, input.value);
    });
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

// Ставим фильтры для таблицы
$("#filterProject").on("change", function () {
  if (table.column(2).search() !== this.value) {
    table.column(2).search(this.value).draw();
  }
});
$("#filterChain").on("change", function () {
  if (table.column(3).search() !== this.value) {
    table.column(3).search(this.value).draw();
  }
});
$("#filterStore").on("change", function () {
  if (table.column(4).search() !== this.value) {
    table.column(4).search(this.value).draw();
  }
});
$("#filterCity").on("change", function () {
  if (table.column(5).search() !== this.value) {
    table.column(5).search(this.value).draw();
  }
});

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
          document.getElementById("addTGUser_form").reset();
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
          document.getElementById("addTGUser_form").reset();
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
  console.log("Добавляю сотрудника");
  switch (status) {
    case "add_to_table":
      table
        .row($("#hoverable-data-table").find(".dataTables_empty").parent("tr"))
        .remove()
        .draw();
      var tr = $(
        `<tr onclick="window.open(window.location.href+'/${obj._id}','_self')"><th>${obj.FIO}</th><th>${obj.phone}</th><th>${obj.project_name}</th><th>${obj.chain_store_name}</th><th>${obj.store_name}</th><th>${obj.city}</th><th></th></tr>`
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
