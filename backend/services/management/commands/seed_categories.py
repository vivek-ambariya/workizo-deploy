from django.core.management.base import BaseCommand
from services.models import ServiceCategory

class Command(BaseCommand):
    help = 'Seeds the database with default service categories'

    def handle(self, *args, **kwargs):
        categories = [
            'Electrician',
            'Plumber',
            'Carpenter',
            'AC Technician',
            'Mechanic',
            'Home Cleaning'
        ]
        
        for name in categories:
            obj, created = ServiceCategory.objects.get_or_create(name=name)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Category '{name}' created successfully."))
            else:
                self.stdout.write(self.style.WARNING(f"Category '{name}' already exists."))
