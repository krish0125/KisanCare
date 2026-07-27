"""
backend/models/expense.py
-------------------------
MongoDB helper functions for the 'crop_cycles' collection.
Manages crop cycles and their associated expenses to calculate profit/loss.
"""

from datetime import datetime
import uuid
from backend.config import Config

CYCLES_COL = Config.CYCLES_COLLECTION
EXPENSE_CATEGORIES = ['seeds', 'fertilizer', 'labour', 'machinery', 'irrigation', 'transport', 'miscellaneous']

def create_crop_cycle(db, email: str, cycle_data: dict):
    """Create a new crop cycle."""
    if db is None:
        return None
        
    cycle_id = str(uuid.uuid4())
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    doc = {
        'cycle_id': cycle_id,
        'email': email.lower().strip(),
        'cycle_name': cycle_data.get('cycle_name', 'Untitled Cycle'),
        'crop': cycle_data.get('crop', ''),
        'land_area_acres': float(cycle_data.get('land_area_acres', 0.0)),
        'start_date': cycle_data.get('start_date', now[:10]),
        'status': cycle_data.get('status', 'active'),
        'expenses': [],
        'expected_sale_price_inr_per_quintal': float(cycle_data.get('expected_sale_price', 0.0)),
        'actual_sale_price_inr_per_quintal': float(cycle_data.get('actual_sale_price', 0.0)),
        'actual_yield_quintals': float(cycle_data.get('actual_yield', 0.0)),
        'created_at': now,
        'updated_at': now
    }
    
    try:
        db[CYCLES_COL].insert_one(doc)
        # Remove _id before returning
        doc.pop('_id', None)
        return doc
    except Exception as e:
        print(f"❌ Error creating crop cycle: {e}")
        return None

def get_crop_cycles(db, email: str):
    """Retrieve all crop cycles for a user."""
    if db is None:
        return []
        
    try:
        cursor = db[CYCLES_COL].find({'email': email.lower().strip()}, {'_id': 0}).sort('created_at', -1)
        return list(cursor)
    except Exception as e:
        print(f"❌ Error fetching crop cycles: {e}")
        return []

def get_crop_cycle(db, cycle_id: str, email: str):
    """Retrieve a specific crop cycle."""
    if db is None:
        return None
    return db[CYCLES_COL].find_one({'cycle_id': cycle_id, 'email': email.lower().strip()}, {'_id': 0})

def update_crop_cycle(db, cycle_id: str, email: str, update_data: dict):
    """Update metadata of a crop cycle."""
    if db is None:
        return False
        
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    update_doc = {'updated_at': now}
    
    # Only map fields that are provided and valid
    field_map = {
        'cycle_name': str,
        'status': str,
        'expected_sale_price': ('expected_sale_price_inr_per_quintal', float),
        'actual_sale_price': ('actual_sale_price_inr_per_quintal', float),
        'actual_yield': ('actual_yield_quintals', float)
    }
    
    for key, val in update_data.items():
        if key in field_map:
            mapping = field_map[key]
            if isinstance(mapping, tuple):
                db_key, type_func = mapping
                try:
                    update_doc[db_key] = type_func(val)
                except (ValueError, TypeError):
                    pass
            else:
                try:
                    update_doc[key] = mapping(val)
                except (ValueError, TypeError):
                    pass
                    
    if len(update_doc) == 1: # Only updated_at
        return True
        
    try:
        result = db[CYCLES_COL].update_one(
            {'cycle_id': cycle_id, 'email': email.lower().strip()},
            {'$set': update_doc}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"❌ Error updating crop cycle: {e}")
        return False

def add_expense(db, cycle_id: str, email: str, expense_data: dict):
    """Add an expense line item to a cycle."""
    if db is None:
        return None
        
    category = expense_data.get('category', 'miscellaneous').lower()
    if category not in EXPENSE_CATEGORIES:
        category = 'miscellaneous'
        
    expense = {
        'expense_id': str(uuid.uuid4()),
        'category': category,
        'amount_inr': float(expense_data.get('amount_inr', 0.0)),
        'date': expense_data.get('date', datetime.now().strftime('%Y-%m-%d')),
        'note': expense_data.get('note', '')
    }
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    try:
        result = db[CYCLES_COL].update_one(
            {'cycle_id': cycle_id, 'email': email.lower().strip()},
            {
                '$push': {'expenses': expense},
                '$set': {'updated_at': now}
            }
        )
        if result.modified_count > 0:
            return expense
        return None
    except Exception as e:
        print(f"❌ Error adding expense: {e}")
        return None

def remove_expense(db, cycle_id: str, expense_id: str, email: str):
    """Remove an expense from a cycle."""
    if db is None:
        return False
        
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    try:
        result = db[CYCLES_COL].update_one(
            {'cycle_id': cycle_id, 'email': email.lower().strip()},
            {
                '$pull': {'expenses': {'expense_id': expense_id}},
                '$set': {'updated_at': now}
            }
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"❌ Error removing expense: {e}")
        return False

def compute_cycle_summary(cycle_doc: dict):
    """Compute financial totals for a cycle document."""
    if not cycle_doc:
        return None
        
    total_investment = sum(exp.get('amount_inr', 0) for exp in cycle_doc.get('expenses', []))
    
    expected_price = cycle_doc.get('expected_sale_price_inr_per_quintal', 0)
    actual_price = cycle_doc.get('actual_sale_price_inr_per_quintal', 0)
    yield_qtls = cycle_doc.get('actual_yield_quintals', 0)
    
    # Use actuals if available, fallback to expected
    revenue_price = actual_price if actual_price > 0 else expected_price
    
    expected_revenue = expected_price * yield_qtls
    actual_revenue = actual_price * yield_qtls
    
    revenue = revenue_price * yield_qtls
    profit_loss = revenue - total_investment
    
    land_area = cycle_doc.get('land_area_acres', 0)
    profit_loss_per_acre = profit_loss / land_area if land_area > 0 else 0
    
    return {
        'total_investment_inr': total_investment,
        'expected_revenue_inr': expected_revenue,
        'actual_revenue_inr': actual_revenue,
        'current_revenue_estimate_inr': revenue,
        'profit_loss_inr': profit_loss,
        'profit_loss_per_acre_inr': profit_loss_per_acre,
        'is_profitable': profit_loss > 0
    }
