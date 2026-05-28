import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/admin/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import AccountPage from './pages/account/AccountPage';
import AccountOrdersPage from './pages/account/AccountOrdersPage';
import CategoriesAdminPage from './pages/admin/CategoriesAdminPage';
import CustomersAdminPage from './pages/admin/CustomersAdminPage';
import DashboardPage from './pages/admin/DashboardPage';
import GalleryAdminPage from './pages/admin/GalleryAdminPage';
import HoursAdminPage from './pages/admin/HoursAdminPage';
import MenuAdminPage from './pages/admin/MenuAdminPage';
import OrdersAdminPage from './pages/admin/OrdersAdminPage';
import ProductsAdminPage from './pages/admin/ProductsAdminPage';
import SettingsAdminPage from './pages/admin/SettingsAdminPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AboutPage from './pages/public/AboutPage';
import CartPage from './pages/public/CartPage';
import CheckoutPage from './pages/public/CheckoutPage';
import ContactPage from './pages/public/ContactPage';
import GalleryPage from './pages/public/GalleryPage';
import HomePage from './pages/public/HomePage';
import DeliveryPage from './pages/public/OrderPage';
import MenuPage from './pages/public/MenuPage';
import ReviewsPage from './pages/public/ReviewsPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/livraison" element={<DeliveryPage />} />
              <Route path="/commander" element={<Navigate to="/livraison" replace />} />
              <Route path="/panier" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/connexion" element={<LoginPage />} />
              <Route path="/inscription" element={<RegisterPage />} />
              <Route path="/compte" element={<AccountPage />} />
              <Route path="/compte/commandes" element={<AccountOrdersPage />} />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/galerie" element={<GalleryPage />} />
              <Route path="/avis" element={<ReviewsPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="commandes" element={<OrdersAdminPage />} />
              <Route path="menu" element={<MenuAdminPage />} />
              <Route path="produits" element={<ProductsAdminPage />} />
              <Route path="categories" element={<CategoriesAdminPage />} />
              <Route path="clients" element={<CustomersAdminPage />} />
              <Route path="galerie" element={<GalleryAdminPage />} />
              <Route path="horaires" element={<HoursAdminPage />} />
              <Route path="parametres" element={<SettingsAdminPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
