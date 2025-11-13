from flask import request, jsonify
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from models import CategoryModel
from db import db
from schemas import CategorySchema

# ✅ Changed blueprint name for clarity
blp = Blueprint("Categories", __name__, description="Operations on categories")


@blp.route("/category/<string:category_id>")
class Category(MethodView):
    @blp.response(200, CategorySchema)
    def get(self, category_id):
        category = CategoryModel.query.get_or_404(category_id)
        return category

    def delete(self, category_id):
        category = CategoryModel.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        return {"message": "Category deleted"}


@blp.route("/category")
class CategoryList(MethodView):
    @blp.response(200, CategorySchema(many=True))
    def get(self):
        return CategoryModel.query.all()

    @blp.arguments(CategorySchema)
    @blp.response(200, CategorySchema)
    def post(self, category_data):
        category = CategoryModel(**category_data)
        try:
            db.session.add(category)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            # ✅ Always rollback before aborting on DB errors
            abort(400, message="A category with that name already exists.")
        except SQLAlchemyError as e:
            db.session.rollback()
            abort(500, message=f"Database error: {str(e)}")

        # ✅ Always return proper JSON, Flask-Smorest serializes automatically
        return category


# ✅ Optional safeguard — ensures that API always returns JSON
@blp.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Category not found"}), 404
