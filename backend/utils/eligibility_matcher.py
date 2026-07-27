"""
backend/utils/eligibility_matcher.py
------------------------------------
Pure function for matching a farmer profile against a scheme's criteria.
"""

def check_eligibility(farmer_profile: dict, scheme: dict) -> bool:
    """
    Check if a farmer profile matches the scheme's eligibility criteria.
    This is a heuristic filter, not a verification.
    """
    eligibility = scheme.get('eligibility', {})
    if not eligibility:
        return True  # If no criteria specified, assume eligible
    
    # 1. State matching
    allowed_states = eligibility.get('states', [])
    farmer_state = farmer_profile.get('state')
    
    if allowed_states and farmer_state:
        # If states are specified, the farmer must be in one of them
        # Case insensitive match
        allowed_states_lower = [s.lower() for s in allowed_states]
        if farmer_state.lower() not in allowed_states_lower:
            return False

    # 2. Land area matching
    max_land = eligibility.get('max_land_area')
    farmer_land = farmer_profile.get('land_area_acres')
    
    if max_land is not None and farmer_land is not None:
        try:
            if float(farmer_land) > float(max_land):
                return False
        except (ValueError, TypeError):
            pass # If invalid data, ignore this filter
            
    # 3. Crop matching
    allowed_crops = eligibility.get('crops', [])
    farmer_crops = farmer_profile.get('preferred_crops', [])
    
    if allowed_crops and farmer_crops:
        allowed_crops_lower = [c.lower() for c in allowed_crops]
        farmer_crops_lower = [c.lower() for c in farmer_crops]
        
        # Check if the farmer grows ANY of the allowed crops
        has_matching_crop = any(crop in allowed_crops_lower for crop in farmer_crops_lower)
        if not has_matching_crop:
            return False
            
    return True
