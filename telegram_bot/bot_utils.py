from telegram_bot.base import TOKEN
from telegram import Bot

from telegram_bot.base import INTERNAL_URL
import asyncio, aiohttp, json


async def send_server(chat_id, text, status='send_message_bot', message_id=None):
    session = aiohttp.ClientSession()
    async with session.ws_connect(INTERNAL_URL) as ws:
        obj = {
            'password':'53dsg2ds$#!f',
            'status': status,
            'chat_id': chat_id, 
            'text': text,
        }

        if message_id:
            obj['message_id'] = message_id
        
        await ws.send_str(json.dumps(obj))
        await ws.close()
    await session.close()

def notify_channel(channel, text):
    try:
        bot = Bot(TOKEN)
        bot.send_message(chat_id=channel, text=text)
    except:
        pass


async def notify_manager(project_id, text):
    session = aiohttp.ClientSession()
    async with session.ws_connect(INTERNAL_URL) as ws:
        await ws.send_str(json.dumps({
            'password':'53dsg2ds$#!f',
            'status': 'notification_from_bot',
            'project_id': str(project_id), 
            'text': text
        }))
        await ws.close()
    await session.close()

