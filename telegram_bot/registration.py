import telegram_bot.texts as texts
import telegram_bot.states as states
from telegram import (ReplyKeyboardRemove, 
            ReplyKeyboardMarkup, 
            InlineKeyboardMarkup,
            InlineKeyboardButton,
            KeyboardButton)
from telegram.ext import ConversationHandler
from telegram_bot.base import db

from timezonefinder import TimezoneFinder
from pytz import timezone
from datetime import datetime


def start(update, context):
    chat_id = update.effective_chat.id
    tg_user = db.tg_user.find_one({'chat_id':chat_id})

    if tg_user:
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_6'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
    else:
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_1'), reply_markup=ReplyKeyboardRemove())
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_2'))
        return states.REGISTRATION[0]

def registration_1(update, context):
    chat_id = update.effective_chat.id
    code = update.message.text
    tg_user = db.tg_user.find_one({'code':code.replace(' ','')})

    if tg_user:
        db.tg_user.update_one({'code':code}, {'$set':{'chat_id':chat_id}}, upsert=True)
        db.tg_user.update_one({'code':code}, {'$unset':{'code':''}}, upsert=True)
        
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_5'), reply_markup=ReplyKeyboardMarkup(texts.main_menu(), resize_keyboard=True))
    else:
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_3'))
        context.bot.send_message(chat_id=chat_id, text=texts.get_text('text_4'), reply_markup=ReplyKeyboardRemove())

    return ConversationHandler.END





