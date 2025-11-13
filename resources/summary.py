# resources/summary.py
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import ExpenseModel
from db import db

blp = Blueprint("Summary", "summary", description="Financial summary endpoints")

@blp.route("/summary")
class FinancialSummary(MethodView):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()

        expenses = ExpenseModel.query.filter_by(user_id=user_id).all()

        total_income = sum(e.amount for e in expenses if e.amount > 0)
        total_expense = sum(abs(e.amount) for e in expenses if e.amount < 0)
        balance = total_income - total_expense

        return {
            "total_balance": balance,
            "total_income": total_income,
            "total_expenses": total_expense,
            "income_transactions": len([e for e in expenses if e.amount > 0]),
            "expense_transactions": len([e for e in expenses if e.amount < 0])
        }, 200
