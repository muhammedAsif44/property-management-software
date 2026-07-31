export type Language = 'en' | 'ml';

export const translations = {
  en: {
    // Top Bar & App Header
    appName: 'Orvyn PMS',
    activeManagementHub: 'Active Management Hub',
    onboarding: 'Onboarding',
    noPropertySelected: 'No Property Selected',
    switchProperty: 'Switch Property',
    onboardProperty: 'Onboard Property',
    addProperty: 'Add Property',
    settings: 'Settings',
    signOut: 'Sign Out',
    liveActive: 'Live Active',

    // Role Titles & Badges
    owner: 'Owner',
    manager: 'Manager',
    reception: 'Reception',
    viewer: 'Viewer',
    propertyOwner: 'Property Owner',
    operationsManager: 'Operations Manager',
    receptionStaff: 'Reception Staff',
    propertyViewer: 'Property Viewer',

    ownerPortal: 'Owner Portal',
    managerPortal: 'Manager Portal',
    receptionPortal: 'Reception Portal',
    viewerPortal: 'Viewer Portal',

    ownerCommandCenterBanner: 'Property Owner Command Center',
    operationsManagerBanner: 'Operations Manager Dashboard',
    receptionPortalBanner: 'Reception & Front Desk Portal',
    viewerObserverBanner: 'Read-Only Property Observer',

    // Navigation Menu Items
    dashboard: 'Dashboard',
    properties: 'Properties',
    staffDirectory: 'Staff Directory',
    bookings: 'Bookings',
    roomsAndUnits: 'Rooms & Units',
    guests: 'Guests',
    invoicesAndBilling: 'Invoices & Billing',
    comingSoon: 'Soon',

    // Quick Actions Strip
    quickActionsAndWorkflows: 'Quick Actions & Workflows',
    quickActionsSubtitle: 'Fast shortcuts for daily property operations.',
    autoCheckoutExpiredStays: 'Auto-Checkout Expired Stays',
    syncing: 'Syncing...',

    // Dashboard Cards & Summaries
    todayRevenue: "Today's Revenue",
    monthlyRevenue: 'Monthly Revenue',
    occupancyRate: 'Occupancy Rate',
    todayCheckIns: "Today's Check-Ins",
    todayCheckOuts: "Today's Check-Outs",

    // Bookings & Reminders Feed
    recentBookingsFeed: 'Recent Reservations Feed',
    recentBookingsSubtitle: 'Real-time feed of guest check-ins, bookings, and balances.',
    pendingTacReminders: 'Pending TAC Commission Reminders',
    noRecentBookings: 'No recent reservations recorded yet',
    newBookingsAppearHere: 'New guest bookings will appear here automatically.',

    // Staff Directory Page
    propertyStaffDirectory: 'Property Staff Directory',
    staffDirectorySubtitle: 'Manage team roles, access states, and property operations permissions.',
    member: 'Member',
    assignedRole: 'Assigned Role',
    status: 'Status',
    invitedJoined: 'Invited / Joined',
    actions: 'Actions',
    active: 'Active',
    invited: 'Invited',
    suspended: 'Suspended',
    noStaffInvitedYet: 'No staff members invited yet',
    inviteStaffSubtitle: 'Invite your managers, receptionists, or viewers to start collaborating.',

    // Unified Settings Hub
    unifiedSettingsHub: 'Unified Settings Hub',
    accountAndSecurity: 'Account & Security',
    propertyConfiguration: 'Property Configuration',
    changePassword: 'Change Password',
    changeEmail: 'Change Email Address',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    updatePassword: 'Update Password',
    updateEmail: 'Update Email Address',
    secureLogout: 'Secure Logout',

    // Property Settings & Wizard
    propertySettings: 'Property Settings',
    propertyDetails: 'Property Details',
    propertyName: 'Property Name',
    streetAddress: 'Street Address',
    city: 'City',
    state: 'State',
    currency: 'Currency',
    timezone: 'Timezone',
    checkInTime: 'Check-In Time',
    checkOutTime: 'Check-Out Time',
    onboardNewProperty: 'Onboard New Property',
    onboardingWizard: 'Property Onboarding Wizard',

    // Invite Staff Modal
    inviteTeamMember: 'Invite Team Member',
    staffEmail: 'Staff Email Address',
    selectRole: 'Select Role',
    sendInvitation: 'Send Invitation',
    sending: 'Sending...',

    // Confirmation Modals
    confirmSuspendTitle: 'Confirm Staff Suspension',
    confirmSuspendText: "Are you sure you want to suspend this staff member's access?",
    confirmReactivateTitle: 'Confirm Staff Reactivation',
    confirmReactivateText: 'Are you sure you want to reactivate this staff member?',
    confirmDeleteTitle: 'Confirm Permanent Deletion',
    confirmDeleteText: 'Are you sure you want to permanently delete this staff member? This action cannot be undone.',
    confirmAction: 'Confirm',

    // Common Actions
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    suspend: 'Suspend',
    reactivate: 'Reactivate',
    inviteStaff: 'Invite Staff Member',
    accessRestricted: 'Access Restricted',

    // Property Switcher & Onboarding Modal
    noPropertiesYet: 'No properties yet',
    createFirstProperty: 'Create your first property below',
    noInvoiceTemplates: 'No Invoice Templates Available',
    skipStep: 'You can skip this step and configure later.',
    registeringProperty: 'Registering Property...',
    saveProperty: 'Save Property',
    addHotelSubtitle: 'Add a Hotel, Resort, Villa, or Homestay to your portfolio.',
    verifyingSession: 'Verifying Session...',

    // Properties Portfolio Hub
    propertiesPortfolio: 'Properties Portfolio',
    propertiesPortfolioSubtitle: "Manage, switch, and configure your organization's property collection.",
    activePropertyBadge: 'Active Workspace',
    switchActive: 'Make Active',
    manageDetails: 'Manage Settings',
    totalUnitsLabel: 'Units',
    roomTypesCountLabel: 'Room Types',
    searchPropertiesPlaceholder: 'Search by property name, city, or address...',
    filterAll: 'All Properties',
    filterActive: 'Active Workspace',
    filterLive: 'Live Active',
    filterSetup: 'In Onboarding',
    checkInCheckOutPolicy: 'Check-In / Out',
    paymentDetailsConfigured: 'Payments & Banking',
    configured: 'Configured',
    pendingSetup: 'Pending Setup',
    onboardingCompletion: 'Onboarding Progress',
    viewFullSettings: 'Configure Settings',
    switchActiveWorkspace: 'Set Active Workspace',
    currentWorkspace: 'Current Workspace',
  },
  ml: {
    // Top Bar & App Header
    appName: 'ഓർവിൻ PMS',
    activeManagementHub: 'പ്രവർത്തന ഹബ്',
    onboarding: 'ഓൺബോർഡിംഗ്',
    noPropertySelected: 'പ്രോപ്പർട്ടി തിരഞ്ഞെടുത്തിട്ടില്ല',
    switchProperty: 'പ്രോപ്പർട്ടി മാറ്റുക',
    onboardProperty: 'പ്രോപ്പർട്ടി ചേർക്കുക',
    addProperty: 'പ്രോപ്പർട്ടി ചേർക്കുക',
    settings: 'ക്രമീകരണങ്ങൾ',
    signOut: 'സൈൻ ഔട്ട്',
    liveActive: 'സജീവം',

    // Role Titles & Badges
    owner: 'ഉടമ',
    manager: 'മാനേജർ',
    reception: 'റിസപ്ഷൻ',
    viewer: 'വീവർ',
    propertyOwner: 'പ്രോപ്പർട്ടി ഉടമ',
    operationsManager: 'ഓപ്പറേഷൻസ് മാനേജർ',
    receptionStaff: 'റിസപ്ഷൻ സ്റ്റാഫ്',
    propertyViewer: 'പ്രോപ്പർട്ടി വീവർ',

    ownerPortal: 'ഓണർ പോർട്ടൽ',
    managerPortal: 'മാനേജർ പോർട്ടൽ',
    receptionPortal: 'റിസപ്ഷൻ പോർട്ടൽ',
    viewerPortal: 'വീവർ പോർട്ടൽ',

    ownerCommandCenterBanner: 'പ്രോപ്പർട്ടി ഓണർ കമാൻഡ് സെന്റർ',
    operationsManagerBanner: 'ഓപ്പറേഷൻസ് മാനേജർ ഡാഷ്‌ബോർഡ്',
    receptionPortalBanner: 'റിസപ്ഷൻ & ഫ്രണ്ട് ഡെസ്ക് പോർട്ടൽ',
    viewerObserverBanner: 'റീഡ്-ഓൺലി പ്രോപ്പർട്ടി ഒബ്‌സർവർ',

    // Navigation Menu Items
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    properties: 'പ്രോപ്പർട്ടികൾ',
    staffDirectory: 'സ്റ്റാഫ് ഡയറക്ടറി',
    bookings: 'ബുക്കിംഗുകൾ',
    roomsAndUnits: 'മുറികൾ & യൂണിറ്റുകൾ',
    guests: 'അതിഥികൾ',
    invoicesAndBilling: 'ഇൻവോയ്സുകൾ & ബില്ലിംഗ്',
    comingSoon: 'ഉടൻ വരുന്നു',

    // Quick Actions Strip
    quickActionsAndWorkflows: 'ക്വിക് ആക്ഷൻസ് & വർക്ക്ഫ്ലോകൾ',
    quickActionsSubtitle: 'ദൈനംദിന പ്രോപ്പർട്ടി പ്രവർത്തനങ്ങൾക്കുള്ള കുറുക്കുവഴികൾ.',
    autoCheckoutExpiredStays: 'ഓട്ടോ-ചെക്ക്ഔട്ട് എക്സ്പയർ ചെയ്ത സ്റ്റേകൾ',
    syncing: 'സിങ്ക് ചെയ്യുന്നു...',

    // Dashboard Cards & Summaries
    todayRevenue: 'ഇന്നത്തെ വരുമാനം',
    monthlyRevenue: 'പ്രതിമാസ വരുമാനം',
    occupancyRate: 'ഓക്യുപെൻസി നിരക്ക്',
    todayCheckIns: 'ഇന്നത്തെ ചെക്ക്-ഇന്നുകൾ',
    todayCheckOuts: 'ഇന്നത്തെ ചെക്ക്-ഔട്ടുകൾ',

    // Bookings & Reminders Feed
    recentBookingsFeed: 'സമീപകാല റിസർവേഷനുകൾ',
    recentBookingsSubtitle: 'അതിഥി ചെക്ക്-ഇന്നുകൾ, ബുക്കിംഗുകൾ, ബാലൻസുകൾ എന്നിവയുടെ തത്സമയ ഫീഡ്.',
    pendingTacReminders: 'പെൻഡിംഗ് TAC കമ്മീഷൻ ഓർമ്മപ്പെടുത്തലുകൾ',
    noRecentBookings: 'ഇതുവരെ സമീപകാല റിസർവേഷനുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല',
    newBookingsAppearHere: 'പുതിയ അതിഥി ബുക്കിംഗുകൾ സ്വയമേവ ഇവിടെ ദൃശ്യമാകും.',

    // Staff Directory Page
    propertyStaffDirectory: 'പ്രോപ്പർട്ടി സ്റ്റാഫ് ഡയറക്ടറി',
    staffDirectorySubtitle: 'ടീം റോളുകൾ, പ്രവേശന നിലകൾ, പ്രോപ്പർട്ടി പ്രവർത്തന അനുമതികൾ എന്നിവ കൈകാര്യം ചെയ്യുക.',
    member: 'അംഗം',
    assignedRole: 'നിയോഗിച്ച റോൾ',
    status: 'സ്റ്റാറ്റസ്',
    invitedJoined: 'ക്ഷണം / ചേർന്ന തീയതി',
    actions: 'നടപടികൾ',
    active: 'സജീവം',
    invited: 'ക്ഷണിച്ചു',
    suspended: 'സസ്പെൻഡ് ചെയ്തു',
    noStaffInvitedYet: 'ഇതുവരെ സ്റ്റാഫ് അംഗങ്ങളെയൊന്നും ക്ഷണിച്ചിട്ടില്ല',
    inviteStaffSubtitle: 'നിങ്ങളുടെ മാനേജർമാരെയോ റിസപ്ഷനിസ്റ്റുകളെയോ വീവർമാരെയോ ക്ഷണിക്കുക.',

    // Unified Settings Hub
    unifiedSettingsHub: 'യൂണിഫൈഡ് ക്രമീകരണ ഹബ്',
    accountAndSecurity: 'അക്കൗണ്ട് & സെക്യൂരിറ്റി',
    propertyConfiguration: 'പ്രോപ്പർട്ടി വിവരങ്ങൾ',
    changePassword: 'പാസ്‌വേഡ് മാറ്റുക',
    changeEmail: 'ഇമെയിൽ വിലാസം മാറ്റുക',
    currentPassword: 'നിലവിലെ പാസ്‌വേഡ്',
    newPassword: 'പുതിയ പാസ്‌വേഡ്',
    confirmNewPassword: 'പുതിയ പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക',
    updatePassword: 'പാസ്‌വേഡ് അപ്‌ഡേറ്റ് ചെയ്യുക',
    updateEmail: 'ഇമെയിൽ വിലാസം അപ്‌ഡേറ്റ് ചെയ്യുക',
    secureLogout: 'ലോഗ് ഔട്ട് ചെയ്യുക',

    // Property Settings & Wizard
    propertySettings: 'പ്രോപ്പർട്ടി ക്രമീകരണങ്ങൾ',
    propertyDetails: 'പ്രോപ്പർട്ടി വിവരങ്ങൾ',
    propertyName: 'പ്രോപ്പർട്ടി പേര്',
    streetAddress: 'തെരുവ് വിലാസം',
    city: 'നഗരം',
    state: 'സംസ്ഥാനം',
    currency: 'കറൻസി',
    timezone: 'ടൈംസോൺ',
    checkInTime: 'ചെക്ക്-ഇൻ സമയം',
    checkOutTime: 'ചെക്ക്-ഔട്ട് സമയം',
    onboardNewProperty: 'പുതിയ പ്രോപ്പർട്ടി ചേർക്കുക',
    onboardingWizard: 'പ്രോപ്പർട്ടി ഓൺബോർഡിംഗ് വിസാർഡ്',

    // Invite Staff Modal
    inviteTeamMember: 'ടീം അംഗത്തെ ക്ഷണിക്കുക',
    staffEmail: 'സ്റ്റാഫ് ഇമെയിൽ വിലാസം',
    selectRole: 'റോൾ തിരഞ്ഞെടുക്കുക',
    sendInvitation: 'ക്ഷണം അയക്കുക',
    sending: 'അയക്കുന്നു...',

    // Confirmation Modals
    confirmSuspendTitle: 'സ്റ്റാഫ് സസ്‌പെൻഷൻ സ്ഥിരീകരിക്കുക',
    confirmSuspendText: 'ഈ സ്റ്റാഫ് അംഗത്തെ സസ്പെൻഡ് ചെയ്യണമെന്ന് ഉറപ്പാണോ? ഇവർക്ക് പ്രോപ്പർട്ടി പ്രവേശനം താൽക്കാലികമായി നഷ്ടപ്പെടും.',
    confirmReactivateTitle: 'വീണ്ടും സജീവമാക്കൽ സ്ഥിരീകരിക്കുക',
    confirmReactivateText: 'ഈ സ്റ്റാഫ് അംഗത്തെ വീണ്ടും സജീവമാക്കണമെന്ന് ഉറപ്പാണോ?',
    confirmDeleteTitle: 'സ്ഥിരമായി നീക്കം ചെയ്യൽ സ്ഥിരീകരിക്കുക',
    confirmDeleteText: 'ഈ സ്റ്റാഫ് അംഗത്തെ സ്ഥിരമായി നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ? ഈ നടപടി തിരിച്ചെടുക്കാൻ കഴിയില്ല.',
    confirmAction: 'സ്ഥിരീകരിക്കുക',

    // Common Actions
    save: 'സേവ് ചെയ്യുക',
    cancel: 'റദ്ദാക്കുക',
    edit: 'എഡിറ്റ്',
    delete: 'നീക്കം ചെയ്യുക',
    suspend: 'സസ്പെൻഡ് ചെയ്യുക',
    reactivate: 'വീണ്ടും സജീവമാക്കുക',
    inviteStaff: 'സ്റ്റാഫ് അംഗത്തെ ക്ഷണിക്കുക',
    accessRestricted: 'പ്രവേശനം പരിമിതപ്പെടുത്തിയിരിക്കുന്നു',

    // Property Switcher & Onboarding Modal
    noPropertiesYet: 'ഇതുവരെ പ്രോപ്പർട്ടികൾ ഇല്ല',
    createFirstProperty: 'താഴെ നിങ്ങളുടെ ആദ്യ പ്രോപ്പർട്ടി സൃഷ്ടിക്കുക',
    noInvoiceTemplates: 'ഇൻവോയ്സ് ടെംപ്ലേറ്റുകൾ ലഭ്യമല്ല',
    skipStep: 'ഈ ഘട്ടം ഒഴിവാക്കി പിന്നീട് ക്രമീകരിക്കുക.',
    registeringProperty: 'പ്രോപ്പർട്ടി രജിസ്റ്റർ ചെയ്യുന്നു...',
    saveProperty: 'പ്രോപ്പർട്ടി സേവ് ചെയ്യുക',
    addHotelSubtitle: 'ഹോട്ടൽ, റിസോർട്ട്, വില്ല അല്ലെങ്കിൽ ഹോംസ്റ്റേ ചേർക്കുക.',
    verifyingSession: 'സെഷൻ പരിശോധിക്കുന്നു...',

    // Properties Portfolio Hub
    propertiesPortfolio: 'പ്രോപ്പർട്ടി പോർട്ട്‌ഫോളിയോ',
    propertiesPortfolioSubtitle: 'നിങ്ങളുടെ ഓർഗനൈസേഷന്റെ പ്രോപ്പർട്ടി ശേഖരം നിയന്ത്രിക്കുകയും ക്രമീകരിക്കുകയും ചെയ്യുക.',
    activePropertyBadge: 'സജീവ വർക്ക്സ്പേസ്',
    switchActive: 'സജീവമാക്കുക',
    manageDetails: 'ക്രമീകരണങ്ങൾ നിയന്ത്രിക്കുക',
    totalUnitsLabel: 'യൂണിറ്റുകൾ',
    roomTypesCountLabel: 'മുറി തരങ്ങൾ',
    searchPropertiesPlaceholder: 'പ്രോപ്പർട്ടി പേര്, നഗരം അല്ലെങ്കിൽ മേൽവിലാസം വഴി തിരയുക...',
    filterAll: 'എല്ലാ പ്രോപ്പർട്ടികളും',
    filterActive: 'സജീവ വർക്ക്സ്പേസ്',
    filterLive: 'സജീവം',
    filterSetup: 'ഓൺബോർഡിംഗിൽ',
    checkInCheckOutPolicy: 'ചെക്ക്-ഇൻ / ഔട്ട്',
    paymentDetailsConfigured: 'പേയ്‌മെന്റുകൾ & ബാങ്കിംഗ്',
    configured: 'സജ്ജീകരിച്ചു',
    pendingSetup: 'സജ്ജീകരിക്കാൻ ബാക്കി',
    onboardingCompletion: 'ഓൺബോർഡിംഗ് പുരോഗതി',
    viewFullSettings: 'ക്രമീകരണങ്ങൾ സജ്ജമാക്കുക',
    switchActiveWorkspace: 'സജീവ വർക്ക്സ്പേസ് ആക്കുക',
    currentWorkspace: 'നിലവിലെ വർക്ക്സ്പേസ്',
  },
};

export type TranslationKey = keyof typeof translations.en;
