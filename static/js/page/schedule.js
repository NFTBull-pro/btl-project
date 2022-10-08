var conn = null;
var table = null;

function websocket_callback(event) {
  var data = JSON.parse(event.data);
  console.log("WebSocket: " + data.action);
  switch (data.action) {
    case "checked_work":
      $(`div[data-storeId="${data.store_id}"]`)
        .find(
          `.schedule_time_input[data-id="${data.user_id}"][data-day="${data.day}"][data-status="real"][data-status="real"][data-timekey="start_time"]`
        )
        .val(data.start_time);
      $(`div[data-storeId="${data.store_id}"]`)
        .find(
          `.schedule_time_input[data-id="${data.user_id}"][data-day="${data.day}"][data-status="real"][data-status="real"][data-timekey="start_time"]`
        )
        .removeClass("schedule_time_item_red");

      if ("end_time" in data) {
        $(`div[data-storeId="${data.store_id}"]`)
          .find(
            `.schedule_time_input[data-id="${data.user_id}"][data-day="${data.day}"][data-status="real"][data-status="real"][data-timekey="end_time"]`
          )
          .val(data.end_time);
        $(`div[data-storeId="${data.store_id}"]`)
          .find(
            `.schedule_time_input[data-id="${data.user_id}"][data-day="${data.day}"][data-status="real"][data-status="real"][data-timekey="end_time"]`
          )
          .removeClass("schedule_time_item_red");
      }

      break;
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
      break;
    case "update_error_schedule":
      switch (data.status) {
        case "successful":
          $.toast({
            heading: "График работ загружен",
            showHideTransition: "fade",
            icon: "success",
            position: "bottom-right",
          });
          break;
        case "error":
          $.toast({
            heading: "Ошибка",
            text: data.data,
            showHideTransition: "fade",
            icon: "error",
            position: "bottom-right",
          });
          break;
        default:
          break;
      }
      break;
  }
}

