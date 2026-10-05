# Application Web de Pointage & Cahier de Marche ASECNA

Système de pointage sans contact 100% automatique par QR Code dynamique et WebSockets STOMP, avec journal de bord opérationnel (Cahier de Marche) et contrôle d'accès basé sur les rôles (RBAC).

---

## Architecture Globale & Flux de Données

```
+-----------------------------------------------------------------------------------+
|                                 TERMINAL CLIENT                                   |
|                                                                                   |
|  [Écran Borne Accueil]                          [Smartphone Opérateur]            |
|   - Affichage QR dynamique                       - Détection instantanée Caméra   |
|   - Écoute STOMP /topic/borne/{id}               - Requête POST auto sans clic    |
|   - Notification sonore & visuelle               - Affichage confirmation         |
+--------------------------+---------------------------------+----------------------+
                           |                                 |
                           | HTTP / WS                       | HTTP POST /scan
                           v                                 v
+-----------------------------------------------------------------------------------+
|                        REVERSE PROXY / GATEWAY (NGINX)                            |
|                          - Port 80 (HTTP / WebSocket)                             |
|                          - Routage /api, /ws, / vers conteneurs                   |
+-----------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                     BACKEND SPRING BOOT 3 (JAVA 17)                               |
|                                                                                   |
|  [PointageService]       [QrSessionService]     [CahierDeMarcheService]           |
|   - Validation Token      - Rotation 60s         - Traçabilité des quarts         |
|   - Anti-rejeu            - Tokens éphémères     - Rôles RBAC stricts             |
|                                                                                   |
|  [WebSocket STOMP Broker]                                                         |
|   - Diffusion instantanée de l'événement de pointage                              |
+-----------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        BASE DE DONNÉES (MYSQL 8.0)                                |
|  - Tables: users, unites, pointages, cahier_de_marche                             |
+-----------------------------------------------------------------------------------+
```

---

## Stack Technologique

* **Backend** : Java 17 / Spring Boot 3 / Spring Security (JWT) / WebSocket STOMP & SockJS / Spring Data JPA
* **Frontend** : Angular 17+ (Standalone Components, RxJS, STOMP.js, QRCode Canvas, Web Audio API, SVG Icons)
* **Base de données** : MySQL 8.0 (Persistance des pointages, unités, agents et notes opérationnelles)
* **Conteneurisation** : Docker & Docker Compose
* **Routage & Reverse Proxy** : Nginx (gestion des websockets `Upgrade: websocket`)

---

## Matrice des Droits & Rôles (RBAC)

| Fonctionnalité / Action | Rôle AGENT | Rôle ADMINISTRATEUR | Description / Règles de Gestion |
|---|---|---|---|
| **Pointage Automatique Instantané** | [ACCORDÉ] | [ACCORDÉ] | Validation en un millième de seconde au scan QR (Zéro-Clic) |
| **Historique Personnel de Pointage** | [ACCORDÉ] | [ACCORDÉ] | Consultation de ses propres horodatages |
| **Cahier de Marche - Consultation** | [ACCORDÉ] | [ACCORDÉ] | Lecture des événements, consignes et relèves de quart |
| **Cahier de Marche - Rédaction** | [ACCORDÉ] | [ACCORDÉ] | Création de nouvelles entrées signées électroniquement |
| **Cahier de Marche - Modification** | [REFUSÉ] | [ACCORDÉ] | Réservé à l'administration pour garantir l'intégrité |
| **Cahier de Marche - Suppression** | [REFUSÉ] | [ACCORDÉ] | Réservé à l'administration |
| **Supervision Globale des Pointages**| [REFUSÉ] | [ACCORDÉ] | Journal central de tous les émargements et adresses IP |
| **Gestion des Agents & Utilisateurs** | [REFUSÉ] | [ACCORDÉ] | Création, affectation et révocation d'utilisateurs |
| **Gestion des Unités & Services** | [REFUSÉ] | [ACCORDÉ] | Configuration des structures opérationnelles (TWR, CNS, MET) |

---

## Démarrage Rapide avec Docker Compose

### 1. Lancement de l'application
```bash
docker compose up -d --build
```

### 2. Accès aux interfaces
* **Application Web** : [http://localhost](http://localhost)
* **Borne d'accueil (Grand écran)** : [http://localhost/borne](http://localhost/borne)
* **Cahier de marche** : [http://localhost/cahier-de-marche](http://localhost/cahier-de-marche)
* **Console d'administration** : [http://localhost/admin](http://localhost/admin)

---

## Comptes de Démonstration Préconfigurés

| Profil | Identifiant | Mot de passe | Rôle | Unité / Fonction |
|---|---|---|---|---|
| **Administrateur** | `admin` | `adminpassword123` | `ROLE_ADMIN` | Chef de Centre |
| **Agent Tour** | `agent.twr` | `agent123` | `ROLE_AGENT` | Tour de Contrôle & Approche |
| **Agent CNS** | `agent.cns` | `agent123` | `ROLE_AGENT` | Maintenance CNS / Radar |
| **Agent Météo** | `agent.met` | `agent123` | `ROLE_AGENT` | Centre Météorologique |

---

## Procédure de Test avec Smartphone (Ngrok ou Réseau Local)

Pour tester le pointage réel depuis l'objectif photo d'un smartphone connecté en 4G/WiFi :

### Option A : Avec Ngrok (Recommandé)
1. Démarrez un tunnel Ngrok vers le port 80 de Nginx :
   ```bash
   ngrok http 80
   ```
2. Récupérez l'URL HTTPS fournie par Ngrok (ex: `https://votre-tunnel.ngrok-free.app`).
3. Créez un fichier `.env` ou définissez la variable `APP_BASE_URL` :
   ```bash
   echo "APP_BASE_URL=https://votre-tunnel.ngrok-free.app" > .env
   ```
4. Relancez les conteneurs :
   ```bash
   docker compose up -d
   ```
5. Ouvrez `https://votre-tunnel.ngrok-free.app/borne` sur votre écran de PC.
6. Connectez-vous d'abord une fois sur votre téléphone à `https://votre-tunnel.ngrok-free.app/login` avec l'un des comptes agents (ex: `agent.twr` / `agent123`).
7. Scannez le QR code affiché sur l'écran avec votre smartphone : **le pointage s'effectue instantanément dès l'ouverture du lien**, la borne réagit aussitôt avec le message de bienvenue et le carillon sonore.

### Option B : Via l'adresse IP Locale (Wi-Fi partagé)
Si votre PC et votre smartphone sont sur le même réseau Wi-Fi :
1. Trouvez l'IP de votre PC (ex: `192.168.1.50`).
2. Définissez `APP_BASE_URL=http://192.168.1.50` dans le fichier `.env`.
3. Si l'adresse IP du PC change, mettez à jour `APP_BASE_URL` dans `.env` avec la nouvelle IP accessible depuis les téléphones.
4. Recréez le conteneur backend pour appliquer la configuration :
   ```bash
   docker compose up -d --force-recreate backend
   ```
5. Ouvrez la borne avec cette même adresse (par exemple `http://192.168.1.50/borne`) ou utilisez `localhost` sur le PC ; dans ce dernier cas, le QR utilisera `APP_BASE_URL`.
