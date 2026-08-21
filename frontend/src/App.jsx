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
const Home = React.lazy(() => import('@/app/mokijo/page.jsx'));
const Login = React.lazy(() => import('@/app/mokijo/login/login-page.jsx'));
const LoginUser = React.lazy(() => import('@/app/mokijo/login-user/login-user-page.jsx'));
const LoginTrainer = React.lazy(() => import('@/app/mokijo/login-trainer/login-trainer-page.jsx'));
const LoginAdmin = React.lazy(() => import('@/app/mokijo/login-admin/login-admin-page.jsx'));
const LoginMember = React.lazy(() => import('@/app/mokijo/login-member/login-member-page.jsx'));
const LoginVenue = React.lazy(() => import('@/app/mokijo/login-venue/login-venue-page.jsx'));
const Register = React.lazy(() => import('@/app/mokijo/register/register-page.jsx'));
const RegisterMember = React.lazy(() => import('@/app/mokijo/register-member/register-member-page.jsx'));
const RegisterVenue = React.lazy(() => import('@/app/mokijo/register-venue/register-venue-page.jsx'));
const RegisterUser = React.lazy(() => import('@/app/mokijo/register-user/register-user-page.jsx'));
const RegisterTrainer = React.lazy(() => import('@/app/mokijo/register-trainer/register-trainer-page.jsx'));
const BandLayout = React.lazy(() => import('@/app/band/layout.jsx'));
const BandLanding = React.lazy(() => import('@/app/band/page.jsx'));
const BandDashboard = React.lazy(() => import('@/app/band/dashboard/page.jsx'));
const BandClientDashboard = React.lazy(() => import('@/app/band/client/dashboard/page.jsx'));
const BandArtistDashboard = React.lazy(() => import('@/app/band/artist/dashboard/page.jsx'));
const BandClientBookings = React.lazy(() => import('@/app/band/client/bookings/page.jsx'));
const BandClientBookingDetail = React.lazy(() => import('@/app/band/client/bookings/[id]/page.jsx'));
const BandNewBooking = React.lazy(() => import('@/app/band/bookings/new/page.jsx'));
const BandArtistProfile = React.lazy(() => import('@/app/band/artist/profile/page.jsx'));
const BandArtistBookings = React.lazy(() => import('@/app/band/artist/bookings/page.jsx'));
const BandArtistEarnings = React.lazy(() => import('@/app/band/artist/earnings/page.jsx'));
const BandLogin = React.lazy(() => import('@/app/band/login/page.jsx'));
const BandRegister = React.lazy(() => import('@/app/band/register/page.jsx'));
const BandArtists = React.lazy(() => import('@/app/band/artists/page'));
const BandArtistDetail = React.lazy(() => import('@/app/band/artists/[id]/page'));
const BandVenues = React.lazy(() => import('@/app/band/venues/page'));
const BandVenueDetail = React.lazy(() => import('@/app/band/venues/[id]/page'));
const Developer = React.lazy(() => import('@/app/developer/page'));
const Messages = React.lazy(() => import('@/app/messages/page'));
const Notifications = React.lazy(() => import('@/app/notifications/page'));
const ForgotPassword = React.lazy(() => import('@/app/(auth-narrow)/forgot-password/page.jsx'));
const ResetPassword = React.lazy(() => import('@/app/(auth-narrow)/reset-password/page.jsx'));
const UserDashboard = React.lazy(() => import('@/app/user-dashboard/page.jsx'));
const Checkout = React.lazy(() => import('@/app/checkout/page.jsx'));
const Scoreboard = React.lazy(() => import('@/app/scoreboard/[match_id]/page.jsx'));
const TrainingDetail = React.lazy(() => import('@/app/trainings/[id]/page.jsx'));
const SportsVenues = React.lazy(() => import('@/app/venues/page.jsx'));
const SportsVenueDetail = React.lazy(() => import('@/app/venues/[id]/page.jsx'));

