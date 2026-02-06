# Farmer Stamina Prediction System - College Project 2026-27

A web-based application designed to predict a farmer's stamina and physical capability based on various input parameters using Machine Learning. This system aims to help in optimizing work schedules and health management for farmers.

## 🚀 Features

- **AI-Powered Predictions**: Uses a Machine Learning model (Regression/Classification) to estimate stamina levels.
- **Data Analysis**: Processes input data such as work hours, weather conditions, and physical variables.
- **User-Friendly Interface**: Clean and modern UI with Glassmorphism aesthetics.
- **Real-Time Feedback**: Instant results displayed upon data submission.

## 🛠️ Technology Stack

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Design system**: Custom Glassmorphism UI
- **Structure**: Vanilla implementation for performance and flexibility

### Backend
- **Framework**: Python (Flask)
- **API**: RESTful endpoints for frontend-ML communication
- **Utilities**: Flask-CORS for cross-origin resource sharing

### Machine Learning
- **Libraries**: Scikit-learn, Pandas, NumPy, Joblib
- **Data**: CSV-based datasets (`farmer_stamina_data.csv`)

## 📂 Project Structure

```
Collage Project 2026-27/
├── backend/                # Python Flask Server & API logic
│   └── app.py              # Main application entry point
├── documentation/          # Project documentation & Architecture
├── frontend/               # UI Source Code (HTML/CSS/JS)
├── ml_models/              # Trained ML models and scripts
├── farmer_stamina_data.csv # Dataset used for training
├── requirements.txt        # Python dependencies
└── index.html              # Entry point (Redirects to frontend)
```

## 🔧 Setup & Installation

### Prerequisities
- Python 3.x installed on your system.
- A modern web browser.

### 1. Install Dependencies
Open a terminal in the project root directory and run:

```bash
pip install -r requirements.txt
```

### 2. Run the Backend Server
Navigate to the backend directory and start the Flask server:

```bash
cd backend
python app.py
```
The server should start running (usually on `http://127.0.0.1:5000`).

### 3. Launch the Application
Simply open the `index.html` file located in the root directory in your web browser. It will automatically redirect you to the main application interface.

## 📝 Usage
1. Open the web interface.
2. Enter the required parameters (e.g., physical stats, working conditions).
3. Click "Unique Predict" (or the submit button).
4. View the predicted stamina score and recommendations.

## 👥 Contributors
- **Krish0125** (Project Lead)

---
*Created for the 2026-27 Academic Year.*
