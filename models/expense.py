from db import db


class ExpenseModel(db.Model):
    __tablename__ = "expense"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=False, nullable=False)
    description = db.Column(db.String)
    price = db.Column(db.Float(precision=2), unique=False, nullable=False)
    category_id = db.Column(db.Integer,db.ForeignKey("category.id"), unique=False, nullable=False)
    category = db.relationship("CategoryModel", back_populates="expense")
    tag= db.relationship("TagModel",back_populates="expense",secondary="expense_tag")