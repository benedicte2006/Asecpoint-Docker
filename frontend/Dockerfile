# Étape 1 : Build de l'application Angular
FROM node:20-alpine AS build
WORKDIR /app
# Configuration npm : timeout étendu + retries pour réseau lent
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 600000
COPY package*.json ./
RUN npm install --prefer-offline || npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur Nginx léger pour les fichiers statiques
FROM nginx:1.25-alpine
COPY --from=build /app/dist/asecna-pointage-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
