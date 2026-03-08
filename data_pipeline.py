# Aegis Edge - AI-Powered Edge IDS
# Copyright (c) 2026 LOI CHIANG HAO
# Licensed under the MIT License

import json
import random
import time
from typing import Dict, Any

# Protocol mapping for normalization (e.g., TCP=1, UDP=2, ICMP=3)
PROTOCOLS = {"TCP": 1, "UDP": 2, "ICMP": 3}
TCP_FLAGS = {"SYN": 1, "ACK": 2, "FIN": 3, "RST": 4, "PSH": 5, "URG": 6, "NONE": 0}

def generate_synthetic_packet() -> Dict[str, Any]:
    """Simulates intercepting a network packet at an edge router."""
    is_anomaly = random.random() < 0.05  # 5% chance of generating a malicious-looking packet
    
    if is_anomaly:
        # Simulate an anomaly (e.g., massive packet size, unusual port)
        src_ip = f"192.168.1.{random.randint(200, 254)}"
        dst_port = random.choice([22, 23, 445, 3389]) # Targeting sensitive ports
        protocol = "TCP"
        packet_size = random.randint(1500, 65000) # Oversized packets
        tcp_flag = "SYN" # SYN flood
    else:
        # Normal traffic
        src_ip = f"10.0.0.{random.randint(1, 100)}"
        dst_port = random.choice([80, 443, 53])
        protocol = random.choice(["TCP", "UDP"])
        packet_size = random.randint(40, 1500)
        tcp_flag = random.choice(["ACK", "PSH", "NONE"]) if protocol == "TCP" else "NONE"
        
    packet = {
        "timestamp": time.time(),
        "src_ip": src_ip,
        "dst_port": dst_port,
        "protocol": protocol,
        "packet_size": packet_size,
        "tcp_flags": tcp_flag
    }
    return packet

def parse_and_normalize(packet: Dict[str, Any]) -> list:
    """
    Parses a JSON packet and normalizes the features for machine learning.
    Returns a standardized feature vector: [dst_port, protocol_encoded, packet_size_scaled, flags_encoded]
    """
    # 1. Port normalization (scaling down 0-65535 to 0-1 isn't strictly necessary for tree models, but good practice)
    # We will pass raw floats assuming StandardScaler in pipieline or robust algorithms
    dst_port = float(packet.get("dst_port", 0))
    
    # 2. Protocol encoding
    protocol_str = packet.get("protocol", "TCP")
    protocol_encoded = float(PROTOCOLS.get(protocol_str, 0))
    
    # 3. Size
    packet_size = float(packet.get("packet_size", 0))
    
    # 4. Flags
    flag_str = packet.get("tcp_flags", "NONE")
    flag_encoded = float(TCP_FLAGS.get(flag_str, 0))
    
    # Final feature vector
    features = [dst_port, protocol_encoded, packet_size, flag_encoded]
    return features

if __name__ == "__main__":
    print("Starting Synthetic Network Traffic Simulator...")
    for _ in range(3):
        pkt = generate_synthetic_packet()
        print(f"RAW JSON: {json.dumps(pkt)}")
        vector = parse_and_normalize(pkt)
        print(f"NORMALIZED: {vector}\n")
