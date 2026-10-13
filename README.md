# Reservation System

## 1. 📌 О проекте

**Reservation System** — backend-система бронирования для северной части.  
Проект построен с нуля на чистом **Node.js + TypeScript** без использования Express или NestJS.

Архитектура ориентирована на:

- безопасность
- строгую типизацию
- модульность
- контроль ролей
- production-ready инфраструктуру

Система включает аутентификацию, управление бронированиями и персональными даннами, заказами, платежами и отзывами.

---

## Инициализация проекта

### Docker + Makefile

#### Шаг 1

Установите зависимости:

```bash
bun install # или npm install
```

#### Шаг 2

Скопируйте пример файла окружения и настройте переменные (при необходимости):

```bash
cp .env.example .env
```

##### Шаг 3

Запустите сервисы в Docker:

```bash
make up # или make up-d (в фоновом режиме)
```

---

### Работа с базой данных (pgAdmin и GUI)

### 1. Веб-интерфейс pgAdmin (Docker)

Для удобного управления базой данных в Docker развёрнут сервис **pgAdmin**.

1. Откройте браузер и перейдите по адресу: [http://localhost:**port-pgadmin**](http://localhost:port-pgadmin)
2. Авторизуйтесь с помощью данных из файла `.env`:
   - **Email:** `PGADMIN_EMAIL` (`pgadmin@admin.com`)
   - **Password:** `PGADMIN_PASS` (`12345`)
3. Для добавления базы данных нажмите **Add New Server**:
   - **Вкладка General:**
     - **Name:** `Reservations-DB` (любое имя)
   - **Вкладка Connection:**
     - **Host name/address:** `db` (имя сервиса PostgreSQL в docker-network)
     - **Port:** `5432`
     - **Maintenance database:** `reservations-db` (значение `POSTGRES_DB`)
     - **Username:** `emran_developer` (значение `POSTGRES_USER`)
     - **Password:** `123456` (значение `POSTGRES_PASSWORD`)
4. Нажмите **Save**.

### 2. Подключение через сторонний GUI (DBeaver, DataGrip, Postico)

Если вы хотите подключиться к базе данных напрямую со своей локальной машины через сторонний клиент, используйте проброшенный через `port-forwarder` порт:

- **Host:** `localhost` или `127.0.0.1`, (если db запущена в docker + local `host.docker.internal`)
- **Port:** `5433` (проброшен через socat port-forwarder)
- **Database:** `reservations-db`
- **Username:** `emran_developer`
- **Password:** `qwert`

---

## 2. 🏗 Архитектурный подход

- Чистый Node.js (без фреймворков)
- Чистый SQL (без ORM/ODM)
- Redis для кэширование
- Модульная структура
- DTO для строгой типизации
- Pipes для обработки и валидации входящих данных
- Middleware для контроля доступа
- Log для debug
- JWT/JWKS + RSA256
- Role-based authorization
- Отдельные слои для Admin и Client логики

---

## 3. 🔐 Authentication & Security

### Основные возможности

- Login / Password
- 2FA (двухфакторная аутентификация)
- Session management
- Email verification
- Forgot password
- OAuth 2.0:
  - Google
  - Yandex
  - Telegram
  - GitHub
- Role-based access
- JWT authentication
- Refresh token через HttpOnly cookie
- Google Recaptcha

---

### 🔑 Token Architecture

- Алгоритм: **RSA256**
- Используется пара ключей:
  - Private Key — подпись
  - Public Key — проверка
- JWKS endpoint
- Access Token → Authorization header
- Refresh Token → HttpOnly cookie

---

### ⏳ Expiration Logic

| Сценарий                                         | Поведение              |
| ------------------------------------------------ | ---------------------- |
| Email не подтверждён в течение времени из `.env` | Пользователь удаляется |
| Истёк activation link                            | Недействителен         |
| Истёк forgot password link                       | Недействителен         |
| Повторная отправка verify email                  | Разрешена              |

---

## 4. 👥 Roles

- `USER`
- `ADMIN`

Некоторые endpoint доступны только при наличии валидного токена и соответствующей роли.

---

## 5. 🛠 Admin Module

### Admin — Users

- Получение список users + pagination query-params: limit and page
- Получение одного user по query-params: userId
- Редактирование user по query-params: userId
- Удаление user по query-params: userId

---

### Admin — Reservations

Администратор создаёт базовые брони, на основе которых клиенты могут оформлять заказы.

---

## 6. 📦 Orders Module

### Client

- Создание заказа
- Получение только своих заказов
- Обновление своего заказа
- Удаление своего заказа

### Admin

- Управление любыми заказами

---

## 7. 💳 Payment Module from YooKassa

### Client

- Создание платежа
- Получение своих платежей (pagination)
- Получение одного платежа

### Admin

- Подтверждение платежа
- Отклонение платежа
- Получение всей истории платежей
- Получение свежих данных из платёжной системы

---

## 8. 👤 Profile Module

Пользователь может:

- Получить свои данные
- Изменить профиль
- Загрузить avatar
- Удалить avatar
- Logout (завершить сессию)

---

## 9. ⭐ Reviews Module

Отзывы привязаны к конкретной брони.

### User

- Создать отзыв
- Получить отзывы конкретной брони (pagination)
- Обновить свой отзыв
- Удалить свой отзыв

### Admin

- Управление всеми отзывами

---

## 10. 📁 Структура проекта

```text
src/
│
├── app/
│ ├── config/
│ ├── db/
│ └── s3/
│
├── admin/
│ ├── dto/
│ ├── pipe/
│ ├── route/
│ ├── types/
│ └── users/
│ ├── dto/
│ ├── pipe/
│ └── types/
│
├── auth/
│ ├── 2fa/
│ ├── dto/
| |–– mail/
│ ├── oauth2.0/
│ ├── middleware/
│ ├── pipe/
│ ├── token/
│ └── types/
│
├── common/
│ ├── abstract/
│ ├── config/
│ ├── constants/
│ ├── middleware/
│ ├── pipe/
│ ├── redis/
│ ├── types/
│ └── utils
│
├── order/
│ ├── dto/
│ ├── pipe/
│ └── types/
│
├── payment/
│ ├── dto/
│ ├── pipe/
│ └── types/
│
├── profile/
│ ├── dto/
│ ├── pipe/
│ └── types/
│
├── reviews/
│ ├── dto/
│ ├── pipe/
│ └── types/
│
├── index.ts
```

---

## 11. 🧰 Tech Stack

- Node.js
- TypeScript
- Bun
- PostgreSQL (`pg`)
- Redis 5V
- bcrypt
- crypto
- jose
- jsonwebtoken
- helmet
- dotenv
- nodemailer
- MinIO (S3)
- sharp
- uuid
- winston
- JSON-BIN (для jwks.json в production)

---

## 12. 🖼 Storage Strategy

### Images

| Environment | Storage      |
| ----------- | ------------ |
| development | local folder |
| production  | MinIO S3     |

---

### JWKS

| Environment | Storage         |
| ----------- | --------------- |
| development | local jwks.json |
| production  | JSON-BIN        |
