from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from models.category import CategoryModel
from models.expense import ExpenseModel
from models.tag import TagModel
from models.expense_tag import ExpenseTags
from models.user import UserModel