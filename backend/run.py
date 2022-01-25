#!/usr/bin/env python
# -*- coding: utf-8 -*-

from app import app
#from gevent.pywsgi import WSGIServer

app.run(host='127.0.0.1', port=8888, use_reloader=False, debug=True)



