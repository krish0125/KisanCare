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

# In-memory storage with sample crop cycles for fallback / demo mode
_FALLBACK_CYCLES = [
    {
        'cycle_id': 'cycle-wheat-2026',
        'email': 'demo@gmail.com',
        'cycle_name': 'Wheat Rabi 2025-26',
        'crop': 'Wheat',
        'land_area_acres': 3.5,
        'start_date': '2025-11-10',
        'status': 'active',
        'expenses': [
            {'expense_id': 'exp-w-1', 'category': 'seeds', 'amount_inr': 4500.0, 'date': '2025-11-12', 'note': 'High-yield HD-2967 certified seeds (140 kg)'},
            {'expense_id': 'exp-w-2', 'category': 'fertilizer', 'amount_inr': 6200.0, 'date': '2025-11-20', 'note': 'DAP & Urea basal application (3 bags)'},
            {'expense_id': 'exp-w-3', 'category': 'labour', 'amount_inr': 5000.0, 'date': '2025-12-05', 'note': 'Weeding and initial soil treatment'},
            {'expense_id': 'exp-w-4', 'category': 'irrigation', 'amount_inr': 3200.0, 'date': '2025-12-25', 'note': 'First crown root initiation irrigation pump charges'},
            {'expense_id': 'exp-w-5', 'category': 'machinery', 'amount_inr': 4000.0, 'date': '2026-01-10', 'note': 'Tractor cultivator and rotavator service'}
        ],
        'expected_sale_price_inr_per_quintal': 2425.0,
        'actual_sale_price_inr_per_quintal': 2475.0,
        'actual_yield_quintals': 42.0,
        'created_at': '2025-11-10 09:00:00',
        'updated_at': '2026-01-10 14:30:00'
    },
    {
        'cycle_id': 'cycle-cotton-2025',
        'email': 'demo@gmail.com',
        'cycle_name': 'Cotton Kharif 2025',
        'crop': 'Cotton',
        'land_area_acres': 2.0,
        'start_date': '2025-06-15',
        'status': 'completed',
        'expenses': [
            {'expense_id': 'exp-c-1', 'category': 'seeds', 'amount_inr': 3800.0, 'date': '2025-06-18', 'note': 'Bt-Cotton hybrid packets'},
            {'expense_id': 'exp-c-2', 'category': 'fertilizer', 'amount_inr': 5500.0, 'date': '2025-07-02', 'note': 'NPK 19:19:19 & Micronutrients'},
            {'expense_id': 'exp-c-3', 'category': 'labour', 'amount_inr': 7500.0, 'date': '2025-09-15', 'note': 'Boll picking labour (3 rounds)'},
            {'expense_id': 'exp-c-4', 'category': 'transport', 'amount_inr': 2200.0, 'date': '2025-10-20', 'note': 'Mandi transport cartage'}
        ],
        'expected_sale_price_inr_per_quintal': 7200.0,
        'actual_sale_price_inr_per_quintal': 7450.0,
        'actual_yield_quintals': 18.0,
        'created_at': '2025-06-15 10:00:00',
        'updated_at': '2025-10-25 16:00:00'
    }
]

def create_crop_cycle(db, email: str, cycle_data: dict):
    """Create a new crop cycle."""
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
    
    if db is None:
        _FALLBACK_CYCLES.insert(0, doc)
        return doc
        
    try:
        db[CYCLES_COL].insert_one(doc)
        doc.pop('_id', None)
        return doc
    except Exception as e:
        print(f"❌ Error creating crop cycle: {e}")
        return None

def get_crop_cycles(db, email: str):
    """Retrieve all crop cycles for a user."""
    email_key = email.lower().strip()
    if db is None:
        return [dict(c) for c in _FALLBACK_CYCLES if c.get('email', '').lower() == email_key or email_key == 'demo@gmail.com']
        
    try:
        cursor = db[CYCLES_COL].find({'email': email_key}, {'_id': 0}).sort('created_at', -1)
        return list(cursor)
    except Exception as e:
        print(f"❌ Error fetching crop cycles: {e}")
        return []

def get_crop_cycle(db, cycle_id: str, email: str):
    """Retrieve a specific crop cycle."""
    email_key = email.lower().strip()
    if db is None:
        for c in _FALLBACK_CYCLES:
            if c.get('cycle_id') == cycle_id:
                return dict(c)
        return None
    return db[CYCLES_COL].find_one({'cycle_id': cycle_id, 'email': email_key}, {'_id': 0})

def update_crop_cycle(db, cycle_id: str, email: str, update_data: dict):
    """Update metadata of a crop cycle."""
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    update_doc = {'updated_at': now}
    
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
                    
    if db is None:
        for c in _FALLBACK_CYCLES:
            if c.get('cycle_id') == cycle_id:
                c.update(update_doc)
                return True
        return False
        
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
    
    if db is None:
        for c in _FALLBACK_CYCLES:
            if c.get('cycle_id') == cycle_id:
                c.setdefault('expenses', []).append(expense)
                c['updated_at'] = now
                return expense
        return None
        
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
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    if db is None:
        for c in _FALLBACK_CYCLES:
            if c.get('cycle_id') == cycle_id:
                c['expenses'] = [x for x in c.get('expenses', []) if x.get('expense_id') != expense_id]
                c['updated_at'] = now
                return True
        return False
        
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
