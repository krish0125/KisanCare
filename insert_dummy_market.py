from pymongo import MongoClient
import datetime
import random

client = MongoClient('mongodb://localhost:27017/')
db = client['kisancare_db']
col = db['market_prices']

today = datetime.datetime.now()
for i in range(5):
    date_str = (today - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
    update_doc = {'$set': {
        'commodity': 'wheat',
        'state': 'gujarat',
        'district': 'gujarat',
        'market': 'test_mandi',
        'date': date_str,
        'modal_price': 2200 + random.randint(-50, 50)
    }}
    col.update_one(
        {'commodity': 'wheat', 'state': 'gujarat', 'market': 'test_mandi', 'date': date_str},
        update_doc,
        upsert=True
    )
print("Dummy data inserted into kisancare_db")
