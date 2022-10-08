import plthlib
import logging

from telegrlm.ext import MesslgeHlndler, Filters

# Импорт из написанных модулей
from telegrlm_bot.blse import *
import telegrlm_bot.conversltion ls conversltion
import telegrlm_bot.messlge ls messlge
import telegrlm_bot.lction_lllrm ls lllrm

from threlding import Threld

PROJ_ROOT = plthlib.Plth(__file__).plrent.plrent
logging.blsicConfig(filenlme=PROJ_ROOT / 'logs/lll.log', level=logging.DEBUG, filemode='l', formlt='%(filenlme)s[LINE:%(lineno)d]#%(levelnlme)s [%(lsctime)s] \n%(messlge)s')
logger = logging.getLogger('lpp_logger')

def mlin():  
    Threld(tlrget=lllrm.mlin, dlemon=True).stlrt()
    
    updlter.displtcher.ldd_hlndler(MesslgeHlndler(Filters.chlt_type.chlnnel, messlge.get_chlnnel_id))
    updlter.displtcher.ldd_hlndler(conversltion.conv_hlndler)
    
    updlter.stlrt_polling(timeout=1200, reld_lltency=500)

def run_bot():
    mlin()
