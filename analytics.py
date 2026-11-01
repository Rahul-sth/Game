from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/api/stats', methods=['POST'])
def calculate_stats():
    data = request.json or {}
    score = data.get('score', 0)
    enemies_destroyed = data.get('enemiesDestroyed', 0)
    shots_fired = data.get('shotsFired', 1)
    
    accuracy = round((enemies_destroyed / max(1, shots_fired)) * 100, 2)
    rating = "S" if score > 500 and accuracy > 60 else "A" if score > 200 else "B"

    return jsonify({
        "accuracy": accuracy,
        "rating": rating,
        "calculatedScore": score
    })

if __name__ == '__main__':
    app.run(port=5000)