// Dashboard and Layouts
const DashboardLayout = React.lazy(() => import('@/app/mokijo/dashboard/layout.jsx'));
const DashboardIndex = React.lazy(() => import('@/app/mokijo/dashboard/page.jsx'));
const DashboardOverviewPage = React.lazy(() => import('@/app/mokijo/dashboard/overview/page.jsx'));
const DashboardGroups = React.lazy(() => import('@/app/mokijo/dashboard/groups/page.jsx'));
const DashboardGroupDetail = React.lazy(() => import('@/app/mokijo/dashboard/group/[id]/page.jsx'));
const DashboardActivities = React.lazy(() => import('@/app/mokijo/dashboard/activities/page.jsx'));
const DashboardActivityDetail = React.lazy(() => import('@/app/mokijo/dashboard/activities/[id]/page.jsx'));
const DashboardEvents = React.lazy(() => import('@/app/mokijo/dashboard/events/page.jsx'));
const DashboardEventNew = React.lazy(() => import('@/app/mokijo/dashboard/events/new/page.jsx'));
const DashboardEventDetail = React.lazy(() => import('@/app/mokijo/dashboard/events/[id]/page.jsx'));
const DashboardMembers = React.lazy(() => import('@/app/mokijo/dashboard/members/page.jsx'));
const DashboardMemberEdit = React.lazy(() => import('@/app/mokijo/dashboard/members/[id]/edit/page.jsx'));
const DashboardFundraising = React.lazy(() => import('@/app/mokijo/dashboard/fundraising/page.jsx'));
const DashboardFundraisingNew = React.lazy(() => import('@/app/mokijo/dashboard/fundraising/new/page.jsx'));
const DashboardFundraisingDonate = React.lazy(() => import('@/app/mokijo/dashboard/fundraising/donate/[id]/page.jsx'));
const DashboardPayments = React.lazy(() => import('@/app/mokijo/dashboard/payments/page.jsx'));
const DashboardVenues = React.lazy(() => import('@/app/mokijo/dashboard/venues/page.jsx'));
const DashboardVenueVerification = React.lazy(() => import('@/app/mokijo/dashboard/venue-verification/page.jsx'));
const DashboardVenueVerificationDetail = React.lazy(() => import('@/app/mokijo/dashboard/venue-verification/[venueId]/page.jsx'));
const DashboardSettings = React.lazy(() => import('@/app/mokijo/dashboard/settings/page.jsx'));
const DashboardProfile = React.lazy(() => import('@/app/mokijo/dashboard/profile/page.jsx'));
const DashboardClubProfile = React.lazy(() => import('@/app/mokijo/dashboard/club-profile/page.jsx'));
const DashboardBookings = React.lazy(() => import('@/app/mokijo/dashboard/bookings/page.jsx'));
const DashboardCourses = React.lazy(() => import('@/app/mokijo/dashboard/courses/page.jsx'));
const DashboardMyTrainings = React.lazy(() => import('@/app/mokijo/dashboard/my-trainings/page.jsx'));
const DashboardTrainers = React.lazy(() => import('@/app/mokijo/dashboard/trainers/page.jsx'));
const DashboardCreateGroup = React.lazy(() => import('@/app/mokijo/dashboard/creategroup/page.jsx'));
const DashboardImportGroups = React.lazy(() => import('@/app/mokijo/dashboard/importgroups/page.jsx'));
const DashboardSignupForms = React.lazy(() => import('@/app/mokijo/dashboard/signup-forms/page.jsx'));
const DashboardMatches = React.lazy(() => import('@/app/mokijo/dashboard/matches/page.jsx'));
const DashboardMatchesCreate = React.lazy(() => import('@/app/mokijo/dashboard/matches/create/page.jsx'));
const DashboardMatchManage = React.lazy(() => import('@/app/mokijo/dashboard/matches/[id]/manage/page.jsx'));

// Trainer Dashboard
const TrainerDashboardLayout = React.lazy(() => import('@/app/mokijo/trainer-dashboard/layout.jsx'));
const TrainerDashboardIndex = React.lazy(() => import('@/app/mokijo/trainer-dashboard/page.jsx'));
const TrainerDashboardOverview = React.lazy(() => import('@/app/mokijo/trainer-dashboard/overview/page.jsx'));
const TrainerTrainings = React.lazy(() => import('@/app/mokijo/trainer-dashboard/trainings/page.jsx'));
const TrainerTrainingsCreate = React.lazy(() => import('@/app/mokijo/trainer-dashboard/trainings/create/page.jsx'));
const TrainerRegistrations = React.lazy(() => import('@/app/mokijo/trainer-dashboard/registrations/page.jsx'));

