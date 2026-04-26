import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle

# 🔥 ADD THIS PART
base_dir = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_dir, '..', 'data', 'dataset.csv')

df = pd.read_csv(data_path)

# rest stays same
X = df.drop('default', axis=1)
y = df['default']

model = RandomForestClassifier()
model.fit(X, y)

model_path = os.path.join(base_dir, 'model.pkl')
pickle.dump(model, open(model_path, 'wb'))

print("Model trained successfully!")