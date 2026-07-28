// These are the 5 roles in Orvyn PMS
// Every app (Web, Admin, Mobile, API) imports from here
// If you add a new role, you add it HERE and all apps get it automatically

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',       // Platform: Admin Panel only
  OWNER = 'OWNER',                   // Platform: Web App now, Web + Mobile later
  MANAGER = 'MANAGER',               // Platform: Web App now, Web + Mobile later
  RECEPTION_STAFF = 'RECEPTION_STAFF', // Platform: Web App now, Web + Mobile later
  VIEWER = 'VIEWER',                 // Platform: Web App now, Web + Mobile later
}
