FROM node:20-alpine

WORKDIR /app

# Copy only package files first (better caching)
COPY package.json package-lock.json* ./

# Install deps
RUN npm install

# Copy rest of the source code
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Run Vite in container with --host enabled
CMD ["npm", "run", "dev", "--", "--host"]
