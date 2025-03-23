from django.db import migrations
from django.db.models import Count

def handle_duplicate_emails(apps, schema_editor):
    User = apps.get_model('users', 'User')
    # Find users with duplicate emails
    duplicates = (
        User.objects.values('email')
        .annotate(count=Count('id'))
        .filter(count__gt=1)
    )

    for duplicate in duplicates:
        email = duplicate['email']
        users = User.objects.filter(email=email).order_by('date_joined')
        
        # Keep the first one unchanged, modify others
        for i, user in enumerate(users[1:], 1):
            user.email = f"{user.email.split('@')[0]}+{i}@{user.email.split('@')[1]}"
            user.save()

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(handle_duplicate_emails),
    ]
