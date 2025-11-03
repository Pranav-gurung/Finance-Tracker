from db import db
from .expense import ExpenseModel

class CategoryModel(db.Model):
    __tablename__ = "category"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    expense = db.relationship("ExpenseModel", back_populates="category", lazy="dynamic",cascade="all, delete")
    tag= db.relationship("TagModel",back_populates="category",lazy="dynamic")