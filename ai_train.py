import json
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from data_pipeline import generate_synthetic_packet, parse_and_normalize

def create_synthetic_dataset(num_samples: int = 5000):
    """Generates a dataset of normalized network packets for training."""
    dataset = []
    print(f"Generating {num_samples} synthetic packets (combining normal and malicious)...")
    for _ in range(num_samples):
        # generate_synthetic_packet() already injects anomalies
        pkt = generate_synthetic_packet()
        vector = parse_and_normalize(pkt)
        dataset.append(vector)
    
    return np.array(dataset)

def train_and_save_model():
    """Trains an Isolation Forest anomaly detection model and saves it."""
    X_train = create_synthetic_dataset(10000)
    
    # We use an Isolation Forest because it's lightweight, extremely fast, 
    # and unsupervised (perfect for anomaly detection).
    model = IsolationForest(
        n_estimators=100,
        max_samples='auto',
        contamination=0.05,  # Our data_pipeline generates ~5% anomalies
        random_state=42
    )
    
    print("Training Isolation Forest Anomaly Engine...")
    model.fit(X_train)
    
    # Save the model
    model_path = "edge_anomaly_model.pkl"
    joblib.dump(model, model_path)
    print(f"Model successfully saved to '{model_path}'. Ready for Edge inference.")

if __name__ == "__main__":
    train_and_save_model()
