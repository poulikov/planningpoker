# Deploy Planning Poker on VPS/VM

Этот гайд поможет развернуть Planning Poker на VPS или VM с использованием Docker Compose.

## Требования

- Docker и Docker Compose установлены на сервере
- Доступ к порту 80 (или измените порт в docker-compose.yml)

## Быстрый старт

1. **Клонируйте репозиторий на сервер:**
```bash
git clone <repository-url>
cd planningpoker
```

2. **Настройте переменные окружения (опционально):**
```bash
cp .env.example .env
# Отредактируйте .env при необходимости
```

3. **Запустите приложение:**
```bash
docker-compose up -d
```

4. **Проверьте статус:**
```bash
docker-compose ps
```

5. **Откройте приложение в браузере:**
```
http://<IP-адрес-сервера>
```

## Команды управления

```bash
# Просмотр логов
docker-compose logs -f

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Полное удаление с данными (осторожно!)
docker-compose down -v
```

## Обновление приложения

```bash
# Получить последние изменения
git pull

# Пересобрать и перезапустить
docker-compose down
docker-compose up -d --build
```

## Архитектура

```
┌─────────────┐
│   Пользователь  │
└──────┬──────┘
       │ HTTP (порт 80)
       ▼
┌─────────────┐
│     Nginx       │  ← Reverse Proxy + Static Files
│   (порт 80)    │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌──────┐ ┌─────────┐
│Frontend│ │ Backend │  ← API + WebSocket
│(статика)│ │(порт 3001)│
└──────┘ └────┬────┘
              │
              ▼
         ┌─────────┐
         │ PostgreSQL│  ← База данных
         │(порт 5432)│
         └─────────┘
```

## Настройка домена (опционально)

Если хотите использовать домен вместо IP:

1. Настройте DNS A-запись на IP сервера
2. Обновите `nginx/nginx.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # ← замените на ваш домен
    # ...
}
```

3. Перезапустите:
```bash
docker-compose restart nginx
```

## HTTPS с Let's Encrypt (опционально)

Для production рекомендуется настроить HTTPS. Можно использовать:
- [Certbot](https://certbot.eff.org/) с standalone режимом
- [Nginx Proxy Manager](https://nginxproxymanager.com/)
- [Traefik](https://traefik.io/)

### Пример с Certbot:

```bash
# 1. Обновите nginx/nginx-ssl.conf - замените your-domain.com на ваш домен

# 2. Создайте директорию для certbot
mkdir -p certbot/www

# 3. Получите сертификат (временно запустите nginx для валидации)
sudo docker run -d -p 80:80 \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  --name temp-nginx nginx:alpine

# 4. Установите certbot
sudo apt install certbot

# 5. Получите сертификат
sudo certbot certonly --webroot \
  -w $(pwd)/certbot/www \
  -d your-domain.com

# 6. Остановите временный nginx
sudo docker stop temp-nginx && sudo docker rm temp-nginx

# 7. Обновите docker-compose.yml для монтирования сертификатов
# Добавьте в секцию nginx:
#   volumes:
#     - /etc/letsencrypt:/etc/letsencrypt:ro
#     - ./certbot/www:/var/www/certbot:ro

# 8. Замените конфигурацию nginx
sudo cp nginx/nginx-ssl.conf nginx/nginx.conf

# 9. Перезапустите
sudo docker-compose up -d --build nginx
```

### Автоматическое обновление сертификатов

Добавьте в crontab:
```bash
0 3 * * * certbot renew --quiet --deploy-hook "docker-compose -f /path/to/docker-compose.yml restart nginx"
```

## Troubleshooting

### Контейнеры не запускаются
```bash
# Проверьте логи
docker-compose logs

# Проверьте занятость порта 80
sudo netstat -tlnp | grep 80
```

### Проблемы с базой данных
```bash
# Пересоздать базу данных (ВНИМАНИЕ: все данные будут удалены!)
docker-compose down -v
docker-compose up -d
```

### Frontend не подключается к backend
Убедитесь, что используется относительный путь в конфигурации (`config.apiBaseUrl` должен быть пустым в production).
