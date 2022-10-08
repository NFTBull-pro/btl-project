

def setup_routes(app, handler, project_root, static_root):
	router = app.router
	h = handler

	#GET запросы
	router.add_get('/', h.dashboard, name='dashboard')
	router.add_get('/connection_handler', h.connection_handler, name='connection_handler')
	router.add_get('/internal_connection_handler', h.internal_connection_handler, name='internal_connection_handler')

	router.add_get('/tasks', h.tasks, name='tasks')

	router.add_get('/admin_users', h.admin_users, name='admin_users')
	router.add_get('/admin_users/{username}', h.admin_users_page, name='admin_users_page')
	router.add_get('/admin_profile_page', h.admin_profile_page, name='admin_profile_page')

	router.add_get('/projects', h.projects, name='projects')
	router.add_get('/projects/{project_id}', h.project_page, name='project_page')

	router.add_get('/chain_store', h.chain_store, name='chain_store')
	router.add_get('/chain_store/{chain_store_id}', h.chain_store_page, name='chain_store_page')

	router.add_get('/tg_users', h.tg_users, name='tg_users')
	router.add_get('/tg_users/{tg_user_id}', h.tg_user_page, name='tg_user_page')

	router.add_get('/todolist', h.todolist, name='todolist')

	router.add_get('/task_page/{task_id}', h.task_page, name='task_page')

	router.add_get('/schedule', h.schedule, name='schedule')

	router.add_get('/reports', h.reports, name='reports')
	router.add_get('/reports/{tg_user_id}', h.report_page, name='report_page')

	router.add_get('/kpi', h.kpi, name='kpi')

	router.add_get('/bot_text', h.bot_text, name='bot_text')

	router.add_get('/chat', h.chat, name='chat')

	router.add_get('/download_schedule', h.download_schedule, name='download_schedule')

	router.add_get('/login', h.login_page, name='login')
	router.add_get('/logout', h.logout, name='logout')
	router.add_get('/register', h.register_page, name='register')
	
	#POST запросы
	router.add_post('/login', h.login)
	router.add_post('/register', h.register)

	router.add_post('/admin_users/{username}', h.update_admin_user)
	router.add_post('/admin_profile_page', h.update_admin_profile)
	
	router.add_post('/projects', h.project_add)
	router.add_post('/projects/{project_id}', h.update_project)
	router.add_post('/project_delete', h.project_delete)

	router.add_post('/get_message_from_user_by_id', h.get_message_from_user_by_id, name='get_message_from_user_by_id')

	router.add_post('/chain_store', h.chain_store_add)
	router.add_post('/chain_store/{chain_store_id}', h.update_chain_store)
	router.add_post('/chain_store_delete', h.chain_store_delete)

	router.add_post('/tg_users', h.tg_user_add)
	router.add_post('/tg_users/{tg_user_id}', h.update_tg_user)

	router.add_post('/tasks', h.task_add)
	router.add_post('/task_delete', h.task_delete) 
	router.add_post('/task_update', h.task_update)

	router.add_post('/note_add', h.note_add)

	router.add_post('/schedule', h.schedule_upload)
	router.add_post('/schedule_add', h.schedule_add)
	router.add_post('/schedule_delete', h.schedule_delete)
	

	router.add_post('/kpi', h.kpi_post)

	router.add_post('/bot_text', h.bot_text_update)

	router.add_post('/get_notification_counter', h.get_notification_counter)

	router.add_static('/static/', path=str(static_root),
					  name='static')

					  
