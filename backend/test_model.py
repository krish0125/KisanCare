import requests

url = 'http://127.0.0.1:5000/predict'
data = {
    'hours_worked': 6,
    'temperature': 30,
    'hydration': 2,
    'sleep': 7
}

try:
    response = requests.post(url, json=data)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)
