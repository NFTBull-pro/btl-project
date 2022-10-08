var table = null;

$(document).ready(function () {
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
$("#filterStore").on("change", function () {
  if (table.column(2).search() !== this.value) {
    table.column(2).search(this.value).draw();
  }
});

$('input[name="timing"]').daterangepicker({
  singleDatePicker: true,
  showDropdowns: true,
  locale: {
    format: "DD.MM.YYYY",
  },
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
      switch (data.status) {
        case "add":
          document.getElementById("addKPI_form").reset();
          $("#exampleModalForm").modal("hide");
          $.toast({
            heading: "Успешно",
            text: data.text,
            showHideTransition: "fade",
            icon: "success",
            position: "bottom-right",
          });
          updateUI(data.object);
          break;
        case "update":
          document.getElementById("addKPI_form").reset();
          $("#exampleModalForm").modal("hide");

          var tr = $(`tr[data-kpiId=${data.object._id}]`);
          table.row(tr).remove().draw();

          $.toast({
            heading: "Успешно",
            text: data.text,
            showHideTransition: "fade",
            icon: "success",
            position: "bottom-right",
          });

          updateUI(data.object);
          break;
        case "error":
          document.getElementById("addKPI_form").reset();
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
function updateUI(obj) {
  table
    .row($("#hoverable-data-table").find(".dataTables_empty").parent("tr"))
    .remove()
    .draw();
  let update = "updateKPI(" + JSON.stringify(obj) + ")";
  var tr = $(`<tr data-kpiId=${obj._id}>
                        <th>${obj.project_name}</th>
                        <th>${obj.chain_store_name}</th>
                        <th>${obj.store_name}</th>
                        <th>${obj.name}</th>
                        <th>${obj.description}</th>
                        <th>${obj.timing}</th>
                        <td class="text-right">
                            <div
                                class="dropdown show d-inline-block widget-dropdown">
                                <a class="dropdown-toggle icon-burger-mini" href=""
                                    role="button" id="dropdown-recent-order1"
                                    data-toggle="dropdown" aria-haspopup="true"
                                    aria-expanded="false" data-display="static"></a>
                                <ul class="dropdown-menu dropdown-menu-right"
                                    aria-labelledby="dropdown-recent-order1">
                                    <li class="dropdown-item">
                                        <a onclick='${update}'>Изменить</a>
                                    </li>
                                    <li class="dropdown-item">
                                        <a
                                        onclick="deleteKPI('${obj._id}')">Удалить</a>
                                    </li>
                                </ul>
                            </div>
                        </td>
                    </tr>
         `);
  table.row.add(tr).draw();
}
function deleteKPI(kpi_id) {
  let data = new FormData();
  data.append("status", "delete_kpi");
  data.append("kpi_id", kpi_id);
  $.ajax({
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
function updateKPI(kpi) {
  console.log("яяя1");
  if (kpi instanceof String) {
    console.log("яяя");
    var kpi = JSON.parse(kpi);
  }
  $("#exampleModalForm").modal("show");

  var hidden_input = $(
    `<input type=\"text\" class=\"form-control\" hidden name=\"kpi_id\" value=\"${kpi["_id"]}\">`
  );
  $("#addKPI_form").append(hidden_input);

  $("#exampleModalFormTitle").text("Обновление KPI");

  $("#exampleModalForm").find("[name='status']").val("update_kpi");
  $("#exampleModalForm").find("[name='store_id']").val(kpi["store_id"]);
  $("#exampleModalForm").find("[name='name']").val(kpi["name"]);
  $("#exampleModalForm").find("[name='description']").val(kpi["description"]);
  $("#exampleModalForm").find("[name='timing']").val(kpi["timing"]);

  $("#exampleModalForm").on("hidden.bs.modal", function (e) {
    document.getElementById("addKPI_form").reset();
    $("#exampleModalForm").find("[name='status']").val("add_kpi");
    $("#exampleModalForm").find("[name='kpi_id']").remove();
    $("#exampleModalForm").unbind("hidden.bs.modal");
  });
}

$(document).ready(function () {
  conn = connect();
  $(document).on("submit", "#addKPI_form", function (event) {
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

    $.toast({
      heading: "Ожидайте",
      text: "Идет сохранение",
      showHideTransition: "fade",
      icon: "info",
      position: "bottom-right",
    });

    return false;
  });
});
