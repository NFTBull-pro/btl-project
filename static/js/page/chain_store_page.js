var map;
var pin;
var tilesURL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
var mapAttrib = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>';

MapCreate();

function MapCreate() {
  if (!(typeof map == "object")) {
    map = L.map("map", {
      center: [55.754374, 37.620112],
      zoom: 10,
    });
  } else map.setZoom(10).panTo([55, 37]);

  L.tileLayer("http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  }).addTo(map);

  L.control.scale().addTo(map);
  var searchControl = new L.esri.Controls.Geosearch({
    position: "topleft",
    expanded: true,
    collapseAfterResult: false,
    placeholder: "Введите адрес",
  }).addTo(map);
  var searchinput = $(searchControl.getContainer());

  searchinput.find("input").attr("autocomplete", "chrome-off");
  searchinput.find("input").attr("placeholder", "Введите адрес");
  searchinput.find("input").attr("name", "address");
  searchinput.find("input").attr("id", "leaflet_address_input");

  $("#leaflet_address").append(searchinput);

  var results = new L.LayerGroup().addTo(map);

  searchControl.on("results", function (data) {
    $("#leaflet_address_input").val(data.results[0].text);
    $.post(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${data.results[0].latlng.lat}&lon=${data.results[0].latlng.lng}`,
      function (data, status) {
        if (status == "success") {
          if (data.address.region) {
            var city = data.address.region;
          }
          if (data.address.state) {
            var city = data.address.state;
          }
          if (data.address.village) {
            var city = data.address.village;
          }
          if (data.address.town) {
            var city = data.address.town;
          }
          if (data.address.city) {
            var city = data.address.city;
          }

          $("#city").val(city);
        }
      }
    );
    $("#lat").val(data.results[0].latlng.lat);
    $("#lng").val(data.results[0].latlng.lng);
  });
}

map.on("click", function (ev) {
  $.post(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${ev.latlng.lat}&lon=${ev.latlng.lng}`,
    function (data, status) {
      if (status == "success") {
        if (data.address.region) {
          var city = data.address.region;
        }
        if (data.address.state) {
          var city = data.address.state;
        }
        if (data.address.village) {
          var city = data.address.village;
        }
        if (data.address.town) {
          var city = data.address.town;
        }
        if (data.address.city) {
          var city = data.address.city;
        }

        $("#city").val(city);
      }
    }
  );

  $("#lat").val(ev.latlng.lat);
  $("#lng").val(ev.latlng.lng);
  //TODO щас будем эту локацию на сервер и адрес доставать
  conn.send(
    JSON.stringify({
      status: "get_address_by_location",
      latitude: ev.latlng.lat,
      longitude: ev.latlng.lng,
    })
  );

  if (typeof pin == "object") pin.setLatLng(ev.latlng);
  else {
    pin = L.marker(ev.latlng, { riseOnHover: true, draggable: true });
    pin.addTo(map);
    pin.on("drag", function (ev) {
      $("#lat").val(ev.latlng.lat);
      $("#lng").val(ev.latlng.lng);
    });
  }
});

var conn = null;
var fire = true;

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
          document.getElementById("addStore_form").reset();
          $("#exampleModalForm").modal("hide");
          $.toast({
            heading: "Успешно",
            text: data.text,
            showHideTransition: "fade",
            icon: "success",
            position: "bottom-right",
          });

          updateUI("add_to_table", data.object);

          break;
        case "error":
          $.toast({
            heading: "Ошибка",
            text: data.text,
            showHideTransition: "fade",
            icon: "error",
            position: "bottom-right",
          });
          break;
      }
      break;
    case "delete_status":
      switch (data.status) {
        case "successful":
          $.toast({
            heading: "Успешно",
            text: data.text,
            showHideTransition: "fade",
            icon: "success",
            position: "bottom-right",
          });

          $("#" + data.object_id).remove();

          break;
        case "error":
          $.toast({
            heading: "Ошибка",
            text: data.text,
            showHideTransition: "fade",
            icon: "error",
            position: "bottom-right",
          });
          break;
      }
      break;
    case "set_location_by_address":
      map.setZoom(17).panTo([data.latitude, data.longitude]);
      break;
    case "set_address_by_location":
      //if (!$("input[name='address']").val())
      $("input[name='address']").val(data.address);
      break;
    case "update_status":
      switch (data.status) {
        case "successful":
          document.getElementById("addStore_form").reset();
          $("#exampleModalForm").modal("hide");
          $.toast({
            heading: "Успешно",
            text: data.text,
            showHideTransition: "fade",
            icon: "success",
            position: "bottom-right",
          });

          $("#" + data.object._id).remove();
          updateUI("add_to_table", data.object);

          break;
        case "error":
          $.toast({
            heading: "Ошибка",
            text: data.text,
            showHideTransition: "fade",
            icon: "error",
            position: "bottom-right",
          });
          break;
      }
      break;
  }
}

