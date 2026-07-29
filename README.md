# School Backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Update the values in `.env` for your local environment.
4. Start the server:
   ```bash
   npm run dev
   ```

## Notes

- Do not commit your real `.env` file.
- Keep secrets such as `JWT_SECRET` and database credentials out of version control.
