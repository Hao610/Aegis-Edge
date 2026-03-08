# Aegis Edge - AI-Powered Edge IDS
# Copyright (c) 2026 LOI CHIANG HAO
# Licensed under the MIT License

import asyncio
import json
import time
import os
from typing import Dict, Any, List

from data_pipeline import generate_synthetic_packet
from ai_inference import infer_threat_score

BLOCKLIST_FILE = "blocklist.json"
ALERTS_FILE = "alerts.json"

async def sync_threat_intelligence(flagged_ip: str, score: float):
    """
    Simulates securely transmitting anonymized threat intelligence to a central 
    cloud API. This decentralized approach shares bad actors across all Edge Nodes.
    Strips raw payload/packet data, only sending IP and threat vector logic.
    """
    anonymized_payload = {
        "node_id": "AEGIS-EDGE-092X",
        "suspicious_ip": flagged_ip,
        "confidence": round(score, 3)
    }
    # Mocking REST API call
    print(f"📡 [THREAT-SYNC] Transmitting anonymized intelligence to central cloud API...")
    await asyncio.sleep(0.5)  # Simulate network latency
    print(f"✅ [THREAT-SYNC] API Ack HTTP 200: {json.dumps(anonymized_payload)}")

def read_json_safe(file_path: str) -> List[Any]:
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def write_json_safe(file_path: str, data: Any):
    # Atomic write to prevent dashboard parsing issues
    temp_path = file_path + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    os.replace(temp_path, file_path)

def block_ip(ip: str):
    blocklist = read_json_safe(BLOCKLIST_FILE)
    if ip not in blocklist:
        blocklist.append(ip)
        write_json_safe(BLOCKLIST_FILE, blocklist)
        print(f"🛑 [FIREWALL RULE ADDED] IP '{ip}' is now blocked at the Edge.")

def record_alert(packet: Dict[str, Any], score: float):
    alerts = read_json_safe(ALERTS_FILE)
    # Keep only most recent 100 alerts
    if len(alerts) > 100:
        alerts.pop(0)

    alert_idx = len(alerts)
    alert = {
        "id": f"INT-{int(time.time() * 1000)}-{alert_idx}",
        "timestamp": time.time(),
        "src_ip": packet['src_ip'],
        "dst_port": packet['dst_port'],
        "protocol": packet['protocol'],
        "size": packet['packet_size'],
        "confidence": round(score, 4)
    }
    alerts.append(alert)
    write_json_safe(ALERTS_FILE, alerts)

async def edge_monitor_loop():
    print("🚀 Aegis Edge Intrusion Detection System Started.")
    print(f"Monitoring network perimeter. Writing blocks to {BLOCKLIST_FILE}\n")
    
    # Pre-clear files for fresh run
    write_json_safe(BLOCKLIST_FILE, [])
    write_json_safe(ALERTS_FILE, [])

    while True:
        # 1. Simulating inbound packet off network interface
        packet = generate_synthetic_packet()

        # 2. Local AI Inference Pipeline (runs in ~2ms)
        score = infer_threat_score(packet)
        
        # 3. Decision Engine: Block threshold > 0.8
        is_threat = score > 0.80
        
        if is_threat:
            print(f"🚨 [ATTACK DETECTED] Src: {packet['src_ip']} -> Port: {packet['dst_port']} (Conf: {score:.3f})")
            
            # Formally block locally
            block_ip(packet['src_ip'])
            
            # Record JSON alert for the local NOC dashboard
            record_alert(packet, score)
            
            # Cloud Async Intelligence sync
            asyncio.create_task(sync_threat_intelligence(packet['src_ip'], score))
        else:
            # We can still record harmless traffic in a generic log or discard
            pass

        # Throttle synthetic loop for demo
        await asyncio.sleep(0.1)

if __name__ == "__main__":
    try:
        asyncio.run(edge_monitor_loop())
    except KeyboardInterrupt:
        print("\nAegis Edge Shutdown sequence completed.")
