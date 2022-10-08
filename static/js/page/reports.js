var table = null;
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
    case "set_reports_by_date":
      data.tg_users.forEach(function (value, key) {
        table
          .cell(
            $(`tr[data-tgUserId="${value._id}"]`).find(
              'th[data-status="task_stat"]'
            )
          )
          .data(value.task_stat);
        table
          .cell(
            $(`tr[data-tgUserId="${value._id}"]`).find(
              'th[data-status="schedule_stat"]'
            )
          )
          .data(value.schedule_stat);
      });
      break;
  }
}

$(document).ready(function () {
  conn = connect();
  table = $("#hoverable-data-table").DataTable({
    aLengthMenu: [
      [20, 30, 50, 75, -1],
      [20, 30, 50, 75, "весь список"],
    ],
    dom:
      "<'row'<'col-sm-4'l><'col-sm-5' <'datesearchbox'>><'col-sm-3'f>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    pageLength: -1,
    language: {
      processing: "Подождите...",
      search: "Поиск:",
      lengthMenu: "Показать _MENU_ записей",
      info: "Записи с _START_ до _END_ из _TOTAL_ записей",
      infoEmpty: "Записи с 0 до 0 из 0 записей",
      infoFiltered: "(отфильтровано из _MAX_ записей)",
      loadingRecords: "Загрузка записей...",
      zeroRecords: "Записи отсутствуют.",
      emptyTable: "В таблице отсутствуют данные",
      paginate: {
        first: "Первая",
        previous: "Предыдущая",
        next: "Следующая",
        last: "Последняя",
      },
    },
  });
  //ставим датапикер
  $("div.datesearchbox").html(
    '<div class="input-group"> <div class="input-group-addon"> <i class="glyphicon glyphicon-calendar"></i> </div><input type="text" class="form-control pull-right" id="datesearch" placeholder="Выберите период..." autocomplete="off"> </div>'
  );

  document.getElementsByClassName("datesearchbox")[0].style.textAlign = "right";

  $("#datesearch").daterangepicker({
    autoUpdateInput: false,
  });

  $("#datesearch").on("apply.daterangepicker", function (ev, picker) {
    $(this).val(
      picker.startDate.format("DD.MM.YYYY") +
        " - " +
        picker.endDate.format("DD.MM.YYYY")
    );
    start_date = picker.startDate.format("DD.MM.YYYY");
    end_date = picker.endDate.format("DD.MM.YYYY");
    //Мы взяли начало и конец и теперь отправляем данные на сервер и получаем новую статистику
    $.toast({
      heading: "Ожидайте",
      showHideTransition: "fade",
      icon: "info",
      position: "bottom-right",
    });
    conn.send(
      JSON.stringify({
        status: "get_reports_by_date",
        start_date: start_date,
        end_date: end_date,
      })
    );
  });

  $("#datesearch").on("cancel.daterangepicker", function (ev, picker) {
    location.reload();
  });
  // Обрабатываем дату из периода

  // Ставим фильтры для таблицы
  $("#filterProject").on("change", function () {
    if (table.column(2).search() !== this.value) {
      table.column(2).search(this.value).draw();
    }
  });
  $("#filterChain").on("change", function () {
    if (table.column(4).search() !== this.value) {
      table.column(4).search(this.value).draw();
    }
  });
  $("#filterCity").on("change", function () {
    if (table.column(3).search() !== this.value) {
      table.column(3).search(this.value).draw();
    }
  });
  $("#filterStore").on("change", function () {
    if (table.column(5).search() !== this.value) {
      table.column(5).search(this.value).draw();
    }
  });
});
