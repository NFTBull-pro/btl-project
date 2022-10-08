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
    case "set_user_report_by_date":
      $("#schedule_stat").text(data.schedule_stat);
      $(".circle").circleProgress({
        lineCap: "round",
        value: data.schedule_procents,
        startAngle: 4.8,
        emptyFill: ["#f5f6fa"],
      });

      table.clear().draw();

      data.tasks.forEach(function (value, key) {
        let stat = "Не выполнил";
        if (value.task_status) {
          stat = "Выполнил";
        }
        // table.row.add( [value.timing, value.description, stat] ).draw();
        var tr = $(`
                        <tr onclick="window.open('/task_page/${value._id}');">
                            <th>${value.timing}</th>
                            <th>${value.description}</th>
                            <th>
                                ${stat}                                  
                            </th>
                        </tr>
                    `);
        table.row.add(tr).draw();
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
    pageLength: -1,
    language: {
      url: "http://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Russian.json",
    },
    dom: '<"row justify-content-between top-information"lf>rt<"row justify-content-between bottom-information"ip><"clear">',
  });
  //Выбор периода
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
        status: "get_user_report_by_date",
        tg_user_id: "{{tg_user['_id']}}",
        start_date: start_date,
        end_date: end_date,
      })
    );
  });

  $("#datesearch").on("cancel.daterangepicker", function (ev, picker) {
    location.reload();
  });
});
