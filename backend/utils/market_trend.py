"""
backend/utils/market_trend.py
------------------------------
Pure functions for calculating market price trends and generating rule-based suggestions.
"""

def analyze_trend(history):
    """
    Given a list of price records sorted by date (oldest to newest),
    computes the trend and generates a suggestion.
    Expects history format: [{'date': 'YYYY-MM-DD', 'modal_price': 2200}, ...]
    """
    if not history:
        return {
            "highest": None,
            "lowest": None,
            "average": None,
            "trend": "flat",
            "suggestion": "Not enough data to determine a trend."
        }

    prices = [record.get('modal_price', 0) for record in history if record.get('modal_price') is not None]
    
    if not prices:
        return {
            "highest": None,
            "lowest": None,
            "average": None,
            "trend": "flat",
            "suggestion": "No valid price data available."
        }
        
    highest = max(prices)
    lowest = min(prices)
    average = sum(prices) / len(prices)
    
    if len(prices) < 2:
         return {
            "highest": highest,
            "lowest": lowest,
            "average": round(average, 2),
            "trend": "flat",
            "suggestion": "Gathering more data... Only 1 day of price history is available."
        }

    # Trend calculation (simple diffs)
    ups = 0
    downs = 0
    for i in range(1, len(prices)):
        if prices[i] > prices[i-1]:
            ups += 1
        elif prices[i] < prices[i-1]:
            downs += 1
            
    # Heuristics
    trend = "flat"
    if ups > downs and ups >= len(prices) // 2:
        trend = "up"
    elif downs > ups and downs >= len(prices) // 2:
        trend = "down"

    # Generate suggestion
    suggestion = "Prices are relatively stable. Sell when convenient."
    if trend == "up":
        suggestion = f"Prices have risen {ups} of the last {len(prices)-1} days — consider holding if storage allows."
    elif trend == "down":
        suggestion = f"Prices are falling ({downs} drops in {len(prices)-1} days) — consider selling soon."

    return {
        "highest": highest,
        "lowest": lowest,
        "average": round(average, 2),
        "trend": trend,
        "suggestion": suggestion
    }
