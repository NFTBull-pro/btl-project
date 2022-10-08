import logging
logger = logging.getLogger('app_logger')

from telegram import (ReplyKeyboardRemove, 
            ReplyKeyboardMarkup, 
            InlineKeyboardMarkup,
            InlineKeyboardButton,
            KeyboardButton,
            ParseMode,
            Bot)

from telegram_bot.base import db
from telegram_bot.bot_utils import notify_channel, notify_manager

from time import sleep
#from tzwhere import tzwhere 
from timezonefinder import TimezoneFinder
from pytz import timezone as pytz_timezone
from datetime import datetime, timedelta, time

from threading import Thread
import asyncio



def check_schedule(schedule):
    for schedule_info in schedule:
        #Берем магазин чтобы узнать какое там сейчас время
        tg_user = db.tg_user.find_one({'_id':schedule_info['tg_user_id']})
        store = db.store.find_one({'_id':schedule_info['store_id']})
        chain_store = db.chain_store.find_one({'_id':schedule_info['chain_store_id']})
        project = db.project.find_one({'_id':chain_store['project_id']})  
        tfinder_client = TimezoneFinder()
        #tzwhere_client = tzwhere.tzwhere() 
        #timezone_title = tzwhere_client.tzNameAt(float(store['latitude']), float(store['longitude']))
        timezone_title = tfinder_client.certain_timezone_at(lat=float(store['latitude']), lng=float(store['longitude'])) 
        timezone_object = pytz_timezone(timezone_title)
        store_time = datetime.now(timezone_object)
        if 'start_time' in schedule_info:
            start_time = datetime.strptime(schedule_info['start_time'], '%H:%M').replace(year=datetime.now().year, month=datetime.now().month, day=datetime.now().day)
            end_time = datetime.strptime(schedule_info['end_time'], '%H:%M').replace(year=datetime.now().year, month=datetime.now().month, day=datetime.now().day)
            #Проверяем прошло ли уже время
            if store_time.replace(tzinfo=None) > start_time.replace(tzinfo=None) + timedelta(minutes=10):
                #Прошло больше 10 минут от начала работы
                #Проверяем отметился ли человек
                schedule_real = db.schedule_real.find_one({'schedule_id':schedule_info['_id']})
                now = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                end = datetime.combine(now, time.max)
                if schedule_real:
                    #Отметился ура
                    if 'end_time' not in schedule_real:
                        if store_time.replace(tzinfo=None) > end_time.replace(tzinfo=None) + timedelta(minutes=10):
                            notification = db.notification.find_one({
                                'project_id': chain_store['project_id'],
                                'type': 9,
                                'text': '<a href="/tg_users/'+str(tg_user['_id'])+'">'+tg_user['FIO']+'</a> не ушел с <a href="chain_store/'+str(chain_store['_id'])+'">'+store['name']+'</a>',
                                'datetime':{
                                    '$gte':now,
                                    '$lte':end
                                }
                            })
                            if not notification:
                                db.notification.insert_one({
                                    'project_id': chain_store['project_id'],
                                    'type': 9,
                                    'text': '<a href="/tg_users/'+str(tg_user['_id'])+'">'+tg_user['FIO']+'</a> не ушел с <a href="chain_store/'+str(chain_store['_id'])+'">'+store['name']+'</a>',
                                    'datetime': datetime.now(),
                                    'status': True,
                                    'href': '/schedule'
                                })
                                if 'channel' in project:
                                    notify_channel(project['channel'], tg_user['FIO']+' не отметился о уходе с '+store['name'])
                                
                                asyncio.run(notify_manager(project['_id'], tg_user['FIO']+' не отметился о уходе с '+store['name']))


                        
                else:
                    notification = db.notification.find_one({
                                'project_id': chain_store['project_id'],
                                'type': 4,
                                'text': '<a href="/tg_users/'+str(tg_user['_id'])+'">'+tg_user['FIO']+'</a> не вышел на <a href="chain_store/'+str(chain_store['_id'])+'">'+store['name']+'</a>',
                                'datetime':{
                                    '$gte':now,
                                    '$lte':end
                                }
                            })
                    if not notification:
                        db.notification.insert_one({
                            'project_id': chain_store['project_id'],
                            'type': 4,
                            'text': '<a href="/tg_users/'+str(tg_user['_id'])+'">'+tg_user['FIO']+'</a> не вышел на <a href="chain_store/'+str(chain_store['_id'])+'">'+store['name']+'</a>',
                            'datetime': datetime.now(),
                            'status': True,
                            'href': '/schedule'
                        })
                        if 'channel' in project:
                            notify_channel(project['channel'], tg_user['FIO']+' не отметился о выходе на '+store['name'])
                       
                        asyncio.run(notify_manager(project['_id'], tg_user['FIO']+' не отметился о выходе на '+store['name']))

