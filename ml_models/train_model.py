import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# Create mock data for Farmer "Stamina" Prediction
# Inputs: 
# - Hours_Worked (0-12)
# - Temperature_C (20-45)
# - Hydration_Liters (0-5)
# - Sleep_Hours (4-10)
# Output:
# - Stamina_Level (0-100)

print("Generating mock dataset...")
np.random.seed(42)
n_samples = 1000

hours_worked = np.random.uniform(0, 12, n_samples)
temperature = np.random.uniform(20, 45, n_samples)
hydration = np.random.uniform(0, 5, n_samples)
sleep = np.random.uniform(4, 10, n_samples)

# Formula for stamina (mock logic):
# Base 100
# - 5 per hour worked
# - 1 per degree above 25
# + 10 per liter water
# + 5 per hour sleep
# Noise added
stamina = 100 - (5 * hours_worked) - (1 * np.maximum(0, temperature - 25)) + (10 * hydration) + (5 * sleep)
stamina = np.clip(stamina + np.random.normal(0, 5, n_samples), 0, 100)

data = pd.DataFrame({
    'Hours_Worked': hours_worked,
    'Temperature_C': temperature,
    'Hydration_Liters': hydration,
    'Sleep_Hours': sleep,
    'Stamina_Score': stamina
})

# Save mock data
data.to_csv('farmer_stamina_data.csv', index=False)
print("Saved mock data to 'farmer_stamina_data.csv'")

# Train Model
print("Training AI Model...")
X = data[['Hours_Worked', 'Temperature_C', 'Hydration_Liters', 'Sleep_Hours']]
y = data['Stamina_Score']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

score = model.score(X_test, y_test)
print(f"Model R^2 Score: {score:.2f}")

# Save Model
joblib.dump(model, 'stamina_model.pkl')
print("Model saved to 'stamina_model.pkl'")
