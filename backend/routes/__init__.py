from flask import Flask
from .get_chatgpt_response import fetch_gpt_response_bp

def register_routes(app):
    app.register_blueprint(fetch_gpt_response_bp)

