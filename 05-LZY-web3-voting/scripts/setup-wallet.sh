#!/bin/bash

# Web3 Wallet Setup Script
# This script helps you configure WalletConnect for your project

set -e

echo "🚀 Web3 Wallet Configuration Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
  echo "✅ .env file exists"
else
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "✅ .env file created"
fi

echo ""
echo "⚠️  Important: You need to configure WalletConnect Project ID"
echo ""
echo "Steps:"
echo "1. Visit https://cloud.walletconnect.com"
echo "2. Sign up or log in"
echo "3. Create a new project"
echo "4. Copy your Project ID"
echo "5. Edit .env file and set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
echo ""
echo "Example:"
echo 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="abc123def456..."'
echo ""

# Check if WalletConnect Project ID is set
if grep -q "your_project_id_here" .env 2>/dev/null; then
  echo "⚠️  WalletConnect Project ID not configured yet"
  echo "   Please edit .env file and add your Project ID"
else
  echo "✅ WalletConnect Project ID appears to be configured"
fi

echo ""
echo "📚 Documentation:"
echo "   - README_WALLET.md - Quick start guide"
echo "   - docs/wallet-integration.md - Full integration guide"
echo ""
echo "🎯 Usage Examples:"
echo "   - src/components/wallet/WalletButton.tsx"
echo "   - src/components/voting/HeaderWithWallet.tsx"
echo ""
echo "✨ Setup complete! Start the dev server with: pnpm dev"
