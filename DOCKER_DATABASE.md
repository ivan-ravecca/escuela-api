# MariaDB Guide with Docker

## 🐳 Start the Database

### 1. Start the container

```bash
docker-compose up -d
```

This will create and start:
- MariaDB 11.2 container
- Database: `escuela`
- User: `{USER}` with password: `{PASSWORD}`
- Exposed port: `3306`
- Persistent volume for data

### 2. Check that it is running

```bash
docker-compose ps
```

### 3. View the logs

```bash
docker-compose logs -f mariadb
```

### 4. Populate the database with courses

```bash
npm run seed:dev
```

---

## 🔧 Useful Commands

### Stop the container

```bash
docker-compose stop
```

### Restart the container

```bash
docker-compose restart
```

### Remove the container (keeps data)

```bash
docker-compose down
```

### Remove the container AND the data

```bash
docker-compose down -v
```

## 📚 Additional Documentation

- [README.md](./README.md) - Main project documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and diagrams
- [ASSISTANT_README.md](./ASSISTANT_README.md) - AI Assistant technical guide