$(document).ready(function () {
  conn = connect();

  $(".schedule_time_input").timepicker({
    timeFormat: "HH:mm",
    interval: 60,
    dynamic: false,
    dropdown: true,
    scrollbar: true,
    interval: 5,
    change: function (time) {
      conn.send(
        JSON.stringify({
          status: "update_schedule",
          day: $(this).data("day"),
          time_status: $(this).data("status"),
          timekey: $(this).data("timekey"),
          user_id: $(this).data("id"),
          time: $(this).val(),
          store_id: $(this).parent().data("storeid"),
        })
      );
      $(this).data("pred", $(this).val());
    },
  });

  var table = $("#hoverable-data-table").DataTable({
    aLengthMenu: [
      [20, 30, 50, 75, -1],
      [20, 30, 50, 75, "весь список"],
    ],
    pageLength: -1,
    orderCellsTop: true,
    fixedHeader: true,
    scrollX: true,
    columnDefs: [
      {
        targets: [0, 1, 2, 3, 4],
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

  // Ставим фильтры для таблицы
  $("#filterProject").on("change", function () {
    if (table.column(0).search() !== this.value) {
      table.column(0).search(this.value).draw();
    }
  });
  $("#filterChain").on("change", function () {
    if (table.column(1).search() !== this.value) {
      table.column(1).search(this.value).draw();
    }
  });
  $("#filterCity").on("change", function () {
    if (table.column(2).search() !== this.value) {
      table.column(2).search(this.value).draw();
    }
  });

  $(".custom-file-input").on("change", function () {
    var fileName = $(this).val();
    $(this).next(".custom-file-label").html(fileName);
  });

  $('input[name="table_file"').on("change", function () {
    //загружаем файл
    swal({
      title: "Вы уверенны?",
      text: "Загрузка таблицы автоматически обновит график работы на текущий месяц! Будьте внимательны, загружать график работ нужно только для текущего месяца!",
      icon: "warning",
      buttons: true,
      buttons: ["Отменить", "Загрузить"],
    }).then((willDelete) => {
      if (willDelete) {
        let data = new FormData();

        $.toast({
          heading: "Ожидайте",
          text: "Идет загрузка таблицы",
          showHideTransition: "fade",
          icon: "info",
          hideAfter: 15000,
          position: "bottom-right",
        });

        if (this.files[0]) {
          if (this.files[0].size > 50000000) {
            $.toast({
              heading: "Слишком большой файл",
              text: "Файл больше 50 мб",
              showHideTransition: "fade",
              icon: "error",
              position: "bottom-right",
            });
            return false;
          }
          data.append(this.name, this.files[0]);

          $.ajax({
            method: "POST",
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            success: function (data, textStatus, jqXHR) {
              if (data.list_error) {
                //TODO обрабатывать ошибки
                async function processArray(array) {
                  for (const value of array) {
                    const schedule_data = value.schedule_data;
                    const error_type = value.error_type;
                    let text = `Ошибка в графике работ для ${schedule_data.FIO}`;
                    let schedule_key = "";
                    switch (error_type) {
                      case 1:
                        text +=
                          "\n\nНе правильно введен город\nВведите новый город";
                        schedule_key = "store_city";
                        break;
                      case 2:
                        text +=
                          "\n\nНе правильно введен адрес (магазина нет в базе)\nВведите новый адрес";
                        schedule_key = "store_address";
                        break;
                      case 3:
                        text +=
                          "\n\nНе правильно введено ФИО (пользователя нет в базе)\nВведите ФИО";
                        schedule_key = "FIO";
                        break;
                      case 4:
                        text +=
                          "\n\nСотрудник в одно время в двух разных местах";
                        await swal(text, {
                          button: { text: "Ок" },
                          icon: "warning",
                        });
                        break;
                      default:
                        break;
                    }
                    if (error_type != 4)
                      await swal(text, {
                        content: "input",
                        button: {
                          text: "Отмена",
                        },
                      }).then((data) => {
                        if (!data) throw null;
                        schedule_data[schedule_key] = data;
                        conn.send(
                          JSON.stringify({
                            status: "update_error_schedule",
                            error_type: error_type,
                            schedule_data: schedule_data,
                          })
                        );
                      });
                  }
                  setTimeout(() => {
                    location.reload();
                  }, 2000);
                }
                processArray(data.list_error);
              } else {
                location.reload();
              }
            },
            error: function (jqXHR, exception) {
              var msg = "";
              if (jqXHR.status === 0) {
                msg = "Сервер не отвечает";
              } else {
                msg = jqXHR.responseText;
              }
              $.toast({
                heading: "Ошибка",
                text: msg,
                showHideTransition: "fade",
                icon: "error",
                hideAfter: false,
                position: "bottom-right",
              });
            },
          });
        }
      } else {
        $('input[name="table_file"').val("");
      }
    });
  });

  $("select[name='project_id']").change(filterProject);
  $("select[name='chain_store_id']").change(filterChainStore);
});

function deleteSchedule(user_id, store_id) {
  let data = new FormData();
  data.append("user_id", user_id);
  data.append("store_id", store_id);
  $.ajax({
    url: "/schedule_delete",
    method: "POST",
    data: data,
    cache: false,
    contentType: false,
    processData: false,
    success: function () {
      location.reload();
    },
    error: function (jqXHR, exception) {
      var msg = "";
      if (jqXHR.status === 0) {
        msg = "Сервер не отвечает";
      } else {
        msg = jqXHR.responseText;
      }
      $.toast({
        heading: "Ошибка",
        text: msg,
        showHideTransition: "fade",
        icon: "error",
        hideAfter: false,
        position: "bottom-right",
      });
    },
  });
}

function filterChainStore() {
  var selectedItem = $(this).find("option:selected").val();

  var options = global_chain_dict[selectedItem];
  var newoptions = "";
  for (const option in options) {
    newoptions += `<option value="${option}">` + options[option] + "</option>";
  }
  if (newoptions) {
    $("select[name='store_id']").html(newoptions).removeAttr("disabled");
  }
}

function filterProject() {
  var selectedItem = $(this).find("option:selected").val();

  var options = global_project_dict[selectedItem];
  var newoptions = "";
  for (const option in options) {
    newoptions += `<option value="${option}">` + options[option] + "</option>";
  }
  if (newoptions) {
    $("select[name='chain_store_id']").html(newoptions).removeAttr("disabled");
  }

  $("select[name='chain_store_id']").change();

  var options = global_user_dict[selectedItem];
  var newoptions = "";
  for (const option in options) {
    newoptions += `<option value="${option}">` + options[option] + "</option>";
  }
  if (newoptions) {
    $("select[name='tg_user_id']").html(newoptions).removeAttr("disabled");
  }
}
