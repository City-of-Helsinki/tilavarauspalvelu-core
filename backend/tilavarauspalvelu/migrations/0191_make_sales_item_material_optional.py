import django.core.validators
import tilavarauspalvelu.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tilavarauspalvelu', '0190_add_price_option_to_reservation'),
    ]

    operations = [
        migrations.AlterField(
            model_name='salesitem',
            name='material',
            field=models.CharField(blank=True, default='', max_length=8, validators=[django.core.validators.MinLengthValidator(8), tilavarauspalvelu.validators.is_numeric]),
        ),
        migrations.AddConstraint(
            model_name='salesitem',
            constraint=models.UniqueConstraint(condition=models.Q(('material', ''), _negated=True), fields=('material',), name='sales_item_unique_material', violation_error_message='Another sales item already has this material'),
        ),
    ]
