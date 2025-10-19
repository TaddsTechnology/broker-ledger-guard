// Backend Configuration
// Copy this to .env file in the backend directory

module.exports = {
  // PostgreSQL Database Configuration
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'password', // Change this to your PostgreSQL password
  POSTGRES_DB: 'postgres', // Change this if you created a specific database
  
  // Server Configuration
  PORT: '3001',
  
  // Example for a dedicated database:
  // POSTGRES_DB: 'broker_erp',
};
