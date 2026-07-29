import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useParams } from 'react-router-dom';

// Providers from Mokijo
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { PermissionProvider } from "@/providers/permission-provider";
import { DeveloperPreviewProvider } from "@/providers/developer-preview-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";

// Lazy load root pages
const Home = React.lazy(() => import('@/app/page.jsx'));
const Login = React.lazy(() => import('@/app/login/page.jsx'));
const LoginUser = React.lazy(() => import('@/app/login-user/page.jsx'));
const LoginTrainer = React.lazy(() => import('@/app/login-trainer/page.jsx'));
const LoginAdmin = React.lazy(() => import('@/app/login-admin/page.jsx'));
const LoginMember = React.lazy(() => import('@/app/login-member/page.jsx'));
const LoginVenue = React.lazy(() => import('@/app/login-venue/page.jsx'));
const Register = React.lazy(() => import('@/app/register/page.jsx'));
const RegisterMember = React.lazy(() => import('@/app/register-member/page.jsx'));
const RegisterVenue = React.lazy(() => import('@/app/register-venue/page.jsx'));
const RegisterUser = React.lazy(() => import('@/app/register-user/page.jsx'));
const RegisterTrainer = React.lazy(() => import('@/app/register-trainer/page.jsx'));
const BandLogin = React.lazy(() => import('@/app/band/login/page.jsx'));
const BandRegister = React.lazy(() => import('@/app/band/register/page.jsx'));
const Developer = React.lazy(() => import('@/app/developer/page'));
const Messages = React.lazy(() => import('@/app/messages/page'));
const Notifications = React.lazy(() => import('@/app/notifications/page'));

// Dashboard and Layouts
const DashboardLayout = React.lazy(() => import('@/app/dashboard/layout.jsx'));
const DashboardOverview = React.lazy(() => import('@/app/dashboard/page.jsx'));
const DashboardGroups = React.lazy(() => import('@/app/dashboard/groups/page.jsx'));
const DashboardGroupDetail = React.lazy(() => import('@/app/dashboard/group/[id]/page.jsx'));
const DashboardActivities = React.lazy(() => import('@/app/dashboard/activities/page.jsx'));
const DashboardActivityDetail = React.lazy(() => import('@/app/dashboard/activities/[id]/page.jsx'));
const DashboardEvents = React.lazy(() => import('@/app/dashboard/events/page.jsx'));
const DashboardEventNew = React.lazy(() => import('@/app/dashboard/events/new/page.jsx'));
const DashboardMembers = React.lazy(() => import('@/app/dashboard/members/page.jsx'));
const DashboardMemberEdit = React.lazy(() => import('@/app/dashboard/members/[id]/edit/page.jsx'));
const DashboardFundraising = React.lazy(() => import('@/app/dashboard/fundraising/page.jsx'));
const DashboardFundraisingNew = React.lazy(() => import('@/app/dashboard/fundraising/new/page.jsx'));
const DashboardFundraisingDonate = React.lazy(() => import('@/app/dashboard/fundraising/donate/[id]/page.jsx'));
const DashboardPayments = React.lazy(() => import('@/app/dashboard/payments/page.jsx'));
const DashboardVenues = React.lazy(() => import('@/app/dashboard/venues/page.jsx'));
const DashboardVenueVerification = React.lazy(() => import('@/app/dashboard/venue-verification/page.jsx'));
const DashboardVenueVerificationDetail = React.lazy(() => import('@/app/dashboard/venue-verification/[venueId]/page.jsx'));
const DashboardSettings = React.lazy(() => import('@/app/dashboard/settings/page.jsx'));
const DashboardProfile = React.lazy(() => import('@/app/dashboard/profile/page.jsx'));
const DashboardBookings = React.lazy(() => import('@/app/dashboard/bookings/page.jsx'));
const DashboardCourses = React.lazy(() => import('@/app/dashboard/courses/page.jsx'));
const DashboardMyTrainings = React.lazy(() => import('@/app/dashboard/my-trainings/page.jsx'));
const DashboardTrainers = React.lazy(() => import('@/app/dashboard/trainers/page.jsx'));
const DashboardCreateGroup = React.lazy(() => import('@/app/dashboard/creategroup/page.jsx'));
const DashboardImportGroups = React.lazy(() => import('@/app/dashboard/importgroups/page.jsx'));
const DashboardSignupForms = React.lazy(() => import('@/app/dashboard/signup-forms/page.jsx'));
const DashboardMatches = React.lazy(() => import('@/app/dashboard/matches/page.jsx'));
const DashboardMatchesCreate = React.lazy(() => import('@/app/dashboard/matches/create/page.jsx'));

// Client Layout and Pages
const ClientLayout = React.lazy(() => import('@/app/client/layout'));
const ClientDashboard = React.lazy(() => import('@/app/client/dashboard/page'));
const ClientBookings = React.lazy(() => import('@/app/client/bookings/page'));
const ClientBookingDetail = React.lazy(() => import('@/app/client/bookings/[id]/page'));
const ClientFavorites = React.lazy(() => import('@/app/client/favorites/page'));
const ClientMessages = React.lazy(() => import('@/app/client/messages/page'));
const ClientReviews = React.lazy(() => import('@/app/client/reviews/page'));
const ClientSettings = React.lazy(() => import('@/app/client/settings/page'));
const ClientNotifications = React.lazy(() => import('@/app/client/notifications/page'));

