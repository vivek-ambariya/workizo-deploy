"""
Configurable service durations and backend constants for estimated service timelines.
"""

SERVICE_DURATIONS = {
    'AC Technician': 30,
    'Electrician': 45,
    'Plumber': 40,
    'Carpenter': 60,
    'Painter': 120,
    'Cleaning': 90,
    'Mechanic': 45,
}

DEFAULT_SERVICE_DURATION = 45


def get_service_duration(category_name: str) -> int:
    """
    Returns the estimated service duration in minutes for a given service category name.
    """
    if not category_name:
        return DEFAULT_SERVICE_DURATION
    
    # Try exact match first
    if category_name in SERVICE_DURATIONS:
        return SERVICE_DURATIONS[category_name]
    
    # Try case-insensitive matching
    for name, duration in SERVICE_DURATIONS.items():
        if name.lower() == category_name.lower():
            return duration
            
    return DEFAULT_SERVICE_DURATION
