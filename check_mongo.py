from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017/')
db = client['kisancare']
col = db['market_prices']
pipeline = [
    {'': {'commodity': 'wheat'}},
    {'': {'_id': '', 'avg_modal': {'': ''}}}
]
try:
    results = list(col.aggregate(pipeline))
    print("Aggregate results:", results)
except Exception as e:
    print("ERROR:", e)