// Artist Layout and Pages
const ArtistLayout = React.lazy(() => import('@/app/artist/layout'));
const ArtistProfile = React.lazy(() => import('@/app/artist/profile/page'));
const ArtistSettings = React.lazy(() => import('@/app/artist/settings/page'));

// Helper HOC to inject useParams into Component as prop params
function PageWrapper({ Component }) {
  const params = useParams();
  return <Component params={params} />;
}

// Helper to render Next.js style layouts
function LayoutWrapper({ LayoutComponent }) {
  return (
    <LayoutComponent params={{}}>
      <Outlet />
    </LayoutComponent>
  );
}

// Fallback Loading view
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary text-primary">
      <div className="text-xl font-bold animate-pulse">Loading Mukijo...</div>
    </div>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <PermissionProvider>
            <DeveloperPreviewProvider>
              <Router>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Root & Authentication Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/login-user" element={<LoginUser />} />
                    <Route path="/login-trainer" element={<LoginTrainer />} />
                    <Route path="/login-admin" element={<LoginAdmin />} />
                    <Route path="/login-member" element={<LoginMember />} />
                    <Route path="/login-venue" element={<LoginVenue />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/register-member" element={<RegisterMember />} />
                    <Route path="/register-venue" element={<RegisterVenue />} />
                    <Route path="/register-user" element={<RegisterUser />} />
                    <Route path="/register-trainer" element={<RegisterTrainer />} />
                    
                    <Route path="/band/login" element={<BandLogin />} />
                    <Route path="/band/register" element={<BandRegister />} />
                    
                    <Route path="/developer" element={<Developer />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/notifications" element={<Notifications />} />

                    {/* Dashboard Routes */}
                    <Route path="/dashboard" element={<LayoutWrapper LayoutComponent={DashboardLayout} />}>
                      <Route index element={<DashboardOverview />} />
                      <Route path="groups" element={<DashboardGroups />} />
                      <Route path="group/:id" element={<PageWrapper Component={DashboardGroupDetail} />} />
                      <Route path="creategroup" element={<DashboardCreateGroup />} />
                      <Route path="importgroups" element={<DashboardImportGroups />} />
                      <Route path="activities" element={<DashboardActivities />} />
                      <Route path="activities/:id" element={<PageWrapper Component={DashboardActivityDetail} />} />
                      <Route path="events" element={<DashboardEvents />} />
                      <Route path="events/new" element={<DashboardEventNew />} />
                      <Route path="members" element={<DashboardMembers />} />
                      <Route path="members/:id/edit" element={<PageWrapper Component={DashboardMemberEdit} />} />
                      <Route path="fundraising" element={<DashboardFundraising />} />
                      <Route path="fundraising/new" element={<DashboardFundraisingNew />} />
                      <Route path="fundraising/donate/:id" element={<PageWrapper Component={DashboardFundraisingDonate} />} />
                      <Route path="payments" element={<DashboardPayments />} />
                      <Route path="venues" element={<DashboardVenues />} />
                      <Route path="venue-verification" element={<DashboardVenueVerification />} />
                      <Route path="venue-verification/:venueId" element={<PageWrapper Component={DashboardVenueVerificationDetail} />} />
                      <Route path="settings" element={<DashboardSettings />} />
                      <Route path="profile" element={<DashboardProfile />} />
                      <Route path="bookings" element={<DashboardBookings />} />
                      <Route path="courses" element={<DashboardCourses />} />
                      <Route path="my-trainings" element={<DashboardMyTrainings />} />
                      <Route path="trainers" element={<DashboardTrainers />} />
                      <Route path="signup-forms" element={<DashboardSignupForms />} />
                      <Route path="matches" element={<DashboardMatches />} />
                      <Route path="matches/create" element={<DashboardMatchesCreate />} />
                    </Route>

                    {/* Client Routes */}
                    <Route path="/client" element={<LayoutWrapper LayoutComponent={ClientLayout} />}>
                      <Route path="dashboard" element={<ClientDashboard />} />
                      <Route path="bookings" element={<ClientBookings />} />
                      <Route path="bookings/:id" element={<PageWrapper Component={ClientBookingDetail} />} />
                      <Route path="favorites" element={<ClientFavorites />} />
                      <Route path="messages" element={<ClientMessages />} />
                      <Route path="reviews" element={<ClientReviews />} />
                      <Route path="settings" element={<ClientSettings />} />
                      <Route path="notifications" element={<ClientNotifications />} />
                    </Route>

                    {/* Artist Routes */}
                    <Route path="/artist" element={<LayoutWrapper LayoutComponent={ArtistLayout} />}>
                      <Route path="profile" element={<ArtistProfile />} />
                      <Route path="settings" element={<ArtistSettings />} />
                    </Route>

                    {/* Fallback route */}
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Suspense>
              </Router>
              <ToastProvider />
            </DeveloperPreviewProvider>
          </PermissionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