def check_task(tasks):
    for task in tasks:
        if task['timing'] < datetime.now():
            object_ = None
            performers = []
            project_id = task['project_id']
            href = ''
            if task['object_type'] == 1:
                object_ = db.project.find_one({'_id':task['object_id']})
                href = '/projects/'+str(object_['_id'])
                project_tg_user_list = db.project_tg_user.find({'project_id':object_['_id']})
                project_tg_user_list = [project_tg_user['tg_user_id'] for project_tg_user in project_tg_user_list]

                performers = list(db.tg_user.find({'_id':{'$in':project_tg_user_list}, 'status':True, 'chat_id':{'$exists':True}}))
            elif task['object_type'] == 2:
                object_ = db.chain_store.find_one({'_id':task['object_id']})
                href = '/chain_store/'+str(object_['_id'])
                schedule = db.schedule.find({'chain_store_id':object_['_id']})

                tg_user_ids = [schedule_info['tg_user_id'] for schedule_info in schedule]
                tg_user_ids = list(set(tg_user_ids))

                performers = list(db.tg_user.find({'_id':{'$in':tg_user_ids}}))
            elif task['object_type'] == 3:
                object_ = db.store.find_one({'_id':task['object_id']})
                chain_store = db.chain_store.find_one({'_id':object_['chain_store_id']})
                href = '/chain_store/'+str(chain_store['_id'])
                schedule = db.schedule.find({'store_id':object_['_id']})

                
                tg_user_ids = [schedule_info['tg_user_id'] for schedule_info in schedule]
                tg_user_ids = list(set(tg_user_ids))

                performers = list(db.tg_user.find({'_id':{'$in':tg_user_ids}}))
            elif task['object_type'] == 4:
                object_ = {'name':task['object_id']}
                href = '/projects/'+str(task['project_id'])
                temp = db.project_tg_user.find({"project_id":task["project_id"]})


                temp = [temp_data['tg_user_id'] for temp_data in temp]

                performers = list(db.tg_user.find({'_id':{'$in':temp}, 'status':True, 'city':object_['name']}))
            elif task['object_type'] == 5:
                object_ = db.tg_user.find_one({'_id':task['object_id']})
                href = '/tg_users/'+str(object_['_id'])
                performers = [object_]
            
            counter = 0

            for performer in performers:
                task_status = db.task_status.find_one({'tg_user_id':performer['chat_id'], 'task_id':task['_id']})
                if task_status:
                    if 'done' in task_status:
                        if task_status['done']:
                            counter+=1

            if performers != 0 and counter != len(performers):
                now = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                end = datetime.combine(now, time.max)

                notification = db.notification.find_one({
                            'project_id': project_id,
                            'type': 1,
                            'text': '<a href="'+href+'">'+object_['name']+'</a> - '+task['description'],
                            'datetime':{
                                '$gte':now,
                                '$lte':end
                            }
                        })

                if not notification:
                    db.notification.insert_one({
                        'project_id': project_id,
                        'type': 1,
                        'text': '<a href="'+href+'">'+object_['name']+'</a> - '+task['description'],
                        'datetime': datetime.now(),
                        'status': True,
                        'href': '/tasks'
                    })
                    


def main():
    #Вечная проверка информации по задачам и график работ
    #График работ берем текущий день и идем по списку шедуле, берем сторе берем тайм и берем время если позже или раньше то хуячим
    
    while True:
        try:
            schedule = list(db.schedule.find({'date': datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)}))

            if schedule:
                Thread(target=check_schedule, args=(schedule,), daemon=True).start()
            
            end_date = datetime.now()
            start_date = datetime(year=end_date.year, month=end_date.month, day=end_date.day)
 
            tasks = list(db.task.find({'is_note':False, 'timing': {'$gte':start_date, '$lte':end_date}}))

            if tasks:
                Thread(target=check_task, args=(tasks,), daemon=True).start()

        except Exception as e:
            logger.error(f'content_alarm.main: {e} [{e.__traceback__.tb_lineno}]')
        
        sleep(600)
        