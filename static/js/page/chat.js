var conn = null;
var telegram_counter = 0;
var chat_data = {};
var open_user = {};
const message_counter = 100;

$(document).ready(function () {
  conn = connect();

  var tg_user_id = GetURLParameter("tg_user_id");
  if (tg_user_id) {
    switching_chats(tg_user_id);
  }

  // Устанавливаем скролл на див
  var chatRightContent = $("#chat-right-content");
  if (chatRightContent.length != 0) {
    chatRightContent.slimScroll({ start: "bottom" });
  }

  // Переключение чата
  $("a.media-message").click(function () {
    let tg_user_id = $(this).attr("href").split("#")[1].replace("chat_", "");
    telegram_counter = 0;
    chat_data = {};
    open_user = {};
    // Берем последние сообщения и выводим

    $("div.telegram-message-wrapper").remove();
    $("#spinner_loading").removeClass("d-none");

    switching_chats(tg_user_id);
  });

  function switching_chats(tg_user_id) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        const data = JSON.parse(this.response);
        if (data.telegram_message_list.length != 0){
          chat_data = data;
          open_user = data.tg_user;
  
          $("#chat_header").text(data.tg_user['FIO']);
  
          var htmlContent = document.createElement("div");
          $(htmlContent).addClass("telegram-message-wrapper");
  
          $("#spinner_loading").addClass("d-none");
  
          for (
            let index = 0;
            index < data.telegram_message_list.length;
            index++
          ) {
            const element = data.telegram_message_list[index];
  
            let media_class = "";
            if (element.from_user) {
              media_class = "media-left";
            } else {
              media_class = "media-right";
            }
  
            $(htmlContent).prepend(`
                          <div class="media media-chat ${media_class}">
                              <div class="media-body">
                                  <p class="message">${element.text}</p>
                                  <div class="date-time">${element.datetime}</div>
                              </div>
                          </div>
                      `);
  
            telegram_counter++;
            if (telegram_counter > message_counter) {
              break;
            }
          }
          $("#telegram").append(htmlContent);
          // Подтягиваем скролл вниз
          var bottomCoord = $("#chat-right-content")[0].scrollHeight;
          $("#chat-right-content").slimScroll({ scrollTo: bottomCoord });
        }else{
          $("#chat_header").text('Чат пустой');
          $("#spinner_loading").addClass("d-none");
        }
        
      }
    };
    xhttp.open("POST", "get_message_from_user_by_id", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(
      JSON.stringify({
        tg_user_id: tg_user_id,
      })
    );
  }

  $("#chat-find").on("input", function () {
    if (this.value) {
      $("#chat-left-content").find("li").addClass("d-none");
      $("#chat-left-content")
        .find("li")
        .find(`.title:contains('${this.value}')`)
        .parent()
        .parent()
        .parent()
        .parent()
        .removeClass("d-none");
    } else {
      $("#chat-left-content").find("li").removeClass("d-none");
    }
  });

  $(document).on("submit", "#send_message_form", function (event) {
    let form = event.target;
    let data = {};

    data["status"] = "send_message_admin";

    $.each($(form).serializeArray(), function (key, input) {
      if (input.value) data[input.name] = input.value;
    });

    data["tg_user_id"] = open_user._id;

    conn.send(JSON.stringify(data));
    form.reset();

    return false;
  });

  // Проверяем где сейчас скролл
  var load_chat_slom_scroll = false;
  $("#chat-right-content").on("slimscroll", function (e, pos) {
    if (pos == "top" && load_chat_slom_scroll) {
      var last_telegram_counter = telegram_counter + message_counter;
      var htmlContent = $("div.telegram-message-wrapper");

      for (
        let index = telegram_counter;
        index < chat_data.telegram_message_list.length;
        index++
      ) {
        const element = chat_data.telegram_message_list[index];

        let media_class = "";
        if (element.from_user) {
          media_class = "media-left";
        } else {
          media_class = "media-right";
        }

        $(htmlContent).prepend(`
                    <div class="media media-chat ${media_class}">
                        <div class="media-body">
                            <p class="message">${element.text}</p>
                            <div class="date-time">${element.datetime}</div>
                        </div>
                    </div>
                `);

        telegram_counter++;
        if (telegram_counter > last_telegram_counter) {
          break;
        }

        // Подтягиваем скролл вниз
        $("#chat-right-content").slimScroll({ scrollTo: 200 });
      }

      var htmlContent = $("div.telegram-message-wrapper");
    }
    if (load_chat_slom_scroll == false) {
      load_chat_slom_scroll = true;
    }
  });
});

function GetURLParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split("&");

  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split("=");
    if (sParameterName[0] == sParam) {
      return decodeURIComponent(sParameterName[1]);
    }
  }
}

function websocket_callback(event) {
  const data = JSON.parse(event.data);
  console.log("WebSocket: " + data.action);
  switch (data.action) {
    case "connect":
      console.log("WebSocket законектился");
      break;
    case "user_send_message":
      // {tg_user_id: str, text: str, from_user: bool, datetime: str}
      // Если включен активный юзер то присылаем

      let last_msg = $(`a[href="#chat_${data.message.tg_user_id}"]`).find(
        ".last-msg"
      );
      $(last_msg).text(data.message.text);

      let date = $(`a[href="#chat_${data.message.tg_user_id}"]`).find(".date");
      $(date).text(data.message.datetime);

      if (open_user._id === data.message.tg_user_id) {
        let div_query = "";
        div_query = "div.telegram-message-wrapper";
        telegram_counter++;

        let media_class = "";
        if (data.message.from_user) {
          media_class = "media-left";
        } else {
          media_class = "media-right";
        }

        $(div_query).append(`
                    <div class="media media-chat ${media_class}">
                        <div class="media-body">
                            <p class="message">${data.message.text}</p>
                            <div class="date-time">${data.message.datetime}</div>
                        </div>
                    </div>
                `);

        var bottomCoord = $("#chat-right-content")[0].scrollHeight;
        $("#chat-right-content").slimScroll({ scrollTo: bottomCoord });
      }
      break;
    case "user_send_message_error":
      $.toast({
        heading: "Ошибка при отправке (сделайте скриншот)",
        text: data.message,
        showHideTransition: "fade",
        icon: "error",
        hideAfter: false,
        position: "bottom-right",
      });
      break;
  }
}
