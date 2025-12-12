# Guía de MariaDB con Docker

## 🐳 Levantar la base de datos

### 1. Iniciar el contenedor

```bash
docker-compose up -d
```

Esto creará y levantará:
- Contenedor MariaDB 11.2
- Base de datos: `escuela`
- Usuario: `{USER}` con password: `{PASSWORD}`
- Puerto expuesto: `3306`
- Volumen persistente para los datos

### 2. Verificar que está corriendo

```bash
docker-compose ps
```

### 3. Ver los logs

```bash
docker-compose logs -f mariadb
```

### 4. Poblar la base de datos con los cursos

```bash
npm run seed:dev
```

---

## 🔧 Comandos útiles

### Detener el contenedor

```bash
docker-compose stop
```

### Reiniciar el contenedor

```bash
docker-compose restart
```

### Eliminar el contenedor (mantiene los datos)

```bash
docker-compose down
```

### Eliminar el contenedor Y los datos

```bash
docker-compose down -v
```