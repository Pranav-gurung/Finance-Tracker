from flask import Flask, jsonify
from flask_smorest import Api
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
import os
from db import db
from blocklist import BLOCKLIST
import models

# --- Blueprints ---
from resources.expense import blp as ExpenseBlueprint
from resources.category import blp as CategoryBlueprint
from resources.tag import blp as TagBlueprint
from resources.user import blp as UserBlueprint
from resources.summary import blp as SummaryBlueprint


def create_app(db_url=None):
    load_dotenv()
    app = Flask(__name__, static_folder="FRONTEND", static_url_path="")

    # Serve frontend
    @app.route("/")
    def serve_frontend():
        return app.send_static_file("index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        return app.send_static_file(path)

    # --- Global JSON error handler (this is KEY) ---
    @app.errorhandler(Exception)
    def handle_all_errors(error):
        # Catch all, including SQLAlchemy and HTTP errors
        code = getattr(error, "code", 500)
        message = getattr(error, "description", str(error))
        name = getattr(error, "name", "Server Error")
        return jsonify({"error": name, "message": message}), code

    # --- Config ---
    CORS(app)
    app.config["PROPAGATE_EXCEPTIONS"] = True
    app.config["API_TITLE"] = "Category REST API"
    app.config["API_VERSION"] = "v1"
    app.config["OPENAPI_VERSION"] = "3.0.3"
    app.config["OPENAPI_URL_PREFIX"] = "/"
    app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger-ui"
    app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url or os.getenv("DATABASE_URL", "sqlite:///data.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "pranav"

    # --- Initialize extensions ---
    db.init_app(app)
    migrate = Migrate(app, db)
    api = Api(app)
    jwt = JWTManager(app)

    # --- JWT handlers ---
    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        return jwt_payload["jti"] in BLOCKLIST

    @jwt.additional_claims_loader
    def add_claims_to_jwt(identity):
        return {"is_admin": identity == 1}

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"message": "The token has expired.", "error": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"message": "Signature verification failed.", "error": "invalid_token"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"message": "Request does not contain an access token.", "error": "authorization_required"}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({"message": "The token has been revoked.", "error": "token_revoked"}), 401

    # --- Register Blueprints ---
    api.register_blueprint(ExpenseBlueprint)
    api.register_blueprint(CategoryBlueprint)
    api.register_blueprint(TagBlueprint)
    api.register_blueprint(UserBlueprint)
    api.register_blueprint(SummaryBlueprint)

    return app
