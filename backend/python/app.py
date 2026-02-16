from flask import Flask, request, jsonify
from flask_cors import CORS

from summarizer import summarize_to_crt
from medicine_recommend.routes import medicine_bp

app = Flask(__name__)

CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True
)

# Register ML blueprint
app.register_blueprint(medicine_bp)
print("Blueprint registered!")

@app.route("/summarize", methods=["POST", "OPTIONS"])
def summarize():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json()
        transcript = data.get("transcript", "").strip()

        if not transcript:
            return jsonify({"error": "Transcript is empty"}), 400

        summary = summarize_to_crt(transcript)
        return jsonify({"summary": summary}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500
    
    


if __name__ == "__main__":
    app.run(port=5001, debug=True)

