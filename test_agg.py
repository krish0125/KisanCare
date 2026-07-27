from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['kisancare']
col = db['market_prices']

try:
    results = list(col.aggregate([
        {'': {'commodity': 'wheat'}},
        {'': {'_id': '$date', 'avg_modal': {'$avg': '$modal_price'}}},
        {'$sort': {'_id': -1}},
        {'$limit': 7},
        {'$sort': {'_id': 1}}
    ]))
    print(results)
except Exception as e:
    print("ERROR:", e)
