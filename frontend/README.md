# 🎨 NicheScope: Frontend UI

This is the **Next.js 16** frontend for the **NicheScope: YouTube Intelligence Platform**. It provides a sleek, modern dashboard for niche research, competitor analysis, and AI content strategy.

---

## 🏗️ Architecture & Stack
- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) (Modern design system)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com) & [Base UI](https://base-ui.com)
- **State Management**: React 19 Hooks & Context
- **Icons**: [Lucide React](https://lucide.dev)

---

## 🚀 Setup & Development

### Project Documentation
> [!IMPORTANT]
> **For the full project overview, backend setup, and core features, please see the [Root README](../README.md).**

### Prerequisites
- Node.js 20+
- A running instance of the **NicheScope Backend** (Default: `http://localhost:8000`)

### Getting Started
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` file (or use existing `.env`) and ensure it points to your backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📂 Frontend Structure
- `/src/app`: Modern App Router structure (Dashboard, Channels, Niches).
- `/src/components`: Atomic UI components (Cards, Selectors, Layouts).
- `/public`: Static assets and branding.

---

## 📖 Learn More
To learn more about the technologies used:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS 4 Docs](https://tailwindcss.com/docs/v4-beta)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19)
