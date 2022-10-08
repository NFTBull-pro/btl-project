from telegram.ext import (
	CommandHandler,
	MessageHandler,
	Filters,
	ConversationHandler,
	CallbackQueryHandler
)

import telegram_bot.registration as registration
import telegram_bot.states as states
import telegram_bot.message as message
import telegram_bot.flows as flows

def cancel(update, context):
	return ConversationHandler.END

conv_handler = ConversationHandler(
		entry_points=[
			CommandHandler('start', registration.start),
			MessageHandler(Filters.text, message.handle),
			CallbackQueryHandler(message.callback_handle),
			
			],
		states={
            states.REGISTRATION[0]: [
				MessageHandler(Filters.text, registration.registration_1),
			],
			states.TASK[0]: [
				MessageHandler(Filters.all, flows.get_photo),
			],
			states.TASK[1]: [
				MessageHandler(Filters.text, flows.get_comment),
			],
			states.SCHEDULE[0]: [
				MessageHandler(Filters.location, flows.get_schedule_location),
				MessageHandler(Filters.text, message.handle),
			]
		},
		fallbacks=[CommandHandler('cancel', cancel)],
		name="main_conversation",
		#persistent=True,
		# allow_reentry = True,
)
