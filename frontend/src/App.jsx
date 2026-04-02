// src/App.jsx
import { LanguageProvider } from "./hooks/useLanguage";
import Home from "./pages/Home";

export default function App() {
  return (
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );
}
