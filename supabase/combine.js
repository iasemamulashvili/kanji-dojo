const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

let finalSql = `-- =====================================================================
-- KANJI DOJO UNIFIED SCHEMA
-- This file contains all migrations combined, with IF NOT EXISTS safeguards.
-- Run this securely in the Supabase SQL Editor.
-- =====================================================================\n\n`;

for(const f of files) {
  finalSql += `-- ==========================================\n`;
  finalSql += `-- Migration: ${f}\n`;
  finalSql += `-- ==========================================\n\n`;
  let sql = fs.readFileSync(path.join(dir, f), 'utf-8');
  
  // Safely prepend 'IF NOT EXISTS' to CREATE TABLE
  // Replace: CREATE TABLE foo (
  // With: CREATE TABLE IF NOT EXISTS foo (
  sql = sql.replace(/CREATE TABLE\s+(?!IF NOT EXISTS\s+)([\w_]+)/gi, 'CREATE TABLE IF NOT EXISTS $1');
  
  // Replace: CREATE INDEX idx_name ON table
  // With: CREATE INDEX IF NOT EXISTS idx_name ON table
  sql = sql.replace(/CREATE INDEX\s+(?!IF NOT EXISTS\s+)([\w_]+)\s+ON/gi, 'CREATE INDEX IF NOT EXISTS $1 ON');
  
  // Replace: ALTER TABLE x ADD COLUMN y
  // With: ALTER TABLE x ADD COLUMN IF NOT EXISTS y
  sql = sql.replace(/ADD COLUMN\s+(?!IF NOT EXISTS\s+)([\w_]+)/gi, 'ADD COLUMN IF NOT EXISTS $1');
  
  // Replace: CREATE POLICY name ON
  // We can't trivially add IF NOT EXISTS to POLICY before PG 12, but we can wrap it in an anonymous block or just let it error.
  // Actually, Supabase uses PG 15+, which doesn't have CREATE POLICY IF NOT EXISTS (or wait, does it? PG does not have CREATE POLICY IF NOT EXISTS).
  // Better to DROP POLICY IF EXISTS before CREATE POLICY.
  sql = sql.replace(/CREATE POLICY\s+"([^"]+)"\s+ON\s+([\w_]+)/gi, (match, pName, tName) => {
      return `DROP POLICY IF EXISTS "${pName}" ON ${tName};\n${match}`;
  });
  
  finalSql += sql + '\n\n';
}

fs.writeFileSync(path.join(__dirname, 'unified_schema.sql'), finalSql);
console.log('Successfully wrote unified migration to supabase/unified_schema.sql');
