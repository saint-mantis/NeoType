# Generated by Django 5.2.4 on 2025-07-05 18:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('typing_test', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='textcontent',
            name='category',
            field=models.CharField(choices=[('common_words', 'Common Words'), ('programming', 'Programming'), ('literature', 'Literature'), ('technical', 'Technical'), ('business', 'Business'), ('science', 'Science'), ('poetry', 'Poetry'), ('news', 'News'), ('punctuation', 'Punctuation'), ('mixed_case', 'Mixed Case'), ('long_form', 'Long Form'), ('short_words', 'Short Words'), ('config', 'Configuration'), ('math', 'Mathematical'), ('email', 'Email'), ('mixed', 'Mixed'), ('pangram', 'Pangram')], db_index=True, default='common_words', max_length=20),
        ),
        migrations.AddField(
            model_name='textcontent',
            name='language',
            field=models.CharField(db_index=True, default='en', max_length=5),
        ),
        migrations.AlterField(
            model_name='textcontent',
            name='character_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='textcontent',
            name='difficulty',
            field=models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard'), ('expert', 'Expert')], db_index=True, max_length=10),
        ),
        migrations.AlterField(
            model_name='textcontent',
            name='word_count',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
