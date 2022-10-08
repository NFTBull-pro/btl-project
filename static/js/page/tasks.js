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

function filterProjectUser() {
  var selectedItem = $(this).find("option:selected").val();
  var options = project_user_dict[selectedItem];
  if (jQuery.isEmptyObject(options) == false) {
    var newoptions = "";
    for (const option in options) {
      newoptions +=
        `<option value="${option}">` + options[option] + "</option>";
    }
    if (newoptions) {
      $("#filterTgUser").html(newoptions).removeAttr("disabled");
    }
  } else {
    $("#filterTgUser").find("option").remove();
    $("#filterTgUser").attr("disabled", true);
  }
}

$(document).ready(function () {
  conn = connect();

  var table = $("#hoverable-data-table").DataTable({
    aLengthMenu: [
      [20, 30, 50, 75, -1],
      [20, 30, 50, 75, "весь список"],
    ],
    pageLength: -1,
    dom: '<"row justify-content-between top-information"lf>rt<"row justify-content-between bottom-information"ip><"clear">',
    columnDefs: [
      {
        targets: [0, 3],
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
  });

  // Ставим фильтры для формы
  $("#filterProject").change(filterProjectUser);

  // Ставим фильтры для таблицы
  $("#filterTypeTask").on("change", function () {
    if (this.value) {
      $(".filters_type").addClass("d-none");
      switch (this.value) {
        case "1":
          $(".filterProject_div").removeClass("d-none");
          break;
        case "2":
          $(".filterChainStore_div").removeClass("d-none");
          break;
        case "3":
          $(".filterStore_div").removeClass("d-none");
          break;
        case "4":
          $(".filterCity_div").removeClass("d-none");
          $(".filterProject_div").removeClass("d-none");
          break;
        case "5":
          $(".filterTgUser_div").removeClass("d-none");
          $(".filterProject_div").removeClass("d-none");
          break;
      }
    } else {
      $(".filters_type").addClass("d-none");
    }
  });

  $('input[name="date"]').daterangepicker({
    singleDatePicker: true,
    showDropdowns: true,
    minDate: new Date(),
    locale: {
      format: "DD.MM.YYYY",
      firstDay: 1,
      daysOfWeek: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    },
  });
  $('input[name="date_end"]').daterangepicker({
    singleDatePicker: true,
    showDropdowns: true,
    minDate: new Date(),
    locale: {
      format: "DD.MM.YYYY",
      firstDay: 1,
      daysOfWeek: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    },
  });
  $('select[name="repetitive"]').change(function () {
    if (this.value == "0") {
      $("#repetitive_end").addClass("d-none");
    } else {
      $("#repetitive_end").removeClass("d-none");
    }
  });

  $(document).on("submit", "#addTasks_form", function (event) {
    let form = event.target;
    let data = new FormData();

    $.each($(form).serializeArray(), function (key, input) {
      if (input.value) data.append(input.name, input.value);
    });

    let object_type = $("#filterTypeTask").val();
    let object_id = null;
    switch (object_type) {
      case "1":
        object_id = $("#filterProject").val();
        break;
      case "2":
        object_id = $("#filterChainStore").val();
        break;
      case "3":
        object_id = $("#filterStore").val();
        break;
      case "4":
        project_id = $("#filterProject").val();
        data.append("project_id", project_id);

        object_id = $("#filterCity").val();
        break;
      case "5":
        project_id = $("#filterProject").val();
        data.append("project_id", project_id);

        object_id = $("#filterTgUser").val();
        break;
    }

    data.append("object_type", object_type);
    data.append("object_id", object_id);

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
          position: "bottom-right",
        });
      },
    });
    return false;
  });

  $(document).on("submit", "#updateTask_form", function (event) {
    let form = event.target;
    let data = new FormData();

    $.each($(form).serializeArray(), function (key, input) {
      if (input.value) data.append(input.name, input.value);
    });

    $.ajax({
      url: "task_update",
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
    return false;
  });
});

function deleteTask(task_id) {
  let data = new FormData();
  data.append("task_id", task_id);
  $.ajax({
    url: "/task_delete",
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
function updateTask(task) {
  $("#updateTaskModalForm").modal("show");

  var hidden_input = $(
    `<input type=\"text\" class=\"form-control\" hidden name=\"task_id\" value=\"${task["_id"]}\">`
  );
  $("#updateTask_form").append(hidden_input);

  $("#updateTaskModalForm")
    .find("[name='description']")
    .val(task["description"]);

  let temp = task["timing"].split(" ");
  let date = temp[1];
  let time = temp[0];

  $("#updateTaskModalForm").find("[name='date']").val(date);
  $("#updateTaskModalForm").find("[name='time']").val(time);

  $('#updateTaskModalForm input[name="date"]').daterangepicker({
    startDate: date,
    singleDatePicker: true,
    showDropdowns: true,
    minDate: new Date(),
    locale: {
      format: "DD.MM.YYYY",
      firstDay: 1,
      daysOfWeek: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    },
  });

  if (task["is_phototask"]) {
    $("#updateTaskModalForm").find("[name='is_phototask']").val("1");
  } else {
    $("#updateTaskModalForm").find("[name='is_phototask']").val("0");
  }

  $("#updateTaskModalForm").on("hidden.bs.modal", function (e) {
    document.getElementById("updateTask_form").reset();
    $("#updateTask_form").find("[name='task_id']").remove();
    $("#updateTaskModalForm").unbind("hidden.bs.modal");
  });
}
