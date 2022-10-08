from telegram.ext import ConversationHandler
from telegram import (ReplyKeyboardRemove, 
            ReplyKeyboardMarkup, 
            InlineKeyboardMarkup,
            InlineKeyboardButton,
            KeyboardButton,
            ParseMode)
from bson import ObjectId

from datetime import datetime,date, timedelta, time as datetime_time
from calendar import monthrange

from telegram_bot.base import db
from telegram_bot.flows import get_photo, get_comment

import telegram_bot.texts as texts
import telegram_bot.states as states

from telegram_bot.bot_utils import send_server
import asyncio

#from tzwhere import tzwhere 
from timezonefinder import TimezoneFinder
from pytz import timezone as pytz_timezone



def get_channel_id(update, context):
    text = update.channel_post.text
    if text in ['/get_channel_id', '/gid']:
        chat_id = update.effective_chat.id
        context.bot.send_message(chat_id=chat_id, text=str(chat_id))

def handle(update, context):
    chat_id = update.effective_chat.id
    text = update.message.text
    message_id = update.message.message_id

    tg_user = db.tg_user.find_one({'chat_id':chat_id})
    if tg_user:
        asyncio.run(send_server(chat_id, text, message_id=message_id ))

        main_menu = texts.main_menu()
        if text == main_menu[0][0]:
            #Задачи
            return tasks(context.bot, chat_id)
        elif text == main_menu[1][0]:
            #KPI
            return kpi(context.bot, chat_id)
        elif text == main_menu[2][0]:
            #Нахождение
            return schedule(context, chat_id)
        else:
            context.bot.send_message(chat_id=chat_id, text=texts.get_text('main_menu_text'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
        
        return ConversationHandler.END

def callback_handle(update, context):
    chat_id = update.effective_chat.id
    query = update.callback_query
    query.answer()

    wm_command = query.data.split('$')

    if wm_command[0] == 'task':
        task_id = ObjectId(wm_command[2])
        task = db.task.find_one({'_id':task_id})

        if wm_command[1] == 'done':
            context.user_data['task_info'] = {}
            context.user_data['task_info']['_id'] = wm_command[2]
            if task['is_phototask']:
                #Нужно забрать фотку
                return get_photo(update, context)
            else:
                #Нужно забрать комментарии
                return get_comment(update, context)
    
    return ConversationHandler.END


def tasks(bot, chat_id):
    tg_user = db.tg_user.find_one({'chat_id':chat_id})
    #Берем проект сотрудника, сеть, магазин и город, собираем это в один массив
    query_array = []

    query_array += [tg_user['_id']]
    project_tg_user_list = list(db.project_tg_user.find({'tg_user_id':tg_user['_id']}))

    query_array += [project['project_id'] for project in project_tg_user_list]

    #Берем все магазины и сети с которыми связан сотрудник
    schedule = db.schedule.find({'tg_user_id':tg_user['_id']})
    store_id =  [schedule_info['store_id'] for schedule_info in schedule]
    chain_store_id =  [schedule_info['chain_store_id'] for schedule_info in schedule]
    store_id = list(set(store_id))
    chain_store_id = list(set(chain_store_id))

    query_array += store_id
    query_array += chain_store_id

    tasks = list(db.task.find({'object_id':{'$in':query_array}, 'timing': {'$gte': datetime.now()}}))

    if 'city' in tg_user:
        project_tg_user = list(db.project_tg_user.find({'tg_user_id':tg_user['_id']}))
        project_tg_user = [project_tg_user_info['project_id'] for project_tg_user_info in project_tg_user]

        tasks += list(db.task.find({'object_id':tg_user['city'], 'project_id':{'$in':project_tg_user}, 'timing': {'$gte': datetime.now()}}))
        

    temp = []
    for task in tasks:
        add = True
        task_status = db.task_status.find_one({'task_id':task['_id'], 'tg_user_id':chat_id})
        if task_status:
            if 'done' in task_status:
                if task_status['done']:
                    add = False
        
        if add:
            temp.append(task)
    
    tasks = temp
    if tasks:
        for task in tasks:
            try:
                task['timing'] = task['timing'].strftime("\nСроки: %H:%M %d.%m.%Y")
                bot.send_message(
                    chat_id=chat_id, 
                    text=task['description']+task['timing'], 
                    reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton(text='Выполнил', callback_data='task$done$%s'%str(task['_id']))]]))
            except:
                pass
    else:
        bot.send_message(chat_id=chat_id, text=texts.get_text('text_13'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))



