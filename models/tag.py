from db import db


class TagModel(db.Model):
    __tablename__ = "tag"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=False, nullable=False)
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("category.id"),
        nullable=False
    )

    # FIXED: back_populates must match CategoryModel.tags
    category = db.relationship(
        "CategoryModel",
        back_populates="tag"
    )

    expense = db.relationship(
        "ExpenseModel",
        back_populates="tag",
        secondary="expense_tag"
    )