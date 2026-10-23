FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma and libc6-compat
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

# Script to generate client, apply db schema, seed and start dev server
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run prisma:seed && npm run dev"]
