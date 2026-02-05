#  - نظام التسجيل والدخول
#  Registration & Login System

A professional Arabic web application for the  () mobile application, implementing user authentication and registration services for both Egyptian citizens and foreign nationals.

## 🌟 Features

- **Arabic RTL Interface**: Fully Arabic interface with right-to-left layout
- **Dual Registration Paths**:
  - Egyptian Citizens: National ID-based registration
  - Foreign Residents: Passport-based registration
- **SMS Activation**: 4-digit code verification after registration
- **User Authentication**: Secure token-based login system
- **Profile Management**: View complete user profile with authenticated API calls
- **Password Recovery**: Forgot password flow with email verification
- **Professional Design**: Government-grade UI/UX design
- **Form Validation**: Client-side validation matching API requirements
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: API errors displayed directly to users in Arabic
- **Session Management**: Token expiration handling and automatic logout

## 📋 Project Structure

```
mmm-demo/
├── src/
│   ├── components/
│   │   ├── Login.jsx                      # Login page
│   │   ├── ForgotPassword.jsx             # Password recovery page
│   │   ├── RegistrationStep1.jsx          # Basic info + nationality selection
│   │   ├── RegistrationStep2Citizen.jsx   # Egyptian citizen registration
│   │   ├── RegistrationStep2Foreigner.jsx # Foreigner registration
│   │   ├── ActivationCode.jsx             # SMS code verification
│   │   ├── RegistrationSuccess.jsx        # Success confirmation page
│   │   ├── Dashboard.jsx                  # User dashboard after login
│   │   └── Profile.jsx                    # User profile with authenticated API
│   ├── services/
│   │   └── api.js                         # API service layer
│   ├── utils/
│   │   └── validation.js                  # Form validation functions
│   ├── styles/
│   │   ├── Auth.css                       # Authentication pages styling
│   │   └── Dashboard.css                  # Dashboard & profile styling
│   ├── App.jsx                            # Main app with routing
│   ├── main.jsx                           # App entry point
│   └── index.css                          # Global styles
├── docs/
│   ├── API_DOCUMENTATION.md               # Complete API documentation
│   └── POST_REGISTRATION_FLOWS.md         # Post-registration API flows
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download the project:
```bash
cd mmm-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 📱 Application Flow

### Login Flow
1. User enters username/mobile and password
2. Credentials validated against  API
3. Upon success, user redirected to dashboard with stored token
4. Forgot password option available for password recovery

### Registration Flow

#### Step 1: Basic Information
- Full Name
- Email
- Mobile (Egyptian format: 01XXXXXXXXX)
- Password & Confirmation
- Nationality Selection

#### Step 2a: Egyptian Citizen
- National ID (14 digits)
- Card Factory Number (9 digits)
- Mother's First Name
- Governorate (dropdown)
- Address (10-100 characters)
- Job Title (4-100 characters)

#### Step 2b: Foreign Resident
- Passport Number
- Address (10-100 characters)
- Job Title (4-100 characters)

#### Step 3: SMS Activation
- User receives 4-digit code via SMS
- Enter code in activation screen
- Auto-focus between input boxes
- Resend code option with countdown timer
- Upon successful activation, user is automatically logged in

#### Step 4: Dashboard
- Welcome message with user info
- View full profile option
- Logout functionality

### Profile Management
1. User clicks "View Profile" from dashboard
2. Authenticated API call fetches complete user data
3. Display all user information including:
   - Personal details (name, email, mobile)
   - Egyptian citizens: National ID, governorate, mother's name
   - Foreign residents: Passport number, nationality
   - Address and job title
4. Token validation ensures secure access

### Password Recovery
1. User clicks "Forgot Password" on login
2. Enter email and National ID/Passport
3. System sends password reset link to email
4. User completes reset via email link

## 🔐 API Integration

The application integrates with the  API:

**Base URL**: `https://webapi.moi.gov.eg`

### Main Endpoints:
- `POST /token` - User login
- `POST /api/mobile_memberApi/RegisterCitizen` - Register Egyptian citizen
- `POST /api/mobile_memberApi/RegisterForeigner` - Register foreigner
- `POST /api/mobile_memberApi/ActivateBySMS` - Activate account with SMS code
- `POST /api/mobile_memberApi/RequestForgetPassword` - Request password reset
- `GET /api/MoiProfileApi/GetProfile` - Get user profile (authenticated)
- `GET /api/MoiMasterDataApi/GetNationalities` - Get nationalities list
- `GET /api/MoiMasterDataApi/GetGovernorates` - Get governorates list

For complete API documentation, see [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) and [docs/POST_REGISTRATION_FLOWS.md](docs/POST_REGISTRATION_FLOWS.md)

## ✅ Validation Rules

### Egyptian Mobile Number
- Must start with `01`
- Exactly 11 digits
- Pattern: `^01[0-9]{9}$`

### National ID
- Exactly 14 digits
- Pattern: `^[0-9]{14}$`

### Card Factory Number
- Exactly 9 digits
- Pattern: `^[0-9]{9}$`

### Email
- Standard email format
- Pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### Password
- Minimum 6 characters
- No complexity requirements

### Address
- Minimum 10 characters
- Maximum 100 characters

### Job Title
- Minimum 4 characters
- Maximum 100 characters

## 🎨 Design Features

- **Color Scheme**: Professional gradient (Purple/Blue) suitable for government applications
- **Typography**: Arabic-optimized fonts with RTL support
- **Animations**: Smooth transitions and loading states
- **Accessibility**: Form labels, error messages, and keyboard navigation
- **Responsive**: Mobile-first design with tablet and desktop breakpoints

## 🛡️ Security Features

- Bearer token authentication for protected routes
- Automatic token expiration handling (401 responses)
- Client-side validation before API calls
- Secure password input fields
- Session storage for multi-step registration
- localStorage for authentication tokens
- Automatic logout on session expiration
- Protected routes with navigation guards
- CORS bypass via Vite proxy in development

## 🐛 Error Handling

All API errors are:
1. Caught and handled gracefully
2. Displayed in Arabic to the user
3. Shown exactly as returned by the API (no custom messages)
4. Cleared when user starts typing again

## 📦 Technologies Used

- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and dev server
- **CSS3** - Styling with modern features
- **Fetch API** - HTTP requests

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This is a demonstration project for the .

## 👨‍💻 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- RTL-first approach for Arabic UI
- Component-based architecture
- Separation of concerns (services, utils, components)
- Professional naming conventions
- Comprehensive comments and documentation

## 📞 Support

For API-related questions or issues, refer to the [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) file.

---

**Built with ❤️ for the **
