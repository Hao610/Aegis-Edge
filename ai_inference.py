import sys
import json
import joblib
import numpy as np
from typing import Dict, Any

from data_pipeline import parse_and_normalize

# Global load to avoid re-loading weights for every packet inference
MODEL_PATH = "edge_anomaly_model.pkl"
try:
    edge_model = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"Error loading model {MODEL_PATH}: {e}")
    sys.exit(1)

def infer_threat_score(raw_packet: Dict[str, Any]) -> float:
    """
    Evaluates new incoming JSON network data and returns a normalized
    threat confidence score between 0.0 (safe) and 1.0 (malicious anomaly).
    """
    try:
        # 1. Pipeline parser
        features = parse_and_normalize(raw_packet)
        # Reshape to 2D array for sklearn: [n_samples, n_features]
        X = np.array(features).reshape(1, -1)
        
        # 2. Inference
        # Isolation Forest's decision_function returns average anomaly scores
        # The lower the score, the more abnormal the instance is. We flip and scale this.
        # It typically spans roughly [-0.5, 0.5]
        score = edge_model.decision_function(X)[0]
        
        # In sklearn, values < 0 indicate anomalies, > 0 indicate inliers.
        # We want to map this to a percentage where -0.3 is ~ 99% anomaly
        # Using a raw sigmoid-like scaling
        confidence_raw = 1 / (1 + np.exp(score * 10))
        
        # We bound it between 0 and 1
        threat_confidence = max(0.0, min(1.0, confidence_raw))
        
        return float(threat_confidence)
    except Exception as e:
        print(f"Inference pipeline failed: {e}")
        return 0.0

if __name__ == "__main__":
    test_packet = {
        "timestamp": 169000000.0,
        "src_ip": "192.168.1.100",
        "dst_port": 22,
        "protocol": "TCP",
        "packet_size": 65000,
        "tcp_flags": "SYN"
    }
    score = infer_threat_score(test_packet)
    print(f"Evaluated Test Packet Confidence Score: {score:.4f} (expected high)")