function updateUI(status, obj) {
  switch (status) {
    case "add_to_table":
      $("#store_table").find(".odd").remove();
      $("#store_table").find("tbody").append(
          `<tr id="${obj._id}">
                <td>${obj.name}</td>
                <td>${obj.city}</td>
                <td>${obj.address}</td>
                <td>${obj.radius}</td>
                <td>${obj.contact}</td>

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
                                <a onclick="deleteStore('${obj._id}')">Удалить</a>
                            </li>
                        </ul>
                    </div>
                </td>
            </tr>`);
      break;
  }
}
function deleteStore(store_id) {
  let data = new FormData();
  data.append("status", "delete_store");
  data.append("store_id", store_id);
  $.ajax({
    method: "POST",
    data: data,
    cache: false,
    contentType: false,
    processData: false,
  });
}

function updateStore(store) {
  $("#exampleModalForm").modal("show");

  var hidden_input = $(
    `<input type=\"text\" class=\"form-control\" hidden name=\"store_id\" value=\"${store["_id"]}\">`
  );

  $("#addStore_form").append(hidden_input);

  $("#exampleModalForm").find("[name='status']").val("update_store");
  $("#exampleModalForm").find("[name='name']").val(store["name"]);
  $("#exampleModalForm").find("[name='city']").val(store["city"]);
  $("#exampleModalForm").find("[name='address']").val(store["address"]);
  $("#exampleModalForm").find("[name='latitude']").val(store["latitude"]);
  $("#exampleModalForm").find("[name='longitude']").val(store["longitude"]);
  $("#exampleModalForm").find("[name='radius']").val(store["radius"]);
  $("#exampleModalForm").find("[name='contact']").val(store["contact"]);

  $("#exampleModalForm").find("[type='submit']").html("Обновить");

  map
    .setZoom(18)
    .panTo([parseFloat(store["latitude"]), parseFloat(store["longitude"])]);
  $("#exampleModalForm").on("hidden.bs.modal", function (e) {
    document.getElementById("addStore_form").reset();
    map.setZoom(10).panTo([55.754374, 37.620112]);
    $("#exampleModalForm").find("[type='submit']").html("Добавить");
    $("#exampleModalForm").find("[name='status']").val("add_store");
    $("#exampleModalForm").find("[name='store_id']").remove();
    $("#exampleModalForm").unbind("hidden.bs.modal");
  });
}

$("input[name='address']").change(function () {
  conn.send(
    JSON.stringify({
      status: "get_location_by_address",
      address: $(this).val(),
    })
  );
});

$(document).ready(function () {
  conn = connect();
  $(document).on("submit", "#addStore_form", function (event) {
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
  $("#exampleModalForm").on("shown.bs.modal", function (e) {
    map.invalidateSize();
  });
});

function deleteChainStore(chain_store_id) {
  let data = new FormData();
  data.append("chain_store_id", chain_store_id);
  $.ajax({
    url: "/chain_store_delete",
    method: "POST",
    data: data,
    cache: false,
    contentType: false,
    processData: false,
    success: function () {
      document.location.href = "/chain_store";
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
