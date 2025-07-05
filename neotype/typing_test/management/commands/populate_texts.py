from django.core.management.base import BaseCommand
from typing_test.models import TextContent

class Command(BaseCommand):
    help = 'Populate the database with sample typing test texts'

    def handle(self, *args, **options):
        texts = [
            {
                'title': 'The Quick Brown Fox',
                'content': 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once, making it perfect for typing practice.',
                'difficulty': 'easy',
                'category': 'pangram',
                'language': 'en'
            },
            {
                'title': 'Common Words Practice',
                'content': 'the and for are but not you all can had her was one our out day get has him his how man new now old see two way who boy did its let put say she too use',
                'difficulty': 'easy',
                'category': 'common_words',
                'language': 'en'
            },
            {
                'title': 'Programming Keywords',
                'content': 'function return if else for while loop array object string number boolean true false null undefined var let const class extends import export default async await',
                'difficulty': 'medium',
                'category': 'programming',
                'language': 'en'
            },
            {
                'title': 'JavaScript Code Sample',
                'content': 'const users = await fetch("/api/users").then(res => res.json()); for (let user of users) { if (user.isActive && user.role === "admin") { console.log(`Active admin: ${user.name}`); } }',
                'difficulty': 'hard',
                'category': 'programming',
                'language': 'en'
            },
            {
                'title': 'Literature Excerpt',
                'content': 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.',
                'difficulty': 'medium',
                'category': 'literature',
                'language': 'en'
            },
            {
                'title': 'Numbers and Symbols',
                'content': 'Password123! Email@domain.com $19.99 #hashtag 50% discount (555) 123-4567 www.example.org Version 2.1.0 API_KEY=abc123 PORT=3000',
                'difficulty': 'hard',
                'category': 'mixed',
                'language': 'en'
            },
            {
                'title': 'Technical Writing',
                'content': 'Modern web development requires understanding of HTML5, CSS3, and JavaScript ES6+. Frameworks like React, Vue, and Angular have revolutionized frontend development.',
                'difficulty': 'medium',
                'category': 'technical',
                'language': 'en'
            },
            {
                'title': 'Business Communication',
                'content': 'Dear valued customer, we are pleased to inform you that your order has been processed successfully. The estimated delivery date is within 3-5 business days.',
                'difficulty': 'easy',
                'category': 'business',
                'language': 'en'
            },
            {
                'title': 'Scientific Text',
                'content': 'The mitochondria are known as the powerhouses of the cell because they generate most of the chemical energy needed to power the cell\'s biochemical reactions.',
                'difficulty': 'medium',
                'category': 'science',
                'language': 'en'
            },
            {
                'title': 'Advanced Programming',
                'content': 'class DatabaseConnection { constructor(config) { this.pool = new Pool(config); } async query(sql, params = []) { const client = await this.pool.connect(); try { return await client.query(sql, params); } finally { client.release(); } } }',
                'difficulty': 'expert',
                'category': 'programming',
                'language': 'en'
            },
            {
                'title': 'Poetry Sample',
                'content': 'Two roads diverged in a yellow wood, And sorry I could not travel both And be one traveler, long I stood And looked down one as far as I could',
                'difficulty': 'easy',
                'category': 'poetry',
                'language': 'en'
            },
            {
                'title': 'News Article Style',
                'content': 'Breaking news: Scientists have discovered a new species of butterfly in the Amazon rainforest. The discovery was made during a recent expedition led by researchers from the University.',
                'difficulty': 'medium',
                'category': 'news',
                'language': 'en'
            },
            {
                'title': 'Punctuation Practice',
                'content': 'Hello! How are you today? I\'m fine, thanks. "Great," she said. It\'s 3:30 PM. Don\'t forget: milk, eggs, and bread. (Note: Call mom.) What\'s next?',
                'difficulty': 'medium',
                'category': 'punctuation',
                'language': 'en'
            },
            {
                'title': 'Mixed Case Challenge',
                'content': 'iPhone MacBook JavaScript TypeScript GitHub API JSON XML HTTP HTTPS URL CSS HTML SQL NoSQL MongoDB PostgreSQL React Vue Angular Node.js Express.js',
                'difficulty': 'hard',
                'category': 'mixed_case',
                'language': 'en'
            },
            {
                'title': 'Long Form Text',
                'content': 'In the rapidly evolving landscape of technology, artificial intelligence and machine learning have emerged as transformative forces. These technologies are reshaping industries, from healthcare and finance to transportation and entertainment. The ability to process vast amounts of data and extract meaningful insights has become crucial for organizations seeking competitive advantages in the digital age.',
                'difficulty': 'medium',
                'category': 'long_form',
                'language': 'en'
            },
            {
                'title': 'Short Bursts',
                'content': 'cat dog run jump fast slow big small hot cold light dark up down left right yes no good bad new old',
                'difficulty': 'easy',
                'category': 'short_words',
                'language': 'en'
            },
            {
                'title': 'Configuration File',
                'content': '{ "name": "neotype", "version": "1.0.0", "scripts": { "start": "node server.js", "dev": "nodemon app.js" }, "dependencies": { "express": "^4.18.0" } }',
                'difficulty': 'hard',
                'category': 'config',
                'language': 'en'
            },
            {
                'title': 'Mathematical Text',
                'content': 'The Pythagorean theorem states that a² + b² = c² where c is the hypotenuse. For example, if a = 3 and b = 4, then c = √(9 + 16) = √25 = 5.',
                'difficulty': 'medium',
                'category': 'math',
                'language': 'en'
            },
            {
                'title': 'Email Format',
                'content': 'Subject: Meeting Tomorrow Hi John, Just a quick reminder about our meeting tomorrow at 2 PM in Conference Room B. Please bring the quarterly reports. Best regards, Sarah',
                'difficulty': 'easy',
                'category': 'email',
                'language': 'en'
            },
            {
                'title': 'Complex Programming',
                'content': 'function debounce(func, wait, immediate) { let timeout; return function executedFunction(...args) { const later = () => { timeout = null; if (!immediate) func(...args); }; const callNow = immediate && !timeout; clearTimeout(timeout); timeout = setTimeout(later, wait); if (callNow) func(...args); }; }',
                'difficulty': 'expert',
                'category': 'programming',
                'language': 'en'
            }
        ]

        created_count = 0
        for text_data in texts:
            text_content, created = TextContent.objects.get_or_create(
                title=text_data['title'],
                defaults=text_data
            )
            if created:
                created_count += 1
                self.stdout.write(f"Created: {text_data['title']}")
            else:
                self.stdout.write(f"Already exists: {text_data['title']}")

        self.stdout.write(
            self.style.SUCCESS(f'Successfully populated {created_count} new texts. Total texts in database: {TextContent.objects.count()}')
        )