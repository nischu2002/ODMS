ODMS — Online Delivery Management System
A modern, role-based Online Delivery Management System (ODMS) for managing restaurants, orders, riders, staff, menus, notifications, teams, and delivery operations from a centralized web application.

Built with React, TypeScript, Vite, Tailwind CSS, Radix UI, and Supabase, ODMS provides separate dashboards and management workflows for different users across the delivery ecosystem.

✨ Features
🏪 Restaurant Management
Restaurant registration and onboarding
Restaurant management and CRUD operations
Restaurant-specific dashboard
Menu management
Order management
Cash collection management
Restaurant requests and approvals
📦 Order Management
Create and manage orders
Track order status
Manage order-related operations from dashboards
Order deletion workflows
Restaurant and delivery-side order management
🛵 Rider Management
Rider registration and management
Dedicated rider dashboard
Rider location management
GPS-based rider tracking
Rider location viewing
Delivery workflow support
👥 Staff & Team Management
Staff dashboard
Staff management
Team management
Team member management
Role-based access to different areas of the application
🔐 Authentication & Roles
ODMS is structured around multiple user roles, including:

Super Admin
Admin
Restaurant
Rider
Staff
The application includes dedicated login and dashboard experiences for different roles. 
G
GitHub

🔔 Notifications
Notification center
Notification popups
System notification management
Centralized notification workflows
📊 Analytics & Administration
Analytics dashboard/components
Administrative dashboards
Restaurant administration
Rider administration
System management tools
🛠️ Tech Stack
Technology	Purpose
React 18	Frontend UI
TypeScript	Type-safe development
Vite	Development server and build tooling
Supabase	Backend services and database integration
Tailwind CSS	Styling
Radix UI	Accessible UI primitives
React Router	Client-side routing
React Hook Form	Form management
Zod	Schema validation
TanStack React Query	Data fetching/state synchronization
Recharts	Data visualization
Lucide React	Icons

These dependencies and the available project scripts are defined in the repository's package.json. 
G
GitHub

📁 Project Structure
ODMS/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   ├── ui/
│   │   ├── Analytics.tsx
│   │   ├── CMSManager.tsx
│   │   ├── CashCollection.tsx
│   │   ├── CreateOrderForm.tsx
│   │   ├── MenuManagement.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── OrderManagement.tsx
│   │   ├── RestaurantCRUD.tsx
│   │   ├── RiderManagement.tsx
│   │   ├── StaffManagement.tsx
│   │   └── ...
│   │
│   ├── context/            # Application contexts
│   ├── hooks/              # Custom React hooks
│   ├── integrations/
│   │   └── supabase/       # Supabase integration
│   ├── lib/                # Utility functions
│   ├── pages/
│   │   ├── About.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── DomainSetup.tsx
│   │   ├── Login.tsx
│   │   ├── RestaurantDashboard.tsx
│   │   ├── RestaurantSignup.tsx
│   │   ├── RiderDashboard.tsx
│   │   ├── StaffDashboard.tsx
│   │   ├── SuperAdminDashboard.tsx
│   │   └── ...
│   ├── types/              # TypeScript types
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── supabase/
│   ├── functions/          # Supabase Edge Functions
│   └── migrations/         # Database migrations
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── index.html

The current repository separates UI components, pages, application logic, Supabase integration, types, and database/backend configuration into dedicated directories. 
G
GitHub
+3

🚀 Getting Started
Prerequisites
Make sure you have the following installed:

Node.js
npm
A Supabase project
1. Clone the repository
git clone https://github.com/nischu2002/ODMS.git
cd ODMS

2. Install dependencies
npm install

The repository includes both package-lock.json and bun.lockb, so npm or Bun can be used depending on your preferred workflow. 
G
GitHub
+1

3. Configure Supabase
Create or configure your Supabase project and connect it to the application.

Create a .env file in the project root:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Never commit private service-role keys or other sensitive credentials to the repository.

The project contains a dedicated supabase/ directory with database migrations and Supabase functions. 
G
GitHub

4. Start the development server
npm run dev

Vite will start the development server and provide a local URL, normally:

http://localhost:5173

5. Build for production
npm run build

For a development-mode production build:

npm run build:dev

6. Preview the production build
npm run preview

7. Run linting
npm run lint

These commands correspond to the scripts currently defined in package.json. 
G
GitHub

🔄 Application Architecture
At a high level, ODMS follows this structure:

                    ┌─────────────────────┐
                    │      ODMS Web App   │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        Super Admin         Admin            Restaurant
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
           Staff             Rider            Orders
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                         ┌───────────┐
                         │ Supabase  │
                         │ Backend   │
                         └───────────┘

The frontend is organized into role-specific pages and reusable management components, while Supabase provides the application's backend integration and database-related infrastructure. 
G
GitHub
+2

👤 User Roles
Super Admin
Responsible for high-level platform administration and system-wide management.

Admin
Manages operational resources such as restaurants, riders, staff, orders, notifications, and analytics.

Restaurant
Uses the restaurant dashboard to manage restaurant operations, menus, and orders.

Rider
Uses the rider dashboard for delivery operations and location-related functionality.

Staff
Provides operational support through the staff dashboard and staff management workflows.

🧩 Key Components
Some of the major reusable components currently included in the project are:

Analytics
CMSManager
CashCollection
CreateOrderForm
MenuManagement
NotificationCenter
OrderManagement
RestaurantCRUD
RestaurantRequestsManager
RiderDashboard
RiderGPSTracking
RiderLocationManager
RiderLocationViewer
RiderManagement
StaffDashboard
StaffManagement
SystemNotificationsManager
TeamMemberCMS
These components are located under src/components/. 
G
GitHub

🗄️ Supabase
ODMS uses Supabase as its backend integration.

The repository includes:

supabase/
├── functions/
└── migrations/

Database migrations can be maintained in the migrations directory, while backend/server-side functionality can be organized using Supabase functions. 
G
GitHub

🧪 Development
Before submitting changes, it is recommended to run:

npm run lint
npm run build

This helps catch linting issues and TypeScript/build errors before deployment.

📦 Production Deployment
Build the application using:

npm run build

The generated production assets can then be deployed to a static hosting platform or other infrastructure capable of serving a Vite-built React application.

When deploying, make sure the required Supabase environment variables are configured in the hosting environment.

🔒 Security
When deploying ODMS:

Keep Supabase credentials out of source control.
Use environment variables for configuration.
Never expose Supabase service-role keys in frontend code.
Configure appropriate Supabase Row Level Security policies.
Restrict administrative functionality according to user roles.
Validate sensitive operations on the backend rather than relying only on frontend authorization.
🤝 Contributing
Contributions are welcome.

Fork the repository.
Create a feature branch.
git checkout -b feature/your-feature

Make your changes.
Run linting and the production build.
npm run lint
npm run build

Commit your changes.
git commit -m "feat: add your feature"

Push the branch.
git push origin feature/your-feature

Open a Pull Request.
📄 License
No license file is currently shown in the repository. If this project is intended to be open source, add an appropriate LICENSE file before publishing it for external use. 
G
GitHub

🔗 Repository
GitHub: https://github.com/nischu2002/ODMS

👨‍💻 Author
Developed by nischu2002.
