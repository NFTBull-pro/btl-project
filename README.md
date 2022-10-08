# Telegram bot with admin platform

- **Project Name:** btl-bot
- **Team Name:** NFTBull

## Project Structure

```
btl_project
├─ config...................................**Основной конфиг проекта**
│  └─ config.yml
├─ static...................................**Директория с статическими файлами для WEB-страниц**
│  ├─ app
│  ├─ css
│  ├─ img
│  ├─ js...................................**Тут в папке page хранятся все файлы js**
│  ├─ plugins
│  └─ upload
├─ telegram_bot.............................**Директория чат-бота**
│  ├─ action_alarm.py.......................Потоки для проверки графика работ и выполнения задач
│  ├─ base.py...............................Конфигурация и основные переменные
│  ├─ bot.py
│  ├─ conversation.py.......................Настройка всех воронок
│  ├─ db.py
│  ├─ flows.py..............................Функции всех воронок
│  ├─ img
│  ├─ message.py............................Главное меню и обработка сообщений
│  ├─ registration.py.......................Воронки для регистрации
│  ├─ states.py
│  ├─ texts.py
│  └─ utils.py..............................Вспомагательные функции
├─ templates................................**Директория шаблонов для WEB**
│  ├─ admin-end.html........................Конец каждого шаблона
│  ├─ admin-layout.html.....................Начало каждого шаблона
│  ├─ admin_profile_page.html
│  ├─ admin_user.html
│  ├─ admin_user_page.html
│  ├─ bot_text.html
│  ├─ chain_store.html
│  ├─ chain_store_page.html
│  ├─ chat.html
│  ├─ dashboard.html
│  ├─ error-page.html
│  ├─ kpi.html
│  ├─ login.html
│  ├─ project_page.html
│  ├─ projects.html
│  ├─ register.html
│  ├─ report_page.html
│  ├─ reports.html
│  ├─ schedule.html
│  ├─ task_page.html
│  ├─ tasks.html
│  ├─ tg_user_page.html
│  ├─ tg_users.html
│  └─ todolist.html
├─ main.py..................................Функция запуска проекта
└─ views.py.................................Представления проекта
├─ routes.py................................Роутеры проекта
├─ security.py..............................Функции для работы с безопастностью
├─ utils.py.................................Вспомагательные функции
├─ models.py....................................Детальное описание базы данных с помощью trafaret
```
