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

## 2. Init projects

### 1. Создать `.env`

```bash
cp .env.example .env
```

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
