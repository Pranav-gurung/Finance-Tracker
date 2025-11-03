from db import db

class ExpenseTags(db.Model):
    __tablename__="expense_tag"

    id = db.Column(db.Integer,primary_key="True")
    expense_id=db.Column(db.Integer,db.ForeignKey("expense.id"))
    tag_id= db.Column(db.Integer,db.ForeignKey("tag.id"))

    