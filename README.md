# Broker ERP System

A comprehensive broker ERP system built with React, Express.js, and PostgreSQL.

## Quick Start

### 1. Database Setup
Run the database setup script:
```bash
setup-database.bat
```
This will:
- Configure your PostgreSQL connection
- Create the necessary database schema
- Set up environment variables

### 2. Start Application
Run the application launcher:
```bash
start-application.bat
```
This will:
- Install all dependencies
- Start the backend API server (port 3001)
- Start the frontend development server (port 5173)

### 3. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Login**: username: `admin`, password: `admin`

## Manual Setup (Alternative)

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
# Create .env file with your database credentials
npm start
```

### Frontend Setup
```bash
npm install
npm run dev
```

## Database Configuration

The application uses PostgreSQL. Update `backend/.env` with your database credentials:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=postgres
```

## Features

- **Company Master**: Manage listed companies and NSE codes
- **Party Master**: Manage trading parties and their configurations
- **Settlement Master**: Manage settlement periods and configurations
- **Responsive UI**: Modern, keyboard-friendly interface
- **Real-time Updates**: Live data synchronization

## API Endpoints

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Parties
- `GET /api/parties` - Get all parties
- `POST /api/parties` - Create new party
- `PUT /api/parties/:id` - Update party
- `DELETE /api/parties/:id` - Delete party

### Settlements
- `GET /api/settlements` - Get all settlements
- `POST /api/settlements` - Create new settlement
- `PUT /api/settlements/:id` - Update settlement
- `DELETE /api/settlements/:id` - Delete settlement

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check credentials in `backend/.env`
   - Verify database exists

2. **Port Already in Use**
   - Backend uses port 3001
   - Frontend uses port 5173
   - Change ports in configuration if needed

3. **CORS Issues**
   - Backend is configured to allow frontend requests
   - Check that both servers are running

### Reset Database
Login with password `nimda` to reset all data (development only).

## Development

### Project Structure
```
├── backend/           # Express.js API server
├── src/              # React frontend
├── public/           # Static assets
├── database-schema.sql # Database schema
└── start-application.bat # Application launcher
```

### Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **API**: RESTful API with JSON responses

## License

This project is for internal use only.