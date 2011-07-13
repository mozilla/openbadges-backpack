from flask import Flask, make_response
from threading import Thread
import json
app = Flask(__name__)

@app.route('/audio.badge')
def audio_badge_raw():
    response = make_response(json.dumps({
        'name': 'Audo Expert',
        'description': "For rockin' beats",
        'recipient': 'test@example.com',
        'evidence': '/badges/audio.html',
        'expires': '2020-1-1',
        'icons': {'128': '/images/audio_128.png',},
        'ttl': 60 * 60 * 24,
    }))
    response.mimetype = "application/x-badge-manifest"
    return response

@app.route('/invalid_type.badge')
def invalid_type():
    # defaults to text/html
    return json.dumps({
        'name': 'Audo Expert',
        'description': "For rockin' beats",
        'recipient': 'test@example.com',
        'evidence': '/badges/audio.html',
        'expires': '2020-1-1',
        'icons': {'128': '/images/audio_128.png',},
        'ttl': 60 * 60 * 24,
    })

@app.route('/malformed.badge')
def malformed_badge():
    response = make_response("{'malformed': Yep")
    response.mimetype = "application/x-badge-manifest"
    return response

class ServerThread(Thread):
    def run(self):
        print "Starting test issuer..."
        app.run(port=5000)

server = ServerThread()
server.setDaemon(True)

if __name__ == "__main__":
    app.run(port=9000, debug=True)
