import { useLocation } from "react-router-dom";
import Footer from "./Footer";

export default function LayoutFooter() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  if (!isHome) return null;

  return <Footer />;
}
