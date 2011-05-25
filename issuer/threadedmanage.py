#!/usr/bin/env python
#
# Mostly taken from: 
# http://nedbatchelder.com/blog/201103/quick_and_dirty_multithreaded_django_dev_server.html

import os
import site

from django.core.management import execute_manager

ROOT = os.path.dirname(os.path.abspath(__file__))
path = lambda *a: os.path.join(ROOT, *a)

site.addsitedir(path('apps'))

try:
    import settings_local as settings
except ImportError:
    try:
        import settings
    except ImportError:
        import sys
        sys.stderr.write(
            "Error: Tried importing 'settings_local.py' and 'settings.py' "
            "but neither could be found (or they're throwing an ImportError)."
            " Please come back and try later.")
        raise


def monkey_patch_for_multi_threaded():
    import BaseHTTPServer
    import SocketServer
    OriginalHTTPServer = BaseHTTPServer.HTTPServer

    class ThreadedHTTPServer(SocketServer.ThreadingMixIn, OriginalHTTPServer):

        def __init__(self, server_address, RequestHandlerClass=None):
            OriginalHTTPServer.__init__(self, server_address,
                                        RequestHandlerClass)

    BaseHTTPServer.HTTPServer = ThreadedHTTPServer

if __name__ == '__main__':
    monkey_patch_for_multi_threaded()
    execute_manager(settings)
