"""
backend/utils/fertilizer_reference.py
-------------------------------------
Static reference table for fertilizer requirements (NPK kg/acre) based on 
crop and growth stage, derived from general ICAR extension guidelines.

Not a substitute for actual soil testing, but provides a baseline for planning.
"""

from backend.config import Config

# Dictionary mapping crop -> stage -> {N_kg, P_kg, K_kg} per acre
FERTILIZER_REQUIREMENTS = {
    'cotton': {
        'sowing': {'N_kg': 20, 'P_kg': 20, 'K_kg': 20},
        'vegetative': {'N_kg': 20, 'P_kg': 0, 'K_kg': 0},
        'flowering': {'N_kg': 10, 'P_kg': 0, 'K_kg': 10},
        'fruiting': {'N_kg': 0, 'P_kg': 0, 'K_kg': 0}
    },
    'wheat': {
        'sowing': {'N_kg': 25, 'P_kg': 25, 'K_kg': 16},
        'vegetative': {'N_kg': 25, 'P_kg': 0, 'K_kg': 0},
        'flowering': {'N_kg': 0, 'P_kg': 0, 'K_kg': 0},
        'fruiting': {'N_kg': 0, 'P_kg': 0, 'K_kg': 0}
    },
    'rice': {
        'sowing': {'N_kg': 20, 'P_kg': 24, 'K_kg': 16},
        'vegetative': {'N_kg': 20, 'P_kg': 0, 'K_kg': 0},
        'flowering': {'N_kg': 10, 'P_kg': 0, 'K_kg': 0},
        'fruiting': {'N_kg': 0, 'P_kg': 0, 'K_kg': 0}
    },
    # Default fallback for unlisted crops
    'default': {
        'sowing': {'N_kg': 20, 'P_kg': 20, 'K_kg': 20},
        'vegetative': {'N_kg': 20, 'P_kg': 0, 'K_kg': 0},
        'flowering': {'N_kg': 10, 'P_kg': 0, 'K_kg': 0},
        'fruiting': {'N_kg': 0, 'P_kg': 0, 'K_kg': 0}
    }
}

def calculate_fertilizer(crop: str, land_area_acres: float, growth_stage: str, soil_test: dict = None):
    """
    Calculate fertilizer quantities and cost estimate.
    
    Args:
        crop: string (e.g. 'cotton')
        land_area_acres: float
        growth_stage: string ('sowing', 'vegetative', 'flowering', 'fruiting')
        soil_test: optional dict with override values {'N': float, 'P': float, 'K': float}
    """
    crop_key = crop.lower() if crop.lower() in FERTILIZER_REQUIREMENTS else 'default'
    stage_key = growth_stage.lower() if growth_stage.lower() in FERTILIZER_REQUIREMENTS[crop_key] else 'sowing'
    
    req = FERTILIZER_REQUIREMENTS[crop_key][stage_key]
    
    n_kg_per_acre = req['N_kg']
    p_kg_per_acre = req['P_kg']
    k_kg_per_acre = req['K_kg']
    
    # Apply soil test adjustments if provided (simple scaling, if soil test indicates deficiency)
    # For now, we'll just treat the soil test as absolute overrides if they exist
    if soil_test:
        if 'N' in soil_test and soil_test['N'] is not None:
            n_kg_per_acre = float(soil_test['N'])
        if 'P' in soil_test and soil_test['P'] is not None:
            p_kg_per_acre = float(soil_test['P'])
        if 'K' in soil_test and soil_test['K'] is not None:
            k_kg_per_acre = float(soil_test['K'])
            
    total_n_kg = n_kg_per_acre * land_area_acres
    total_p_kg = p_kg_per_acre * land_area_acres
    total_k_kg = k_kg_per_acre * land_area_acres
    
    # Convert NPK elemental kg to commercial fertilizer bulk kg
    # Urea is ~46% N
    urea_kg = total_n_kg / 0.46 if total_n_kg > 0 else 0
    # DAP is ~46% P, ~18% N (we'll ignore the N contribution here for simplicity of estimate)
    dap_kg = total_p_kg / 0.46 if total_p_kg > 0 else 0
    # MOP is ~60% K
    mop_kg = total_k_kg / 0.60 if total_k_kg > 0 else 0
    
    # Calculate costs
    cost = (
        urea_kg * Config.FERT_COST_N_PER_KG +
        dap_kg * Config.FERT_COST_P_PER_KG +
        mop_kg * Config.FERT_COST_K_PER_KG
    )
    
    # Schedule string
    schedule_map = {
        'sowing': "Apply as basal dose during sowing/transplanting.",
        'vegetative': "Apply as first top-dressing (approx. 25-30 days after sowing).",
        'flowering': "Apply as second top-dressing before flowering stage.",
        'fruiting': "Late stage application usually not required unless deficiency is severe."
    }
    
    return {
        "N_kg": round(total_n_kg, 1),
        "P_kg": round(total_p_kg, 1),
        "K_kg": round(total_k_kg, 1),
        "urea_kg": round(urea_kg, 1),
        "dap_kg": round(dap_kg, 1),
        "mop_kg": round(mop_kg, 1),
        "estimated_cost_inr": round(cost, 0),
        "application_schedule": schedule_map.get(stage_key, ""),
        "disclaimer": "Estimate based on ICAR guidelines. Actual requirement may vary with soil test results."
    }
