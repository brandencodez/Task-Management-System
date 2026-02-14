const db = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Running migration: Adding bio and date_of_birth fields...');

    // Add columns to admins table
    console.log('📝 Adding columns to admins table...');
    try {
      await db.execute(
        `ALTER TABLE admins ADD COLUMN bio TEXT NULL, ADD COLUMN date_of_birth DATE NULL`
      );
      console.log('✅ Successfully added bio and date_of_birth to admins table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Columns already exist in admins table, skipping...');
      } else {
        throw err;
      }
    }

    // Add columns to employees table
    console.log('📝 Adding columns to employees table...');
    try {
      await db.execute(
        `ALTER TABLE employees ADD COLUMN bio TEXT NULL, ADD COLUMN date_of_birth DATE NULL`
      );
      console.log('✅ Successfully added bio and date_of_birth to employees table');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Columns already exist in employees table, skipping...');
      } else {
        throw err;
      }
    }

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
