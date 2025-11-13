from flask.views import MethodView
from flask_smorest import Blueprint
from flask_smorest import abort
from models import CategoryModel, TagModel, db
from schemas import TagSchema, CategorySchema

blp = Blueprint("Categories", __name__, description="Operations on categories and tags")


@blp.route("/categories")
class CategoryList(MethodView):

    @blp.response(200, CategorySchema(many=True))
    def get(self):
        """Get all categories"""
        categories = CategoryModel.query.all()
        return categories

    @blp.arguments(CategorySchema)
    @blp.response(201, CategorySchema)
    def post(self, new_data):
        """Create a new category"""
        category = CategoryModel(**new_data)
        db.session.add(category)
        db.session.commit()
        return category


@blp.route("/categories/<int:category_id>")
class CategoryDetail(MethodView):

    @blp.response(200, CategorySchema)
    def get(self, category_id):
        """Get category by ID"""
        category = CategoryModel.query.get_or_404(category_id)
        return category

    @blp.arguments(CategorySchema)
    @blp.response(200, CategorySchema)
    def put(self, updated_data, category_id):
        """Update category"""
        category = CategoryModel.query.get_or_404(category_id)
        for key, value in updated_data.items():
            setattr(category, key, value)
        db.session.commit()
        return category

    @blp.response(204)
    def delete(self, category_id):
        """Delete category"""
        category = CategoryModel.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        return ""


@blp.route("/categories/<int:category_id>/tags")
class CategoryTags(MethodView):

    @blp.response(200, TagSchema(many=True))
    def get(self, category_id):
        """Get all tags for a category"""
        category = CategoryModel.query.get_or_404(category_id)
        return category.tags  # make sure relationship is `tags`

    @blp.arguments(TagSchema)
    @blp.response(201, TagSchema)
    def post(self, new_data, category_id):
        """Create a new tag under a category"""
        category = CategoryModel.query.get_or_404(category_id)
        tag = TagModel(**new_data, category_id=category.id)
        db.session.add(tag)
        db.session.commit()
        return tag