// Venue Dashboard
const VenueDashboardLayout = React.lazy(() => import('@/app/mokijo/venue-dashboard/layout.jsx'));
const VenueDashboardIndex = React.lazy(() => import('@/app/mokijo/venue-dashboard/page.jsx'));
const VenueDashboardOverview = React.lazy(() => import('@/app/mokijo/venue-dashboard/overview/page.jsx'));
const VenueMyVenues = React.lazy(() => import('@/app/mokijo/venue-dashboard/my-venues/page.jsx'));
const VenueVerification = React.lazy(() => import('@/app/mokijo/venue-dashboard/verification/page.jsx'));
const VenueVerifyDetail = React.lazy(() => import('@/app/mokijo/venue-dashboard/verify/[id]/page.jsx'));
const VenueBookings = React.lazy(() => import('@/app/mokijo/venue-dashboard/bookings/page.jsx'));
const VenueSlots = React.lazy(() => import('@/app/mokijo/venue-dashboard/slots/page.jsx'));
const VenuePayouts = React.lazy(() => import('@/app/mokijo/venue-dashboard/payouts/page.jsx'));
const VenueMatches = React.lazy(() => import('@/app/mokijo/venue-dashboard/matches/page.jsx'));
const VenueMatchesCreate = React.lazy(() => import('@/app/mokijo/venue-dashboard/matches/create/page.jsx'));
const VenueMatchManage = React.lazy(() => import('@/app/mokijo/venue-dashboard/matches/[id]/manage/page.jsx'));

// Client Layout and Pages
const ClientLayout = React.lazy(() => import('@/app/mokijo/client/layout'));
const ClientDashboard = React.lazy(() => import('@/app/mokijo/client/dashboard/page'));
const ClientBookings = React.lazy(() => import('@/app/mokijo/client/bookings/page'));
const ClientBookingDetail = React.lazy(() => import('@/app/mokijo/client/bookings/[id]/page'));
const ClientFavorites = React.lazy(() => import('@/app/mokijo/client/favorites/page'));
const ClientMessages = React.lazy(() => import('@/app/mokijo/client/messages/page'));
const ClientReviews = React.lazy(() => import('@/app/mokijo/client/reviews/page'));
const ClientSettings = React.lazy(() => import('@/app/mokijo/client/settings/page'));
const ClientNotifications = React.lazy(() => import('@/app/mokijo/client/notifications/page'));

// Artist Layout and Pages
const ArtistLayout = React.lazy(() => import('@/app/band/artist/layout'));
const ArtistProfile = React.lazy(() => import('@/app/band/artist/profile/page'));
const ArtistSettings = React.lazy(() => import('@/app/band/artist/settings/page'));

// Band Venue Layout and Pages
const BandVenueLayout = React.lazy(() => import('@/app/venue/layout.jsx'));
const BandVenueDashboard = React.lazy(() => import('@/app/venue/dashboard/page.jsx'));
const BandVenueBookings = React.lazy(() => import('@/app/venue/bookings/page.jsx'));
const BandVenueReviews = React.lazy(() => import('@/app/venue/reviews/page.jsx'));
const BandVenueSettings = React.lazy(() => import('@/app/venue/settings/page.jsx'));

// Band Admin Layout and Pages
const BandAdminLayout = React.lazy(() => import('@/app/admin/layout.jsx'));
const BandAdminDashboard = React.lazy(() => import('@/app/admin/dashboard/page.jsx'));
const BandAdminUsers = React.lazy(() => import('@/app/admin/users/page.jsx'));
const BandAdminArtists = React.lazy(() => import('@/app/admin/artists/page.jsx'));
const BandAdminVenues = React.lazy(() => import('@/app/admin/venues/page.jsx'));
const BandAdminCategories = React.lazy(() => import('@/app/admin/categories/page.jsx'));
const BandAdminLocations = React.lazy(() => import('@/app/admin/locations/page.jsx'));
const BandAdminPromos = React.lazy(() => import('@/app/admin/promos/page.jsx'));
const BandAdminReports = React.lazy(() => import('@/app/admin/reports/page.jsx'));

const BandArtistMessages = React.lazy(() => import('@/app/band/artist/messages/page.jsx'));
const BandArtistReviews = React.lazy(() => import('@/app/band/artist/reviews/page.jsx'));
const BandArtistSettings = React.lazy(() => import('@/app/band/artist/settings/page.jsx'));

const BandClientMessages = React.lazy(() => import('@/app/band/client/messages/page.jsx'));
const BandClientProfile = React.lazy(() => import('@/app/band/client/profile/page.jsx'));
const BandClientFavorites = React.lazy(() => import('@/app/band/client/favorites/page.jsx'));
const BandClientReviews = React.lazy(() => import('@/app/band/client/reviews/page.jsx'));
const BandClientPayments = React.lazy(() => import('@/app/band/client/payments/page.jsx'));
const BandClientSettings = React.lazy(() => import('@/app/band/client/settings/page.jsx'));

