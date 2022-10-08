from trafaret.contrib.object_id import MongoId
from trafaret.contrib.rfc_3339 import DateTime
from trafaret import (Dict, Key, String, Bool, Email, Regexp, Int, Float, DataError, Or)

user = Dict({
	Key('_id'): MongoId(),
	Key('username'): String(max_length=50),
	Key('password'): String(),
	Key('FIO'): String(),
	Key('email'): Email,
	Key('phone', optional=True): Regexp(regexp=r'^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$'),
	Key('is_superuser', default=False): Bool(),
	Key('is_staff', default=False): Bool(),
	Key('data_joined'): DateTime(),
})

tg_user = Dict({
	Key('_id'): MongoId(),
	Key('chat_id', optional=True): Int(),
	Key('FIO', optional=True): String(max_length=50),
	Key('photo', optional=True): String(),
	Key('email', optional=True): Email,
	Key('phone', optional=True): Regexp(regexp=r'^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$'),
	Key('city', optional=True): String(),
	Key('status', default=True): Bool(),
	Key('code', optional=True): String(),
	Key('passport', optional=True): String(),
})

schedule = Dict({
	Key('_id'): MongoId(),
	Key('tg_user_id'): MongoId(),
	Key('chain_store_id'): MongoId(),
	Key('store_id'): MongoId(),
	Key('start_time'): String(),
	Key('end_time'): String(),
	Key('date'): DateTime(),
	Key('update_date'): DateTime(),
})

schedule_real = Dict({
	Key('_id'): MongoId(),
	Key('schedule_id'): MongoId(),
	Key('start_time'): String(),
	Key('end_time'): String(),
})

chain_store = Dict({
	Key('_id'): MongoId(),
	Key('project_id'): MongoId(),
	Key('name'): String(),
	Key('contact'): String(),
})

store = Dict({
	Key('_id'): MongoId(),
	Key('chain_store_id'): MongoId(),
	Key('city'): String(),
	Key('address'): String(),
	Key('name'): String(),
	Key('latitude'): Float(),
	Key('longitude'): Float(),
	Key('radius'): Int(),
	Key('contact'): String(),
})

project = Dict({
	Key('_id'): MongoId(),
	Key('name'): String(),
	Key('tariff'): Int(),
	Key('tariff_price'): String(),
	Key('channel', optional=True): Int(),
	Key('created_data'): DateTime(),
})

project_manager = Dict({
	Key('_id'): MongoId(),
	Key('project_id'): MongoId(),
	Key('manager_id'): MongoId(),
})

project_tg_user = Dict({
	Key('_id'): MongoId(),
	Key('project_id'): MongoId(),
	Key('tg_user_id'): Int(),
})

task = Dict({
	Key('_id'): MongoId(),
	Key('project_id', optional=True): MongoId(),
	Key('description'): String(),
	Key('timing'): DateTime(),
	Key('pub_date'): DateTime(),
	Key('object_id'): Or(String(), MongoId()),
	Key('object_type'): Int(),
	Key('is_phototask', default=False): Bool(),
	Key('is_note', default=False): Bool(),
})

task_status = Dict({
	Key('_id'): MongoId(),
	Key('task_id'): MongoId(),
	Key('done'): Bool(),
	Key('date'): DateTime(),
})

task_photo = Dict({
	Key('_id'): MongoId(),
	Key('task_id'): MongoId(),
	Key('photo'): String(),
	Key('date'): DateTime(),
})

task_comment = Dict({
	Key('_id'): MongoId(),
	Key('task_id'): MongoId(),
	Key('comment'): String(),
	Key('date'): DateTime(),
})

kpi = Dict({
	Key('_id'): MongoId(),
	Key('store_id'): MongoId(),
	Key('name'): String(),
	Key('description'): String(),
	Key('timing'): DateTime(),
	Key('pub_date'): DateTime(),
})

'''
Описание типов уведомления:
1 - Не выполнил задачу
2 - Выполнил задачу вовремя
3 - Выполнил задачу с опозданием
4 - Не отметился о выходе на работу
5 - Отметился в другом месте
6 - Пришел на работу
7 - Пришел на работу с опозданием
8 - Ушел с работы раньше
9 - Не отметился что ушел с работы
10 - Отметился о выходе в другом месте
'''
notification = Dict({
	Key('_id'): MongoId(),
	Key('project_id'): MongoId(),
	Key('type'): Int(),
	Key('text'): String(),
	Key('datetime'): DateTime(),
	Key('status'): Bool(),
	Key('href'): String(),
})

notification_status = Dict({
	Key('_id'): MongoId(),
	Key('notification_id'): MongoId(),
	Key('user_id'): MongoId(),
	Key('seen'): Bool(),
	Key('datetime'): DateTime(),
})

bot_text = Dict({
	Key('_id'): MongoId(),
	Key('title'): String(),
	Key('text'): String(),
})

message = Dict({
	Key('_id'): MongoId(),
	Key('chat_id'): Int(),
	Key('text'): String(),
	Key('type'): String(),
	Key('from_user', default=True): Bool(),
	Key('datetime'): DateTime(),
})


async def get_user_id(user_collection, username):
	rv = await (user_collection.find_one(
		{'username': username},
		{'_id': 1}))
	return rv['_id'] if rv else None

async def validate_user_model(user_data):
	try:
		return user(user_data), True
	except DataError as e:
		error  = e.as_dict()
		return 'Возникла ошибка в этих полях: '+', '.join(list(error.keys())), False
	except Exception as e:
		return 'Возникла ошибка: '+str(e), False

async def validate_tg_user_model(tg_user_data):
	try:
		return tg_user(tg_user_data), True
	except DataError as e:
		error  = e.as_dict()
		return 'Возникла ошибка в этих полях: '+', '.join(list(error.keys())), False
	except Exception as e:
		return 'Возникла ошибка: '+str(e), False

async def validate_project_model(project_data):
	try:
		return project(project_data), True
	except DataError as e:
		error  = e.as_dict()
		return 'Возникла ошибка в этих полях: '+', '.join(list(error.keys())), False
	except Exception as e:
		return 'Возникла ошибка: '+str(e), False

async def validate_chain_store_model(chain_store_data):
	try:
		return chain_store(chain_store_data), True
	except DataError as e:
		error  = e.as_dict()
		return 'Возникла ошибка в этих полях: '+', '.join(list(error.keys())), False
	except Exception as e:
		return 'Возникла ошибка: '+str(e), False

async def validate_store_model(store_data):
	try:
		return store(store_data), True
	except DataError as e:
		error  = e.as_dict()
		return 'Возникла ошибка в этих полях: '+', '.join(list(error.keys())), False
	except Exception as e:
		return 'Возникла ошибка: '+str(e), False


async def validate_task_model(task_data):
	try:
		return task(task_data), True
	except DataError as e:
		error  = e.as_dict()
		return 'Возникла ошибка в этих полях: '+', '.join(list(error.keys())), False
	except Exception as e:
		return 'Возникла ошибка: '+str(e), False