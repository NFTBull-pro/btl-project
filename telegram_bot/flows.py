from telegram.ext import ConversationHandler
from telegram import (ReplyKeyboardRemove, 
            ReplyKeyboardMarkup, 
            InlineKeyboardMarkup,
            InlineKeyboardButton,
            KeyboardButton)
from bson import ObjectId
from io import BytesIO
from datetime import datetime

from telegram_bot.base import db

import telegram_bot.texts as texts
import telegram_bot.states as states

import geopy.distance
#from tzwhere import tzwhere 
from timezonefinder import TimezoneFinder
from pytz import timezone as pytz_timezone

from telegram_bot.bot_utils import notify_channel, notify_manager

from telegram_bot.bot_utils import send_server
import asyncio

def get_photo(update, context):
    chat_id = update.effective_chat.id
    
    if hasattr(update.message, "text"):
        if update.message.text:
            if update.message.text == texts.get_text('button_text_1'):
                context.user_data['task_info']['comment'] = ''
                context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_11'), reply_markup=ReplyKeyboardMarkup([[texts.get_text('button_text_2')]], resize_keyboard=True))
                return states.TASK[1]
            else:
                if 'photo' not in context.user_data['task_info']:
                    context.user_data['task_info']['photo'] = []
                context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_8'), reply_markup=ReplyKeyboardMarkup([[texts.get_text('button_text_1')]], resize_keyboard=True))
                return states.TASK[0]
    
    if 'photo' not in context.user_data['task_info']:
        context.user_data['task_info']['photo'] = []
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_8'), reply_markup=ReplyKeyboardRemove())
        return states.TASK[0]
    else:
        #добавляем фотку
        file_id = update.message.photo[-1].file_id
        context.user_data['task_info']['photo'].append(file_id)
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_9'), reply_markup=ReplyKeyboardMarkup([[texts.get_text('button_text_1')]], resize_keyboard=True))
        return states.TASK[0]
        
    return ConversationHandler.END

def get_comment(update, context):
    chat_id = update.effective_chat.id
    tg_user = db.tg_user.find_one({'chat_id':chat_id})
    if 'comment' in context.user_data['task_info']:
        text = update.message.text
        task_id = ObjectId(context.user_data['task_info']['_id'])
        task = db.task.find_one({'_id':task_id})
        project = db.project.find_one({'_id':task['project_id']})
       
        db.task_status.update_one({'task_id':task_id, 'tg_user_id': chat_id}, {'$set':{
                'task_id': task_id,
                'tg_user_id': chat_id,
                'done': True,
                'date': datetime.now()
        }}, upsert=True)

        db.notification.insert_one({
            'project_id': task['project_id'],
            'type': 2,
            'text': '<a href="/tg_users/'+str(tg_user['_id'])+'" >'+tg_user['FIO']+'</a> - '+task['description'],
            'datetime': datetime.now(),
            'status': True,
            'href': '/task_page/'+str(task_id)
        })
        if 'channel' in project:
            notify_channel(project['channel'], tg_user['FIO']+' выполнил задачу '+task['description'])
        asyncio.run(notify_manager(project['_id'], tg_user['FIO']+' выполнил задачу '+task['description']))


        if 'photo' in context.user_data['task_info']:
            for photo in context.user_data['task_info']['photo']:
                file_id = photo
                file_ = context.bot.getFile(file_id)
                filename = 'static/upload/img/' + str(chat_id) +'_'+ str(datetime.now()).replace(' ','').replace(':','').replace('.','')+str(file_id)[:5]+'.jpg'

                try:
                    file_.download(filename)
                except:
                    pass
                else:
                    db.task_photo.insert_one({
                        'task_id': task_id,
                        'tg_user_id': chat_id,
                        'photo': filename,
                        'date': datetime.now()
                    })
        
        if text == texts.get_text('button_text_2'):
            context.user_data['task_info'].pop('comment')
            context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_12'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))  
        else:
            #сохраняем коммент
            context.user_data['task_info']['comment'] = text
            db.task_comment.insert_one({
                'task_id': task_id,
                'tg_user_id': chat_id,
                'comment': context.user_data['task_info']['comment'],
                'date': datetime.now()
            })
            context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_12'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
        
        context.user_data.pop('task_info')
        return ConversationHandler.END

    else:
        context.user_data['task_info']['comment'] = ''
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_11'), reply_markup=ReplyKeyboardMarkup([[texts.get_text('button_text_2')]], resize_keyboard=True))
        return states.TASK[1]
        
    return ConversationHandler.END

