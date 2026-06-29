import React, { useEffect, useState } from 'react';
import {
  clearDemoStorage,
  clearMockSession,
  reseedDatabase,
} from '@/mocks';
import SplashScreen from '@/components/SplashScreen';
import StagingBanner from '@/components/StagingBanner';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConsolidatedAuthProvider } from "@/components/ConsolidatedAuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import EntryScreen from "./pages/EntryScreen";
// import Index from "./pages/Index";
import { VerifyEmail } from "./pages/VerifyEmail";
import Browse from "./pages/Browse";
import { BrowseVendors } from "./pages/BrowseVendors";
import { CustomerBookingFlow } from "./pages/CustomerBookingFlow";
import HowItWorks from "./pages/HowItWorks";
import { PricingPage } from "./pages/PricingPage";
import Dashboard from "./pages/Dashboard";
import BookingConfirmed from "./pages/BookingConfirmed";
import { MobileDashboard } from "./pages/MobileDashboard";
import VendorDashboard from "./pages/vendor-dashboard";
import { VendorServices } from "./pages/VendorServices";
import { VendorProfile } from "./pages/VendorProfile";
import { VendorProfileEdit } from "./pages/VendorProfileEdit";
import { VendorPayments } from "./pages/VendorPayments";
import Messages from "./pages/Messages";
import PlanningHub from "./pages/PlanningHub";
import Rewards from "./pages/Rewards";
import Support from "./pages/Support";
import SupportWorkflow from "./pages/SupportWorkflow";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSetup from "./pages/AdminSetup";
import EnhancedAdminSetup from "./pages/EnhancedAdminSetup";
import AdminUserDeletion from "./pages/AdminUserDeletion";
import BecomeVendor from "./pages/become-vendor";           // Combined vendor login/signup
import VendorOnboarding from "./pages/VendorOnboarding";   // Pure component, no ProtectedRoute inside
import CustomerOnboarding from "./pages/CustomerOnboarding";
import VendorLogin from "./pages/VendorLogin";             // Optional fallback or remove if using BecomeVendor
import VendorLanding from "./pages/VendorLanding";
import { AdvancedVendorSearch } from "./pages/AdvancedVendorSearch";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import VendorTerms from "./pages/VendorTerms";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import NotFound from "./pages/NotFound";
import ResetPassword from './pages/ResetPassword';
import { VendorPublicProfile } from './pages/VendorPublicPage';

const queryClient = new QueryClient();

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        clearDemoStorage();
        clearMockSession();
        reseedDatabase();
        window.location.href = '/';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <>
      {/* <StagingBanner /> */}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConsolidatedAuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<EntryScreen />} />
                {/* <Route path="/" element={<Index />} /> */}
                <Route path="/verify-email" element={<VerifyEmail />} />
                {/* <Route path="/browse" element={<Browse />} /> */}
                {/* <Route path="/browse-vendors" element={<BrowseVendors />} /> */}
                {/* <Route path="/how-it-works" element={<HowItWorks />} /> */}
                {/* <Route path="/pricing" element={<PricingPage />} /> */}
                {/* <Route path="/terms" element={<Terms />} /> */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                {/* <Route path="/vendor-terms" element={<VendorTerms />} /> */}
                {/* <Route path="/community-guidelines" element={<CommunityGuidelines />} /> */}
                {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
                {/* <Route path="/reset-password" element={<ResetPasswordPage />} />
                 */}
                {/* <Route path="/advanced-vendor-search" element={<AdvancedVendorSearch />} /> */}
                {/* <Route path="/vendor-landing" element={<VendorLanding />} /> */}

                {/* Public Vendor Auth (combined login/signup) */}
                {/* <Route path="/become-vendor" element={<BecomeVendor />} /> */}
                {/* <Route path="/vendor-login" element={<VendorLogin />} /> */}

                {/* Customer Flow (public or lightly protected) */}
                {/* <Route path="/customer-booking-flow" element={<CustomerBookingFlow />} /> */}

                {/* Customer Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRole="customer">
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/booking-confirmed" element={<BookingConfirmed />} />
                {/* <Route path="/mobile-dashboard" element={
                  <ProtectedRoute>
                    <MobileDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/planning-hub" element={
                  <ProtectedRoute>
                    <PlanningHub />
                  </ProtectedRoute>
                } />
                <Route path="/rewards" element={
                  <ProtectedRoute>
                    <Rewards />
                  </ProtectedRoute>
                } /> */}
                {/* <Route path="/support" element={<Support />} />
                <Route path="/support-workflow" element={<SupportWorkflow />} /> */}
                {/* <Route path="/customer-onboarding" element={
                  <ProtectedRoute>
                    <CustomerOnboarding />
                  </ProtectedRoute>
                } /> */}

                {/* Vendor Onboarding – Strict: pending_vendor + email verified */}
                <Route path="/vendor-onboarding" element={
                  <ProtectedRoute
                    requiredRole="pending_vendor"
                    requireEmailVerified={true}
                  >
                    <VendorOnboarding />
                  </ProtectedRoute>
                } />

                {/* Full Vendor Routes – Require completed vendor record */}
                <Route path="/vendor-dashboard" element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/vendor/services" element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorServices />
                  </ProtectedRoute>
                } />
                {/* <Route path="/vendor/profile" element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorProfile />
                  </ProtectedRoute>
                } />
                <Route path="/vendor/profile/edit" element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorProfileEdit />
                  </ProtectedRoute>
                } /> */}
                {/* <Route path="/vendor/payments" element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorPayments />
                  </ProtectedRoute>
                } /> */}

                {/* Public Vendor Profile (for customers to view) */}
                <Route path="/v/:slug" element={<VendorPublicProfile />} />
                {/* Admin Routes */}
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                {/* <Route path="/admin-setup" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminSetup />
                  </ProtectedRoute>
                } />
                <Route path="/enhanced-admin-setup" element={
                  <ProtectedRoute requiredRole="admin">
                    <EnhancedAdminSetup />
                  </ProtectedRoute>
                } />
                <Route path="/admin-user-deletion" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUserDeletion />
                  </ProtectedRoute>
                } /> */}


                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </ConsolidatedAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;