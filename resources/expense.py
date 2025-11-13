from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.exc import SQLAlchemyError
from flask import request
from db import db
from models import ExpenseModel, UserModel
from schemas import ExpenseSchema, ExpenseUpdateSchema

blp = Blueprint("Expense", __name__, description="Operations on expenses")

# ----- Single Expense -----
@blp.route("/expense/<string:expense_id>")
class Expense(MethodView):
    @jwt_required()
    @blp.response(200, ExpenseSchema)
    def get(self, expense_id):
        expense = ExpenseModel.query.get_or_404(expense_id)
        return expense

    @jwt_required()
    def delete(self, expense_id):
        expense = ExpenseModel.query.get_or_404(expense_id)
        try:
            db.session.delete(expense)
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            abort(500, message=f"Database error: {str(e)}")
        return {"message": "Expense deleted"}

    @jwt_required()
    @blp.arguments(ExpenseUpdateSchema)
    @blp.response(200, ExpenseSchema)
    def put(self, expense_data, expense_id):
        expense = ExpenseModel.query.get(expense_id)
        if expense:
            expense.amount = expense_data["amount"]
            expense.name = expense_data["name"]
            expense.category_id = expense_data["category_id"]
        else:
            expense = ExpenseModel(id=expense_id, **expense_data, user_id=get_jwt_identity())
        try:
            db.session.add(expense)
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            abort(500, message=f"Database error: {str(e)}")
        return expense

# ----- Expense List -----
@blp.route("/expense")
class ExpenseList(MethodView):
    @jwt_required()
    @blp.response(200, ExpenseSchema(many=True))
    def get(self):
        user_id = get_jwt_identity()
        return ExpenseModel.query.filter_by(user_id=user_id).all()

    @jwt_required(fresh=True)
    @blp.arguments(ExpenseSchema)
    @blp.response(201, ExpenseSchema)
    def post(self, expense_data):
        user_id = get_jwt_identity()
        expense = ExpenseModel(**expense_data, user_id=user_id)
        try:
            db.session.add(expense)
            # Update user balance
            user = UserModel.query.get(user_id)
            if expense.amount > 0:
                user.balance += expense.amount
            else:
                user.balance += expense.amount  # expense.amount is negative
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()
            abort(500, message=f"Database error: {str(e)}")
        return expense
