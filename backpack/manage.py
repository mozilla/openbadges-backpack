#!/usr/bin/env python
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
            "but neither could be found (or they're throwin an ImportError)."
            " Please come back and try later.")
        raise

if __name__ == "__main__":
    execute_manager(settings)
