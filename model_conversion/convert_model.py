import tensorflow as tf
import argparse
import os
import json
import numpy as np
import sys
from tensorflow.keras.preprocessing.text import tokenizer_from_json

# Compatibility shim for older tensorflowjs builds with NumPy >= 2.0.
if "object" not in np.__dict__:
    np.object = object  # type: ignore[attr-defined]
if "bool" not in np.__dict__:
    np.bool = bool  # type: ignore[attr-defined]


def import_tensorflowjs():
    """
    Import tensorflowjs lazily so we can provide actionable compatibility guidance.
    """
    try:
        import tensorflowjs as tfjs  # type: ignore
        return tfjs
    except Exception as exc:
        py_ver = f"{sys.version_info.major}.{sys.version_info.minor}"
        
        print("\n" + "="*80)
        print("🛑 ERROR: Failed to import tensorflowjs.")
        print(f"Detected Python {py_ver}. The `tensorflowjs` Python package currently")
        print("has compatibility issues with Python 3.13 on Windows.")
        print("-" * 80)
        print("✨ WORKAROUND: We have created a browser-based model generator for you!")
        print("Because you just need the mock model files for the extension, you can generate")
        print("them instantly without Python dependencies:")
        print("\n1. Open this file in your browser (Chrome/Edge):")
        print(f"   file:///{os.path.abspath('generate_mock_model_browser.html').replace(chr(92), '/')}")
        print("2. Click the 'Generate & Download Mock Model' button.")
        print("3. Move the downloaded `model.json`, `model.weights.bin`, and `vocab.json` files")
        print("   into your `extension/model/` directory.")
        print("="*80 + "\n")
        sys.exit(1)

def create_mock_cnn_bilstm_model(vocab_size=10000, embedding_dim=128, max_length=500):
    """
    Creates a mock CNN-BiLSTM model for demonstration purposes.
    In a real scenario, you would load your pre-trained Keras model.
    """
    model = tf.keras.Sequential([
        tf.keras.layers.Embedding(vocab_size, embedding_dim, input_length=max_length),
        tf.keras.layers.Conv1D(128, 5, activation='relu'),
        tf.keras.layers.MaxPooling1D(pool_size=4),
        tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(64, return_sequences=True)),
        tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(32)),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(1, activation='sigmoid') # Binary classification: Phishing/Spam vs Normal
    ])
    
    model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])
    return model


def export_tokenizer_vocab(tokenizer_json_path, output_dir):
    """
    Exports a fitted Keras Tokenizer word_index to vocab.json for TFJS inference.
    Accepts either:
    - tokenizer.to_json() output, or
    - a plain JSON object mapping token -> id.
    """
    if not tokenizer_json_path:
        print("Tokenizer path not provided. Skipping vocabulary export.")
        return

    if not os.path.exists(tokenizer_json_path):
        print(f"Tokenizer path not found: {tokenizer_json_path}. Skipping vocabulary export.")
        return

    with open(tokenizer_json_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    if isinstance(raw, dict) and "config" in raw and "class_name" in raw:
        tokenizer = tokenizer_from_json(json.dumps(raw))
        word_index = tokenizer.word_index
    elif isinstance(raw, dict):
        # Plain token->id dictionary.
        word_index = raw
    else:
        raise ValueError("Unsupported tokenizer JSON format. Expected tokenizer JSON or token->id dictionary.")

    vocab_path = os.path.join(output_dir, 'vocab.json')
    with open(vocab_path, 'w', encoding='utf-8') as f:
        json.dump(word_index, f, ensure_ascii=False)

    print(f"Vocabulary exported to: {vocab_path}")

def convert_model_to_tfjs(keras_model_path, output_dir, tokenizer_path=''):
    """
    Converts a Keras model to TensorFlow.js format with quantization.
    """
    if keras_model_path and os.path.exists(keras_model_path):
        print(f"Loading existing model from: {keras_model_path}")
        model = tf.keras.models.load_model(keras_model_path)
    else:
        print("Model path not provided or not found. Creating a mock CNN-BiLSTM model.")
        model = create_mock_cnn_bilstm_model()
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Convert and save the model to TF.js format
    # We apply quantization (uint8) to reduce model size for Edge deployment
    tfjs = import_tensorflowjs()
    print(f"Converting model to TensorFlow.js format...")
    tfjs.converters.save_keras_model(
        model, 
        output_dir, 
        quantization_dtype_np=tf.uint8 # Float16 or Uint8 for model weight quantization
    )

    export_tokenizer_vocab(tokenizer_path, output_dir)
    
    print(f"Model successfully converted and saved to: {output_dir}")
    print("Files ready to be bundled with the Chrome Extension.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert Keras CNN-BiLSTM model to TFJS for Aegis Edge.')
    parser.add_argument('--model_path', type=str, default='', help='Path to the trained .h5 Keras model.')
    parser.add_argument('--output_dir', type=str, default='../extension/model', help='Directory to save the TF.js model.')
    parser.add_argument('--tokenizer_path', type=str, default='', help='Path to tokenizer JSON (tokenizer.to_json or token->id JSON).')
    
    args = parser.parse_args()
    
    convert_model_to_tfjs(args.model_path, args.output_dir, args.tokenizer_path)

# NOTE: Requires `tensorflowjs` package
# pip install tensorflow tensorflowjs