def schedule(context, chat_id):
    #loading = context.bot.send_message(chat_id=chat_id, text='Загрузка...', reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
   
    loading = context.bot.send_sticker(chat_id=chat_id, sticker='CAACAgEAAxkBAAKnTWA2ZqROQ63Jjmk6QWXOUwt2phHYAAL6CAAC43gEAAGV1HMXl9XkiR4E', reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
    
    user = db.tg_user.find_one({'chat_id':chat_id})
    now = datetime.now()
    month_counter = monthrange(now.year, now.month)[1]
    
    schedule = db.schedule.find({
        'tg_user_id': user['_id'],
        'date':{'$gte':datetime(year=now.year, month=now.month, day=1), '$lte':datetime.combine(datetime(year=now.year, month=now.month, day=month_counter),datetime_time.max)}
    })

    if schedule:
        
        #Может верну, статистика по работе
        # time_counter = 0
        # real_time_counter = 0
        # for schedule_info in schedule:
        #     start_time = datetime.strptime(schedule_info['start_time'], '%H:%M')
        #     end_time = datetime.strptime(schedule_info['end_time'], '%H:%M')
        #     time_counter += int((end_time-start_time).total_seconds()/3600)
        #     schedule_real = db.schedule_real.find_one({'schedule_id':schedule_info['_id'], 'end_time':{'$exists':True}})
        #     if schedule_real:
        #         start_time = datetime.strptime(schedule_real['start_time'], '%H:%M')
        #         end_time = datetime.strptime(schedule_real['end_time'], '%H:%M')
        #         real_time_counter += int((end_time-start_time).total_seconds()/3600)
        
        #Берем все графики работ на текущий день по сотруднику
        schedule_now_list = list(db.schedule.find({
            'tg_user_id': user['_id'],
            'start_time': {'$exists':True},
            'date':datetime.now().replace(minute=0, hour=0, second=0, microsecond=0)
        }))

        #Может верну
        #context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_15')%(real_time_counter, time_counter), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
        
        #Если графики работы существуют
        if schedule_now_list:
            #Перебираем графики работы
            #tzwhere_client = tzwhere.tzwhere() 
            tfinder_client = TimezoneFinder()
            for idx, schedule_now in enumerate(schedule_now_list):

                #Берем время работы
                start_time = datetime.strptime(schedule_now['start_time'], '%H:%M').replace(year=datetime.now().year, month=datetime.now().month, day=datetime.now().day)
                end_time = datetime.strptime(schedule_now['end_time'], '%H:%M').replace(year=datetime.now().year, month=datetime.now().month, day=datetime.now().day)
                
                #Берем магазины
                store = db.store.find_one({'_id':schedule_now['store_id']})

                #Узнаем текущее время в магазине
                #timezone_title = tzwhere_client.tzNameAt(float(store['latitude']), float(store['longitude'])) 
                timezone_title = tfinder_client.certain_timezone_at(lat=float(store['latitude']), lng=float(store['longitude']))
                timezone_object = pytz_timezone(timezone_title)
                now = datetime.now(timezone_object)

                #Если рабочий день по первому графику начался
                if now.replace(tzinfo=None) >= start_time.replace(tzinfo=None) - timedelta(minutes=5):
                    
                    #Берем информацию по отметкам
                    schedule_real_now = db.schedule_real.find_one({
                        'schedule_id':schedule_now['_id'], 
                        'start_time':{'$exists':True},
                        'end_time':{'$exists':True}
                    })

                    #Если человек отметился сегодня
                    if schedule_real_now:
                        if idx < len(schedule_now_list)-1:
                            #Если еще есть точки работы то идем дальше
                            continue
                        else:
                            #Если точек работы больше нет то пишем что человек уже отметился
                            try:
                                context.bot.deleteMessage(chat_id, loading.message_id)
                            except:
                                pass
                        
                            context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_18'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
                            return ConversationHandler.END
                    else:
                        #Если человек не отмечался сегодня

                        #Берем отметки по первому времени
                        schedule_real_now = db.schedule_real.find_one({
                            'schedule_id':schedule_now['_id'], 
                            'start_time':{'$exists':True}
                        })

                        #Если человек отметился, что пришел на работу
                        if schedule_real_now:
                            #Просим человека отметиться о уходе
                            #Но перед этим проверяем не сильно ли он опоздал для отметки

                            if now.replace(tzinfo=None) <= end_time.replace(tzinfo=None) + timedelta(minutes=10):
                                context.bot.deleteMessage(chat_id, loading.message_id)
                                context.bot.send_message(chat_id=chat_id,
                                    text=texts.get_text('text_17')%(store['name']), 
                                    reply_markup=ReplyKeyboardMarkup([[KeyboardButton('Отметиться',request_location=True)], ['Вернуться назад']], resize_keyboard=True))   
                            else:
                                #Человек сильно опоздал
                                if idx < len(schedule_now_list)-1:
                                    #Если еще есть точки работы то идем дальше
                                    continue
                                else:
                                    context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_21'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
                                    return ConversationHandler.END
                        else:
                            #Просим человека отметиться о приходе
                            #Но перед этим проверяем не сильно ли он опоздал для отметки
                            if now.replace(tzinfo=None) <= end_time.replace(tzinfo=None) + timedelta(minutes=10):
                                context.bot.deleteMessage(chat_id, loading.message_id)
                                context.bot.send_message(chat_id=chat_id,
                                    text=texts.get_text('text_16')%(store['name']), 
                                    reply_markup=ReplyKeyboardMarkup([[KeyboardButton('Отметиться',request_location=True)], ['Вернуться назад']], resize_keyboard=True))   
                            else:
                                if idx < len(schedule_now_list)-1:
                                    #Если еще есть точки работы то идем дальше
                                    continue
                                else:
                                    context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_21'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
                                    return ConversationHandler.END

                        context.user_data['schedule'] = {}
                        context.user_data['schedule']['schedule_id'] = str(schedule_now['_id'])
                        return states.SCHEDULE[0]
                else:
                    #Если по этой точке время работы еще не началось 
                    try:
                        context.bot.deleteMessage(chat_id, loading.message_id)
                    except:
                        pass

                    if idx < len(schedule_now_list)-1:
                        #Если еще есть точки работы то идем дальше
                        continue
                    else:
                        #Если точек работы больше нет то пишем что человек уже отметился
                        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_21'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
                        return ConversationHandler.END
        #Если графиков работы на сегодня нет          
        else:
            context.bot.deleteMessage(chat_id, loading.message_id)
            context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_23'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
            return ConversationHandler.END               
    #Если графика работы вообще нет    
    else:
        context.bot.deleteMessage(chat_id, loading.message_id)
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_14'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
        return ConversationHandler.END


def kpi(bot, chat_id):
    tg_user = db.tg_user.find_one({'chat_id':chat_id})

    schedule = db.schedule.find({'tg_user_id':tg_user['_id']})
    store_ids =  [schedule_info['store_id'] for schedule_info in schedule]
    store_ids = list(set(store_ids))
    kpi_not_send = True

    for store_id in store_ids:
        kpi_list = list(db.kpi.find({'store_id':store_id, 'timing':{'$gte':datetime.now()}}))
        store = db.store.find_one({'_id':store_id})
        if kpi_list:
            bot.send_message(chat_id=chat_id, text="KPI для магазина <b>%s</b>"%store['name'], reply_markup=ReplyKeyboardMarkup(texts.main_menu(),resize_keyboard=True),  parse_mode=ParseMode.HTML)
            for kpi in kpi_list:
                try:
                    bot.send_message(chat_id=chat_id, text="<b>%s</b>\n%s\nСроки: %s"%(kpi['name'],kpi['description'], kpi['timing'].strftime('%d.%m.%Y')), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True), parse_mode=ParseMode.HTML)
                except:
                    pass
                else:
                    if kpi_not_send == True:
                        kpi_not_send = False
    
    if kpi_not_send:
        bot.send_message(chat_id=chat_id, text=texts.get_text('text_24'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(),resize_keyboard=True),  parse_mode=ParseMode.HTML)
            
    return ConversationHandler.END
        
