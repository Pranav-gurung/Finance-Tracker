from flask.views import MethodView
from flask_smorest import Blueprint, abort
from sqlalchemy.exc import SQLAlchemyError

from db import db
from models import TagModel , CategoryModel ,ExpenseModel
from schemas import TagSchema ,TagAndExpenseSchema


blp = Blueprint("Tag","tag",description="Operation on tags")

@blp.route("/category/<string:category_id>/tag")
class TagsInCategory(MethodView):
    @blp.response(200, TagSchema(many=True))
    def get(self, category_id):
        category = CategoryModel.query.get_or_404(category_id)

        return category.tags.all()

    @blp.arguments(TagSchema)
    @blp.response(201, TagSchema)
    def post(self, tag_data, category_id):
        if TagModel.query.filter(TagModel.category_id == category_id, TagModel.name == tag_data["name"]).first():
            abort(400, message="A tag with that name already exists in that category.")

        tag = TagModel(**tag_data, category_id=category_id)

        try:
            db.session.add(tag)
            db.session.commit()
        except SQLAlchemyError as e:
            abort(
                500,
                message=str(e),
            )

        return tag

@blp.route("/expense/<string:expense_id>/tag/<string:tag_id>")
class LinkTagsToExpense(MethodView):
    @blp.response(201, TagSchema)
    def post(self, expense_id, tag_id):
        expense = ExpenseModel.query.get_or_404(expense_id)
        tag = TagModel.query.get_or_404(tag_id)

        expense.tags.append(tag)

        try:
            db.session.add(expense)
            db.session.commit()
        except SQLAlchemyError:
            abort(500, message="An error occurred while inserting the tag.")

        return tag
    

    @blp.response(200, TagAndExpenseSchema)
    def delete(self, expense_id, tag_id):
        expense = ExpenseModel.query.get_or_404(expense_id)
        tag = TagModel.query.get_or_404(tag_id)

        expense.tags.remove(tag)

        try:
            db.session.add(expense)
            db.session.commit()
        except SQLAlchemyError:
            abort(500, message="An error occurred while inserting the tag.")

        return {"message": "Expense removed from tag", "expense": expense, "tag": tag}

@blp.route("/tag/<string:tag_id>")
class Tag(MethodView):
    @blp.response(200, TagSchema)
    def get(self, tag_id):
        tag = TagModel.query.get_or_404(tag_id)
        return tag

    @blp.response(
        202,
        description="Deletes a tag if no expense is tagged with it.",
        example={"message": "Tag deleted."},
    )
    @blp.alt_response(404, description="Tag not found.")
    @blp.alt_response(
        400,
        description="Returned if the tag is assigned to one or more expense. In this case, the tag is not deleted.",
    )
    def delete(self, tag_id):
        tag = TagModel.query.get_or_404(tag_id)

        if not tag.expense:
            db.session.delete(tag)
            db.session.commit()
            return {"message": "Tag deleted."}
        abort(
            400,
             message="Could not delete tag. Make sure tag is not associated with any expense, then try again.",  
        )