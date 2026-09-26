#!/usr/bin/env python3
"""Run FTS migration against Supabase database."""

import psycopg2
from psycopg2.extras import RealDictCursor
import sys

DATABASE_URL = "postgresql://postgres:tharunkumar2004@db.ectvnyrdohctcpwblqgl.supabase.co:5432/postgres"

def run_migration():
    with open("docs/fts-migration.sql", "r") as f:
        sql = f.read()
    
    # Split by semicolon and execute each statement
    statements = [s.strip() for s in sql.split(";") if s.strip() and not s.strip().startswith("--")]
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    for i, stmt in enumerate(statements):
        try:
            print(f"Executing statement {i+1}/{len(statements)}...")
            cur.execute(stmt)
            print(f"  OK")
        except Exception as e:
            print(f"  ERROR: {e}")
            print(f"  Statement: {stmt[:200]}...")
            # Continue with other statements
    
    cur.close()
    conn.close()
    print("\nMigration completed!")

if __name__ == "__main__":
    run_migration()