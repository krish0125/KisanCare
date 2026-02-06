import requests
import json

url = 'http://localhost:5001/login'
headers = {'Content-Type': 'application/json'}
data = {
    'email': 'kishan@gmail.com',
    'password': 'kishan123'
}

print(f"Testing Login for: {data['email']}")

try:
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Text:", response.text)
except Exception as e:
    print(f"Request Failed: {e}")
