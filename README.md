# Pick Fashion - Ethiopian Fashion E-commerce

A modern e-commerce platform for Ethiopian fashion, featuring Telegram bot integration for seamless ordering and customer support.

## 🛍️ Features

- **Browse Products**: Beautiful product catalog with warm, feminine design
- **Telegram Bot Integration**: Direct ordering through Telegram with instant confirmation
- **Order Management**: Track orders and receive updates via Telegram
- **Admin Dashboard**: Manage orders and communicate with customers
- **Responsive Design**: Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Telegram Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Pick-fashion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration files in `supabase/migrations/`
   - Update your environment variables with Supabase URL and keys

5. **Start the development server**
   ```bash
   npm start
   ```

## 🤖 Telegram Bot Setup

1. **Create a Bot**
   - Contact [@BotFather](https://t.me/BotFather) on Telegram
   - Create a new bot and get your bot token

2. **Configure the Bot**
   - Update `BOT_TOKEN` in your `.env` file
   - Set your `ADMIN_TELEGRAM_ID` for admin features

3. **Deploy the Bot**
   - The bot is located in the `Pick-fashion-bot` directory
   - Deploy to your preferred platform (Render, Vercel, etc.)

## 📦 Project Structure

```
Pick-fashion/
├── src/
│   ├── components/          # React components
│   ├── assets/             # Images and static assets
│   └── supabaseClient.js    # Supabase configuration
├── public/                 # Public assets
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/           # Edge functions
├── Pick-fashion-bot/        # Telegram bot code
└── README.md
```

## 🎨 Design System

- **Primary Colors**: Warm cream (#FDF8F3) with orange accents (#FF6B35)
- **Typography**: Clean, modern fonts
- **Components**: Consistent, reusable React components

## 📱 Ordering Flow

1. **Browse Products**: Customers browse the product catalog
2. **Quick Order**: Click "Buy Now" on any product
3. **Phone Collection**: Simple phone number collection popup
4. **Telegram Confirmation**: Instant order confirmation via Telegram
5. **Order Management**: Track orders and communicate through the bot

## 🔧 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Telegram Bot
BOT_TOKEN=your_bot_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_TELEGRAM_ID=your_telegram_id
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set environment variables
3. Deploy automatically on push to main

### Bot (Render)
1. Deploy the `Pick-fashion-bot` directory
2. Use "Background Worker" service type
3. Set environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, contact us through:
- Telegram: [@Rutha_5](https://t.me/Rutha_5)
- Email: support@pick-fashion.com

---

Built with ❤️ for Ethiopian fashion