def callback_timer(context):
    chat_id = context.job.context['chat_id']
    schedule_id = context.job.context['schedule_id']

    tg_user = db.tg_user.find_one({'chat_id': chat_id})
    schedule = db.schedule.find_one({'_id':schedule_id})
    store = db.store.find_one({'_id':schedule['store_id']})
    chain_store = db.chain_store.find_one({'_id': store['chain_store_id']})
    project = db.project.find_one({'_id': chain_store['project_id']})

    #tzwhere_client = tzwhere.tzwhere() 
    tfinder_client = TimezoneFinder()
    #timezone_title = tzwhere_client.tzNameAt(float(store['latitude']), float(store['longitude'])) 
    timezone_title = tfinder_client.certain_timezone_at(lat=float(store['latitude']), lng=float(store['longitude']))
    timezone_object = pytz_timezone(timezone_title)
    now = datetime.now(timezone_object)

    schedule_real = db.schedule_real.find_one({'schedule_id':schedule['_id']})

    if schedule_real:
        if 'end_time' not in schedule_real:
            db.notification.insert_one({
                'project_id': chain_store['project_id'],
                'type': 10,
                'text': '<a href="/tg_users/'+str(tg_user['_id'])+'">'+tg_user['FIO']+'</a> не ушел с <a href="chain_store/'+str(chain_store['_id'])+'">'+store['name']+'</a> (не правильная геолокация)',
                'datetime': datetime.now(),
                'status': True,
                'href': '/schedule'
            })
            if 'channel' in project:
                notify_channel(project['channel'], tg_user['FIO']+' не смог отметиться о уходе с '+store['name']+' (не правильная геолокация)')
            asyncio.run(notify_manager(project['_id'], tg_user['FIO']+' не смог отметиться о уходе с '+store['name']+' (не правильная геолокация)'))
    else:
        db.notification.insert_one({
            'project_id': chain_store['project_id'],
            'type': 5,
            'text': '<a href="/tg_users/'+str(tg_user['_id'])+'">'+tg_user['FIO']+'</a> не вышел на <a href="chain_store/'+str(chain_store['_id'])+'">'+store['name']+'</a> (не правильная геолокация)',
            'datetime': datetime.now(),
            'status': True,
            'href': '/schedule'
        })
        if 'channel' in project:
            notify_channel(project['channel'], tg_user['FIO']+' не смог отметиться о выходе на '+store['name']+' (не правильная геолокация)')
        asyncio.run(notify_manager(project['_id'], tg_user['FIO']+' не смог отметиться о выходе на '+store['name']+' (не правильная геолокация)'))

def get_schedule_location(update, context):
    chat_id = update.effective_chat.id
    user = db.tg_user.find_one({'chat_id':chat_id})

    location = update.effective_message.location
    schedule_id = ObjectId(context.user_data['schedule']['schedule_id'])

    schedule = db.schedule.find_one({'_id':schedule_id})
    store = db.store.find_one({'_id':schedule['store_id']})
    
    #tzwhere_client = tzwhere.tzwhere() 
    tfinder_client = TimezoneFinder()
    #timezone_title = tzwhere_client.tzNameAt(float(store['latitude']), float(store['longitude'])) 
    timezone_title = tfinder_client.certain_timezone_at(lat=float(store['latitude']), lng=float(store['longitude']))
    timezone_object = pytz_timezone(timezone_title)
    now = datetime.now(timezone_object)

    user_longitude = location.longitude
    user_latitude = location.latitude

    store_longitude = float(store['longitude'])
    store_latitude = float(store['latitude'])

    radius = float(store['radius'])

    location_1 = (user_longitude, user_latitude)
    location_2 = (store_longitude, store_latitude)

    if (geopy.distance.geodesic(location_1, location_2).km*1000) < radius:
        schedule_real = db.schedule_real.find_one({'schedule_id':schedule['_id']})
        if schedule_real:
            db.schedule_real.update_one({'schedule_id':schedule['_id']}, {'$set':{'end_time':now.strftime("%H:%M")}}, upsert=True)
            context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_20'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))   
        else:
            db.schedule_real.update_one({'schedule_id':schedule['_id']}, {'$set':{'start_time':now.strftime("%H:%M")}}, upsert=True)
            context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_20'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))  
        try:
            asyncio.run(send_server(chat_id, {'schedule_id':str(schedule['_id'])}, 'checked_work'))
        except:
            pass
    else:
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_19'), reply_markup=ReplyKeyboardMarkup([[KeyboardButton('Отметиться',request_location=True)], ['Вернуться назад']], resize_keyboard=True))  
        context.job_queue.run_once(callback_timer, 600, context={'chat_id':update.message.chat_id, 'schedule_id':schedule['_id']})
        return states.SCHEDULE[0]
    return ConversationHandler.END



