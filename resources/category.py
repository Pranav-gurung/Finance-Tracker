from flask import request, jsonify
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from flask_jwt_extended import jwt_required
from models import CategoryModel, TagModel
from db import db
from schemas import CategorySchema

blp = Blueprint("Categories", __name__, description="Operations on categories")

# ----- Single Category -----
@blp.route("/category/<string:category_id>")
class Category(MethodView):
    @blp.response(200, CategorySchema)
    def get(self, category_id):
        category = CategoryModel.query.get_or_404(category_id)
        return category

    @jwt_required()
    def delete(self, category_id):
        category = CategoryModel.query.get_or_404(category_id)
        try:
            db.session.delete(category)
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            abort(500, message=f"Database error: {str(e)}")
        return {"message": "Category deleted"}

# ----- Category List -----
@blp.route("/category")
class CategoryList(MethodView):
    @blp.response(200, CategorySchema(many=True))
    def get(self):
        return CategoryModel.query.all()

    @jwt_required()
    @blp.arguments(CategorySchema)
    @blp.response(200, CategorySchema)
    def post(self, category_data):
        category = CategoryModel(**category_data)
        try:
            db.session.add(category)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(400, message="A category with that name already exists.")
        except SQLAlchemyError as e:
            db.session.rollback()
            abort(500, message=f"Database error: {str(e)}")
        return category

# ----- Tags under Category -----
@blp.route("/category/<string:category_id>/tag")
class CategoryTags(MethodView):
    @blp.response(200, TagModel.Schema(many=True))
    def get(self, category_id):
        category = CategoryModel.query.get_or_404(category_id)
        return TagModel.query.filter_by(category_id=category.id).all()

    @jwt_required()
    def post(self, category_id):
        data = request.get_json()
        if "name" not in data:
            abort(400, message="Tag name is required")
        category = CategoryModel.query.get_or_404(category_id)
        tag = TagModel(name=data["name"], category_id=category.id)
        try:
            db.session.add(tag)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(400, message="Tag with this name already exists in this category")
        except SQLAlchemyError as e:
            db.session.rollback()
            abort(500, message=f"Database error: {str(e)}")
        return tag
