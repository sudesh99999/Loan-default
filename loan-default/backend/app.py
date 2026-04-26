from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# load model safely
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, 'model.pkl')

model = pickle.load(open(model_path, 'rb'))

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    features = np.array([[
        data['mobile_usage'],
        data['calls'],
        data['sms'],
        data['app_score'],
        data['transactions'],
        data['balance'],
        data['loan']
    ]])

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]

    return jsonify({
        "prediction": int(prediction),
        "risk_score": float(probability)
    })

if __name__ == '__main__':
    app.run(debug=True)