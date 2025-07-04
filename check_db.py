#!/usr/bin/env python3
import sqlite3
from datetime import datetime
import pytz

conn = sqlite3.connect('simulation.db')
cursor = conn.cursor()

cursor.execute('SELECT id, title, call_type, scheduled_at, status FROM calls ORDER BY id')
calls = cursor.fetchall()

print(f'Total calls in database: {len(calls)}')
ist = pytz.timezone('Asia/Kolkata')
for call in calls:
    call_id, title, call_type, scheduled_at, status = call
    # Convert UTC to IST if scheduled_at is not None
    if scheduled_at:
        try:
            utc_time = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
            ist_time = utc_time.astimezone(ist)
            time_display = ist_time.strftime('%Y-%m-%d %H:%M:%S IST')
        except:
            time_display = scheduled_at
    else:
        time_display = "No time set"
    print(f'ID: {call_id}, Title: "{title}", Type: {call_type}, Time: {time_display}, Status: {status}')

conn.close()
