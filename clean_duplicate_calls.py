#!/usr/bin/env python3
"""
Clean up duplicate calls and remove test/mock data from the database
"""

import sqlite3
from datetime import datetime

def clean_duplicate_calls():
    """Remove duplicate calls and test data from the database"""
    
    # Connect to the database
    conn = sqlite3.connect('simulation.db')
    cursor = conn.cursor()
    
    try:
        # Get all calls
        cursor.execute("SELECT id, title, call_type, scheduled_at, status FROM calls ORDER BY id")
        calls = cursor.fetchall()
        
        print(f"Total calls found: {len(calls)}")
        
        # Identify calls to delete
        calls_to_delete = []
        
        for call in calls:
            call_id, title, call_type, scheduled_at, status = call
            
            # Delete calls with empty titles (likely test data)
            if not title or title.strip() == "":
                calls_to_delete.append(call_id)
                print(f"Will delete call ID {call_id}: Empty title - '{title}'")
            
            # Delete obvious test calls
            elif any(test_phrase in (title or "").lower() for test_phrase in [
                "test", "backend test", "mock", "dummy", "sample"
            ]):
                calls_to_delete.append(call_id)
                print(f"Will delete call ID {call_id}: Test call - '{title}'")
        
        # Group remaining calls by scheduled_at and title to find duplicates
        cursor.execute("""
            SELECT title, scheduled_at, COUNT(*) as count, GROUP_CONCAT(id) as ids
            FROM calls 
            WHERE id NOT IN ({})
            GROUP BY title, scheduled_at 
            HAVING COUNT(*) > 1
        """.format(','.join(map(str, calls_to_delete)) if calls_to_delete else '0'))
        
        duplicate_groups = cursor.fetchall()
        
        for group in duplicate_groups:
            title, scheduled_at, count, ids = group
            id_list = [int(x) for x in ids.split(',')]
            # Keep the first one, delete the rest
            duplicates_to_delete = id_list[1:]
            calls_to_delete.extend(duplicates_to_delete)
            print(f"Found {count} duplicates for '{title}' at {scheduled_at}: keeping {id_list[0]}, deleting {duplicates_to_delete}")
        
        if calls_to_delete:
            print(f"\nDeleting {len(calls_to_delete)} calls...")
            
            # Delete the calls
            for call_id in calls_to_delete:
                # Delete related data first
                cursor.execute("DELETE FROM call_participants WHERE call_id = ?", (call_id,))
                cursor.execute("DELETE FROM call_messages WHERE call_id = ?", (call_id,))
                cursor.execute("DELETE FROM call_emotions WHERE call_id = ?", (call_id,))
                cursor.execute("DELETE FROM calls WHERE id = ?", (call_id,))
                print(f"Deleted call ID: {call_id}")
            
            # Commit changes
            conn.commit()
            print("Database cleanup completed!")
        else:
            print("No calls to delete.")
        
        # Show remaining calls
        cursor.execute("SELECT id, title, call_type, scheduled_at, status FROM calls ORDER BY scheduled_at")
        remaining_calls = cursor.fetchall()
        
        print(f"\nRemaining calls ({len(remaining_calls)}):")
        for call in remaining_calls:
            call_id, title, call_type, scheduled_at, status = call
            title_display = title if title else "[No Title]"
            print(f"ID: {call_id}, Title: '{title_display}', Type: {call_type}, Time: {scheduled_at}, Status: {status}")
        
    except Exception as e:
        print(f"Error cleaning database: {e}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == "__main__":
    clean_duplicate_calls()
