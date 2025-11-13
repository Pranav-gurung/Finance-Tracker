from db import db


class TagModel(db.Model):
    __tablename__ = "tag"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=False, nullable=False)
    category_id = db.Column(db.Integer,db.ForeignKey("category.id"), nullable=False)
    category = db.relationship("CategoryModel", back_populates="tag")
    expense=db.relationship("ExpenseModel",back_populates="tag",secondary="expense_tag")
    balance = db.Column(db.Float, default=0.0)