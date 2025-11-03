
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required ,  get_jwt
from sqlalchemy.exc import SQLAlchemyError
from flask import make_response, jsonify
from db import db
from models import ExpenseModel

blp = Blueprint("Expense", __name__, description="Operations on expenses")
from schemas import ExpenseSchema ,ExpenseUpdateSchema

@blp.route("/expense/<string:expense_id>")
class Expense(MethodView):
    @blp.response(200,ExpenseSchema)
    @jwt_required()
    def get(self, expense_id):
        expense = ExpenseModel.query.get_or_404(expense_id)
        return expense

    @jwt_required()
    def delete(self, expense_id):
        def delete(self, item_id):
            jwt = get_jwt()
            if not jwt.get("is_admin"):
                abort(401, message="Admin privilege required.")

        expense = ExpenseModel.query.get_or_404(expense_id)
        db.session.delete(expense)
        db.session.commit()
        return{"message":"Expense deleted"}

    @blp.arguments(ExpenseUpdateSchema)
    @blp.response( 200 ,ExpenseSchema)
    def put(self, expense_data ,expense_id):
        expense = ExpenseModel.query.get(expense_id)
        if expense:
            expense.price=expense_data["price"]
            expense.name=expense_data["name"]
        else:
            expense=ExpenseModel(id = expense_id ,**expense_data)
        db.session.add(expense)
        db.session.commit()

        return expense

@blp.route("/expense")
class ExpenseList(MethodView):
    @jwt_required()
    @blp.response(200, ExpenseSchema(many=True))
    def get(self):
        return ExpenseModel.query.all() 

    @jwt_required(fresh=True)
    @blp.arguments(ExpenseSchema)
    @blp.response(201, ExpenseSchema)
    def post(self, expense_data):
        expense = ExpenseModel(**expense_data)
        try:
            db.session.add(expense)
            db.session.commit()
        except SQLAlchemyError:
            abort(500, message="An error occurred while inserting the item.")
        return expense  # ✅ Flask-Smorest will serialize & return 201
