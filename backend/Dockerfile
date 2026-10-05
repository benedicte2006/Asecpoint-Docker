# Étape 1 : Construction du JAR avec Maven
# syntax=docker/dockerfile:1
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copie du dépôt Maven local de la machine hôte (pré-peuplé)
# Cela évite les téléchargements depuis Maven Central en cas d'absence de réseau
COPY .m2 /root/.m2

COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B -o 2>&1 || \
    mvn clean package -DskipTests -B 2>&1

# Étape 2 : Image d'exécution légère JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -S asecna && adduser -S asecna -G asecna
USER asecna

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
