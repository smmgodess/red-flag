# THE LIAR - Dating App Interface

A dark-themed dating app interface with multiple personas, chat functionality, and upgrade system.

## Features

- **Persona System**: Multiple characters with unique personalities and red flags
- **Chat Interface**: Real-time messaging with simulated response latency
- **Upgrade System**: Premium features with Player Pass integration
- **Dark Theme**: Modern black and red color scheme

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Project Structure

```
src/
├── components/
│   ├── ChatList.jsx      # Main chat list view
│   └── ChatInterface.jsx # Individual chat interface
├── data/
│   └── personas.json     # Persona data and messages
├── App.jsx               # Main application component
├── index.js              # Entry point
└── index.css             # Global styles with Tailwind
```

## Personas

- **Liam**: Sociopath Married Consultant
- **Noah**: Love Bomber Stalker
- **Jax**: Crypto Bro Debtor

Each persona has unique response latency and message patterns.

## Technologies Used

- React 18
- Tailwind CSS
- DiceBear API for avatars
