from marshmallow import Schema, fields


class PlainExpenseSchema(Schema):
    id = fields.Str(dump_only=True)
    name = fields.Str(required=True)
    price = fields.Float(required=True)

class PlainCategorySchema(Schema):
    id = fields.Str(dump_only=True)
    name = fields.Str(required=True)

class PlainTagSchema(Schema):
    id = fields.Int(dump_only=True)
    name=fields.Str()

class ExpenseSchema(PlainExpenseSchema):
    category_id = fields.Int(required=True, load_only=True)
    category = fields.Nested(PlainCategorySchema(), dump_only=True)
    tag=fields.List(fields.Nested(PlainTagSchema()),dump_only=True)

class ExpenseUpdateSchema(Schema):
    name = fields.Str()
    price = fields.Float()
    category_id = fields.Int()

class CategorySchema(PlainCategorySchema):
    expense = fields.List(fields.Nested(PlainExpenseSchema()), dump_only=True)
    tag = fields.List(fields.Nested(PlainTagSchema()), dump_only=True)

class TagSchema(PlainTagSchema):
    category_id = fields.Int(load_only=True)
    category = fields.Nested(PlainCategorySchema(), dump_only=True)
    expense=fields.List(fields.Nested(PlainExpenseSchema()),dump_only=True)
    
class TagAndExpenseSchema(Schema):
    message=fields.Str()
    expense=fields.Nested(ExpenseSchema)
    tag=fields.Nested(TagSchema)

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    username=fields.Str(required=True)
    password=fields.Str(required=True)