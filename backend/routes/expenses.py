"""
backend/routes/expenses.py
--------------------------
Expense and Profit Tracker endpoints.
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import io
from backend.models.expense import (
    create_crop_cycle, get_crop_cycles, get_crop_cycle,
    update_crop_cycle, add_expense, remove_expense, compute_cycle_summary
)
from backend.utils.report_generator import generate_pdf_report, generate_excel_report

expenses_bp = Blueprint('expenses', __name__)

def _get_db():
    return expenses_bp.db if hasattr(expenses_bp, 'db') else None

@expenses_bp.route('/api/crop-cycles', methods=['POST'])
@jwt_required()
def create_cycle():
    email = get_jwt_identity()
    db = _get_db()
    data = request.json or {}
    
    cycle = create_crop_cycle(db, email, data)
    if cycle:
        return jsonify({'status': 'success', 'cycle': cycle})
    return jsonify({'status': 'error', 'message': 'Failed to create crop cycle'}), 500

@expenses_bp.route('/api/crop-cycles', methods=['GET'])
@jwt_required()
def list_cycles():
    email = get_jwt_identity()
    db = _get_db()
    cycles = get_crop_cycles(db, email)
    
    # Compute summary for each cycle to include high-level totals in the list view
    for cycle in cycles:
        cycle['summary'] = compute_cycle_summary(cycle)
        
    return jsonify({'status': 'success', 'data': cycles})

@expenses_bp.route('/api/crop-cycles/<cycle_id>', methods=['GET'])
@jwt_required()
def get_cycle(cycle_id):
    email = get_jwt_identity()
    db = _get_db()
    
    cycle = get_crop_cycle(db, cycle_id, email)
    if not cycle:
        return jsonify({'status': 'error', 'message': 'Cycle not found'}), 404
        
    cycle['summary'] = compute_cycle_summary(cycle)
    return jsonify({'status': 'success', 'cycle': cycle})

@expenses_bp.route('/api/crop-cycles/<cycle_id>', methods=['PUT'])
@jwt_required()
def update_cycle(cycle_id):
    email = get_jwt_identity()
    db = _get_db()
    data = request.json or {}
    
    success = update_crop_cycle(db, cycle_id, email, data)
    if success:
        return jsonify({'status': 'success', 'message': 'Cycle updated'})
    return jsonify({'status': 'error', 'message': 'Failed to update cycle'}), 500

@expenses_bp.route('/api/crop-cycles/<cycle_id>/expenses', methods=['POST'])
@jwt_required()
def add_cycle_expense(cycle_id):
    email = get_jwt_identity()
    db = _get_db()
    data = request.json or {}
    
    expense = add_expense(db, cycle_id, email, data)
    if expense:
        return jsonify({'status': 'success', 'expense': expense})
    return jsonify({'status': 'error', 'message': 'Failed to add expense'}), 500

@expenses_bp.route('/api/crop-cycles/<cycle_id>/expenses/<expense_id>', methods=['DELETE'])
@jwt_required()
def remove_cycle_expense(cycle_id, expense_id):
    email = get_jwt_identity()
    db = _get_db()
    
    success = remove_expense(db, cycle_id, expense_id, email)
    if success:
        return jsonify({'status': 'success', 'message': 'Expense removed'})
    return jsonify({'status': 'error', 'message': 'Failed to remove expense'}), 500

@expenses_bp.route('/api/crop-cycles/<cycle_id>/summary', methods=['GET'])
@jwt_required()
def get_cycle_summary(cycle_id):
    email = get_jwt_identity()
    db = _get_db()
    
    cycle = get_crop_cycle(db, cycle_id, email)
    if not cycle:
        return jsonify({'status': 'error', 'message': 'Cycle not found'}), 404
        
    summary = compute_cycle_summary(cycle)
    return jsonify({'status': 'success', 'summary': summary})

@expenses_bp.route('/api/crop-cycles/<cycle_id>/report', methods=['GET'])
@jwt_required()
def download_report(cycle_id):
    email = get_jwt_identity()
    db = _get_db()
    fmt = request.args.get('format', 'pdf').lower()
    
    cycle = get_crop_cycle(db, cycle_id, email)
    if not cycle:
        return jsonify({'status': 'error', 'message': 'Cycle not found'}), 404
        
    summary = compute_cycle_summary(cycle)
    
    try:
        if fmt == 'xlsx':
            data = generate_excel_report(cycle, summary)
            return send_file(
                io.BytesIO(data),
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=f"CropCycle_{cycle_id[:8]}.xlsx"
            )
        else:
            data = generate_pdf_report(cycle, summary)
            return send_file(
                io.BytesIO(data),
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f"CropCycle_{cycle_id[:8]}.pdf"
            )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Failed to generate report: {e}'}), 500