const BandVenueMessages = React.lazy(() => import('@/app/venue/messages/page.jsx'));
const BandVenueProfile = React.lazy(() => import('@/app/venue/profile/page.jsx'));
const BandVenueEarnings = React.lazy(() => import('@/app/venue/earnings/page.jsx'));

// Super Admin Layout and Pages
const SuperAdminLogin = React.lazy(() => import('@/app/super-admin/login/page.jsx'));
const SuperAdminLayout = React.lazy(() => import('@/app/super-admin/dashboard/layout.jsx'));
const SuperAdminOverview = React.lazy(() => import('@/app/super-admin/dashboard/overview/page.jsx'));
const SuperAdminAllClubs = React.lazy(() => import('@/app/super-admin/dashboard/all-clubs/page.jsx'));
const SuperAdminApprovedClubs = React.lazy(() => import('@/app/super-admin/dashboard/approved-clubs/page.jsx'));
const SuperAdminPendingApprovals = React.lazy(() => import('@/app/super-admin/dashboard/pending-approvals/page.jsx'));

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
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/user-dashboard" element={<UserDashboard />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/scoreboard/:match_id" element={<PageWrapper Component={Scoreboard} />} />
                    <Route path="/trainings/:id" element={<PageWrapper Component={TrainingDetail} />} />

                    {/* Band Routes */}
                    <Route path="/band" element={<LayoutWrapper LayoutComponent={BandLayout} />}>
                      <Route index element={<BandLanding />} />
                      <Route path="dashboard" element={<BandDashboard />} />
                      <Route path="client/dashboard" element={<BandClientDashboard />} />
                      <Route path="client/profile" element={<BandClientProfile />} />
                      <Route path="client/bookings" element={<BandClientBookings />} />
                      <Route path="client/bookings/:id" element={<PageWrapper Component={BandClientBookingDetail} />} />
                      <Route path="client/favorites" element={<BandClientFavorites />} />
                      <Route path="client/reviews" element={<BandClientReviews />} />
                      <Route path="client/messages" element={<BandClientMessages />} />
                      <Route path="client/payments" element={<BandClientPayments />} />
                      <Route path="client/settings" element={<BandClientSettings />} />
                      <Route path="bookings/new" element={<BandNewBooking />} />
                      <Route path="artist/dashboard" element={<BandArtistDashboard />} />
                      <Route path="artist/profile" element={<BandArtistProfile />} />
                      <Route path="artist/bookings" element={<BandArtistBookings />} />
                      <Route path="artist/reviews" element={<BandArtistReviews />} />
                      <Route path="artist/earnings" element={<BandArtistEarnings />} />
                      <Route path="artist/messages" element={<BandArtistMessages />} />
                      <Route path="artist/settings" element={<BandArtistSettings />} />
                      <Route path="login" element={<BandLogin />} />
                      <Route path="register" element={<BandRegister />} />
                      <Route path="artists" element={<BandArtists />} />
                      <Route path="artists/:id" element={<PageWrapper Component={BandArtistDetail} />} />
                      <Route path="venues" element={<BandVenues />} />
                      <Route path="venues/:id" element={<PageWrapper Component={BandVenueDetail} />} />
                    </Route>

                    {/* Standalone Band Discovery Routes */}
                    <Route path="/artists" element={<LayoutWrapper LayoutComponent={BandLayout} />}>
                      <Route index element={<BandArtists />} />
                      <Route path=":id" element={<PageWrapper Component={BandArtistDetail} />} />
                    </Route>
                    <Route path="/venues" element={<SportsVenues />} />
                    <Route path="/venues/:id" element={<PageWrapper Component={SportsVenueDetail} />} />

                    <Route path="/developer" element={<Developer />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/notifications" element={<Notifications />} />

                    {/* Dashboard Routes */}
                    <Route path="/dashboard" element={<LayoutWrapper LayoutComponent={DashboardLayout} />}>
                      <Route index element={<DashboardIndex />} />
                      <Route path="overview" element={<DashboardOverviewPage />} />
                      <Route path="groups" element={<DashboardGroups />} />
                      <Route path="group/:id" element={<PageWrapper Component={DashboardGroupDetail} />} />
                      <Route path="creategroup" element={<DashboardCreateGroup />} />
                      <Route path="importgroups" element={<DashboardImportGroups />} />
                      <Route path="activities" element={<DashboardActivities />} />
                      <Route path="activities/:id" element={<PageWrapper Component={DashboardActivityDetail} />} />
                      <Route path="events" element={<DashboardEvents />} />
                      <Route path="events/new" element={<DashboardEventNew />} />
                      <Route path="events/:id" element={<PageWrapper Component={DashboardEventDetail} />} />
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
                      <Route path="club-profile" element={<DashboardClubProfile />} />
                      <Route path="bookings" element={<DashboardBookings />} />
                      <Route path="courses" element={<DashboardCourses />} />
                      <Route path="my-trainings" element={<DashboardMyTrainings />} />
                      <Route path="trainers" element={<DashboardTrainers />} />
                      <Route path="signup-forms" element={<DashboardSignupForms />} />
                      <Route path="matches" element={<DashboardMatches />} />
                      <Route path="matches/create" element={<DashboardMatchesCreate />} />
                      <Route path="matches/:id/manage" element={<PageWrapper Component={DashboardMatchManage} />} />
                    </Route>

                    {/* Trainer Dashboard Routes */}
                    <Route path="/trainer-dashboard" element={<LayoutWrapper LayoutComponent={TrainerDashboardLayout} />}>
                      <Route index element={<TrainerDashboardIndex />} />
                      <Route path="overview" element={<TrainerDashboardOverview />} />
                      <Route path="trainings" element={<TrainerTrainings />} />
                      <Route path="trainings/create" element={<TrainerTrainingsCreate />} />
                      <Route path="registrations" element={<TrainerRegistrations />} />
                    </Route>

                    {/* Venue Dashboard Routes */}
                    <Route path="/venue-dashboard" element={<LayoutWrapper LayoutComponent={VenueDashboardLayout} />}>
                      <Route index element={<VenueDashboardIndex />} />
                      <Route path="overview" element={<VenueDashboardOverview />} />
                      <Route path="my-venues" element={<VenueMyVenues />} />
                      <Route path="verification" element={<VenueVerification />} />
                      <Route path="verify/:id" element={<PageWrapper Component={VenueVerifyDetail} />} />
                      <Route path="bookings" element={<VenueBookings />} />
                      <Route path="slots" element={<VenueSlots />} />
                      <Route path="payouts" element={<VenuePayouts />} />
                      <Route path="matches" element={<VenueMatches />} />
                      <Route path="matches/create" element={<VenueMatchesCreate />} />
                      <Route path="matches/:id/manage" element={<PageWrapper Component={VenueMatchManage} />} />
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
                      <Route path="dashboard" element={<BandArtistDashboard />} />
                      <Route path="profile" element={<ArtistProfile />} />
                      <Route path="settings" element={<ArtistSettings />} />
                    </Route>

                    {/* Band Venue Owner Routes */}
                    <Route path="/venue" element={<LayoutWrapper LayoutComponent={BandVenueLayout} />}>
                      <Route path="dashboard" element={<BandVenueDashboard />} />
                      <Route path="profile" element={<BandVenueProfile />} />
                      <Route path="my-venues" element={<BandVenueProfile />} />
                      <Route path="bookings" element={<BandVenueBookings />} />
                      <Route path="messages" element={<BandVenueMessages />} />
                      <Route path="reviews" element={<BandVenueReviews />} />
                      <Route path="earnings" element={<BandVenueEarnings />} />
                      <Route path="settings" element={<BandVenueSettings />} />
                    </Route>

                    {/* Band Admin Workspace Routes */}
                    <Route path="/admin" element={<LayoutWrapper LayoutComponent={BandAdminLayout} />}>
                      <Route path="dashboard" element={<BandAdminDashboard />} />
                      <Route path="users" element={<BandAdminUsers />} />
                      <Route path="artists" element={<BandAdminArtists />} />
                      <Route path="venues" element={<BandAdminVenues />} />
                      <Route path="categories" element={<BandAdminCategories />} />
                      <Route path="locations" element={<BandAdminLocations />} />
                      <Route path="promos" element={<BandAdminPromos />} />
                      <Route path="reports" element={<BandAdminReports />} />
                    </Route>

                    {/* Super Admin Routes */}
                    <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                    <Route path="/super-admin/dashboard" element={<LayoutWrapper LayoutComponent={SuperAdminLayout} />}>
                      <Route path="overview" element={<SuperAdminOverview />} />
                      <Route path="all-clubs" element={<SuperAdminAllClubs />} />
                      <Route path="approved-clubs" element={<SuperAdminApprovedClubs />} />
                      <Route path="pending-approvals" element={<SuperAdminPendingApprovals />} />
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
