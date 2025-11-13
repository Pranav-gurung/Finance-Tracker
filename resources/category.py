
from flask import request
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from models import CategoryModel
from db import db

from schemas import CategorySchema 

blp = Blueprint("Stores", __name__, description="Operations on categories")


@blp.route("/category/<string:category_id>")
class Category(MethodView):
    @blp.response(200 , CategorySchema)
    def get(self, category_id):
        category = CategoryModel.query.get_or_404(category_id)
        return category

    def delete(self, category_id):
        category= CategoryModel.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        return{"message":"Category deleted"}


@blp.route("/category")
class CategoryList(MethodView):
    @blp.response(200 , CategorySchema(many=True))
    def get(self):
        return CategoryModel.query.all() 

    @blp.arguments(CategorySchema)
    @blp.response(200,CategorySchema)
    def post(self , category_data):
        category = CategoryModel(**category_data)
        try:
            db.session.add(category)
            db.session.commit()
        except IntegrityError:
            abort(
                400,
                message="A category with that name already exists.",
            )
        except SQLAlchemyError:
            abort(500, message="An category occurred creating the store.")

        return category